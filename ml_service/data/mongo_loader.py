"""
data/mongo_loader.py
====================
Central data loader — fetches raw documents from MongoDB using PyMongo.
All ML models call these functions to get training/inference data.

HOW IT WORKS:
  1. Connects to MongoDB once (singleton client)
  2. Fetches students, drives, applications as Python dicts
  3. Joins collections manually (like SQL JOIN but in Python)
  4. Returns clean pandas DataFrames for ML training
"""

import pandas as pd
from pymongo import MongoClient
from bson import ObjectId
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import MONGO_URI, DB_NAME


# ── Singleton MongoDB client ──────────────────────────────────────────────────
_client = None
_db     = None

def get_db():
    """Returns a live MongoDB database handle (reuses connection)."""
    global _client, _db
    if _db is None:
        _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        _db = _client[DB_NAME]
    return _db


# ── Student loader ────────────────────────────────────────────────────────────
def load_students() -> pd.DataFrame:
    """
    Fetches all students and returns a clean DataFrame with ML-ready features.

    Columns returned:
        _id, full_name, email, cgpa, active_backlogs, dsa_marks,
        oops_marks, skills, readiness_score, tier, verification_status,
        rejection_count, skill_count, has_core_skill
    """
    db = get_db()
    docs = list(db.students.find({}, {
        "password": 0, "__v": 0, "mark_sheet_url": 0, "google_id": 0
    }))

    if not docs:
        return pd.DataFrame()

    df = pd.DataFrame(docs)
    df["_id"] = df["_id"].astype(str)

    # Feature engineering
    df["skill_count"]    = df["skills"].apply(lambda s: len(s) if isinstance(s, list) else 0)
    CORE_SKILLS = {"java", "python", "react", "node.js", "dsa", "c++", "sql", "javascript"}
    df["has_core_skill"] = df["skills"].apply(
        lambda s: int(any(sk.lower() in CORE_SKILLS for sk in (s or [])))
    )

    # Numeric safety
    for col in ["cgpa", "dsa_marks", "oops_marks", "active_backlogs", "rejection_count"]:
        df[col] = pd.to_numeric(df.get(col, 0), errors="coerce").fillna(0)

    return df


# ── Drive loader ──────────────────────────────────────────────────────────────
def load_drives() -> pd.DataFrame:
    """
    Fetches all company drives.

    Columns: _id, company_name, job_role, min_cgpa_required,
             max_backlogs_allowed, required_skills, avg_package, status
    """
    db = get_db()
    docs = list(db.companydrives.find({}, {"admin_id": 0, "__v": 0}))

    if not docs:
        return pd.DataFrame()

    df = pd.DataFrame(docs)
    df["_id"] = df["_id"].astype(str)
    df["required_skills"] = df["required_skills"].apply(
        lambda s: s if isinstance(s, list) else []
    )
    df["skill_text"] = df.apply(
        lambda r: f"{r['company_name']} {r['job_role']} " + " ".join(r["required_skills"]),
        axis=1
    )
    return df


# ── Application loader (with join) ────────────────────────────────────────────
def load_applications_with_students() -> pd.DataFrame:
    """
    Fetches all applications and JOIN-s student profile onto each.
    This is the TRAINING DATA for the placement predictor.

    Returns rows where status = Selected (label=1) or Rejected (label=0).
    Includes full student features at time of application.
    """
    db = get_db()

    # Fetch applications with terminal outcomes only
    apps = list(db.applications.find(
        {"status": {"$in": ["Selected", "Rejected"]}},
        {"student_id": 1, "drive_id": 1, "status": 1, "_id": 0}
    ))

    if not apps:
        return pd.DataFrame()

    # Build student lookup dict  (id -> profile)
    students_df = load_students()
    if students_df.empty:
        return pd.DataFrame()
    student_map = {row["_id"]: row for _, row in students_df.iterrows()}

    rows = []
    for app in apps:
        sid = str(app["student_id"])
        if sid not in student_map:
            continue
        s = student_map[sid]
        rows.append({
            "cgpa":             s["cgpa"],
            "dsa_marks":        s["dsa_marks"],
            "oops_marks":       s["oops_marks"],
            "active_backlogs":  s["active_backlogs"],
            "skill_count":      s["skill_count"],
            "has_core_skill":   s["has_core_skill"],
            "rejection_count":  s["rejection_count"],
            "label":            1 if app["status"] == "Selected" else 0,
        })

    return pd.DataFrame(rows)


# ── Stats for RAG ─────────────────────────────────────────────────────────────
def load_placement_stats() -> dict:
    """
    Returns aggregate placement statistics for RAG document generation.
    """
    db = get_db()
    total_students  = db.students.count_documents({})
    verified        = db.students.count_documents({"verification_status": "Approved"})
    selected        = db.applications.count_documents({"status": "Selected"})
    rejected        = db.applications.count_documents({"status": "Rejected"})
    total_apps      = db.applications.count_documents({})
    active_drives   = db.companydrives.count_documents({"status": {"$in": ["Active", "Upcoming"]}})

    return {
        "total_students":  total_students,
        "verified":        verified,
        "selected":        selected,
        "rejected":        rejected,
        "total_apps":      total_apps,
        "active_drives":   active_drives,
        "placement_rate":  round(selected / max(total_apps, 1) * 100, 1),
    }
