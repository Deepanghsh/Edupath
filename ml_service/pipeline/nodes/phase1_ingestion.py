"""
pipeline/nodes/phase1_ingestion.py
====================================
Phase 1: Ingestion & Pre-processing

Node 1 — Cache Check
  Hashes SHA-256(student_id + today's date).
  Queries MongoDB `pipeline_cache` collection.
  If found and not expired → returns cached result immediately.
  This skips all ML computation for repeated requests on same day.

Node 2 — Profile Loader
  Uses PyMongo to fetch:
    - Full student document from `students` collection
    - All applications for this student from `applications`
    - All drives from `companydrives`
  Stores raw docs in state for downstream nodes.

Node 3 — Essence Extractor
  Distills the raw profile into a structured "essence" dict:
    - Key numeric metrics (CGPA, DSA, OOPs, etc.)
    - Text representation (for TF-IDF drift check in Phase 2)
    - Quick eligibility summary (how many drives can they apply to?)
  This is analogous to Odis's "Essence Extractor" LLM call,
  but done deterministically from structured data.
"""

import hashlib
from datetime import datetime, timezone
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from data.mongo_loader import get_db, load_students, load_drives
from pipeline.state import PipelineState


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Node 1 — Cache Check
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def node_cache_check(state: PipelineState) -> PipelineState:
    """
    Checks MongoDB `pipeline_cache` for a cached result.

    Cache key = SHA-256(student_id + YYYY-MM-DD)
    → Same student gets fresh result each calendar day
    → Repeated API calls within the day are instant (no ML compute)

    WHY SHA-256:
      Opaque key, fixed length, collision-resistant.
      If student_id contains special chars, the hash is always safe.
    """
    today      = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    cache_key  = hashlib.sha256(f"{state.student_id}:{today}".encode()).hexdigest()

    try:
        db  = get_db()
        hit = db.pipeline_cache.find_one({"_id": cache_key})
        if hit:
            now     = datetime.now(timezone.utc)
            expires = hit.get("expires_at")
            # MongoDB stores naive datetimes — make it timezone-aware before comparing
            if expires and isinstance(expires, datetime):
                if expires.tzinfo is None:
                    expires = expires.replace(tzinfo=timezone.utc)
            if expires and (expires > now):
                print(f"  [Cache] HIT — key={cache_key[:16]}...")
                state.cache_hit     = True
                state.cached_result = hit.get("result", {})
                return state
    except Exception as e:
        # Cache miss on error is acceptable — continue pipeline
        state.errors.append(f"cache_check: {str(e)}")

    state.pipeline_meta["cache_key"] = cache_key
    print(f"  [Cache] MISS — running full pipeline")
    return state


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Node 2 — Profile Loader
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def node_profile_loader(state: PipelineState) -> PipelineState:
    """
    Loads all relevant MongoDB documents for this student into state.

    Documents fetched:
      - students: full profile (cgpa, skills, marks, etc.)
      - applications: this student's application history
      - companydrives: all drives (for eligibility + recommender)

    The raw data is stored as plain Python dicts (no ObjectId — converted to str).
    """
    from bson import ObjectId

    db = get_db()

    # -- Fetch student document --
    student = db.students.find_one(
        {"$or": [
            {"_id":   ObjectId(state.student_id) if len(state.student_id) == 24 else None},
            {"email": state.student_id},
        ]},
        {"password": 0, "__v": 0}
    )
    if not student:
        # Try by string _id match
        students_df = load_students()
        row = students_df[students_df["_id"] == state.student_id]
        if row.empty:
            state.errors.append("profile_loader: Student not found")
            return state
        student = row.iloc[0].to_dict()
    else:
        student["_id"] = str(student["_id"])

    state.raw_profile = student

    # -- Fetch this student's applications --
    try:
        sid = student.get("_id", state.student_id)
        apps = list(db.applications.find({"student_id": ObjectId(sid) if len(str(sid)) == 24 else sid}))
        state.raw_applications = [
            {**a, "_id": str(a["_id"]), "student_id": str(a["student_id"]), "drive_id": str(a["drive_id"])}
            for a in apps
        ]
    except Exception as e:
        state.errors.append(f"profile_loader:apps: {str(e)}")
        state.raw_applications = []

    # -- Fetch all drives --
    try:
        drives_df = load_drives()
        state.raw_drives = drives_df.to_dict(orient="records")
    except Exception as e:
        state.errors.append(f"profile_loader:drives: {str(e)}")
        state.raw_drives = []

    print(f"  [ProfileLoader] student={student.get('full_name','?')} | "
          f"apps={len(state.raw_applications)} | drives={len(state.raw_drives)}")
    return state


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Node 3 — Essence Extractor
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def node_essence_extractor(state: PipelineState) -> PipelineState:
    """
    Distills the raw profile into a structured "essence" dict.
    This is the normalized, ML-ready representation of the student.

    Analogous to Odis's LLM Essence Extractor — but deterministic.
    No hallucination possible. Every field is computed from raw data.

    Essence structure:
      {
        numeric: {...},       # all numerical features
        categorical: {...},   # branch, year, tier, verification
        skills: [...],        # normalized skill list
        history: {...},       # application history summary
        eligibility: {...},   # how many drives can they apply to
        text_repr: str,       # joined text for TF-IDF drift check
      }
    """
    if not state.raw_profile:
        state.errors.append("essence_extractor: no profile available")
        return state

    p = state.raw_profile
    skills    = [s.lower() for s in (p.get("skills") or [])]
    cgpa      = float(p.get("cgpa", 0))
    dsa       = float(p.get("dsa_marks", 0))
    oops      = float(p.get("oops_marks", 0))
    backlogs  = int(p.get("active_backlogs", 0))
    rej_count = int(p.get("rejection_count", 0))

    # Application history summary
    statuses  = [a.get("status", "") for a in state.raw_applications]
    apps_hist = {
        "total":       len(statuses),
        "selected":    statuses.count("Selected"),
        "rejected":    statuses.count("Rejected"),
        "shortlisted": statuses.count("Shortlisted"),
        "applied":     statuses.count("Applied"),
        "success_rate": round(statuses.count("Selected") / max(len(statuses), 1) * 100, 1),
    }

    # Drive eligibility summary
    eligible_drives = [
        d for d in state.raw_drives
        if float(d.get("min_cgpa_required", 0)) <= cgpa
        and int(d.get("max_backlogs_allowed", 0)) >= backlogs
        and d.get("status", "") in ["Active", "Upcoming"]
    ]

    # Text representation for TF-IDF drift guard
    text_repr = (
        f"{p.get('branch','')} {p.get('year','')} "
        f"cgpa {cgpa:.1f} dsa {dsa:.0f} oops {oops:.0f} "
        f"backlogs {backlogs} rejections {rej_count} "
        f"skills {' '.join(skills)} "
        f"tier {p.get('tier','Tier3')} "
        f"verified {p.get('verification_status','Pending')}"
    )

    state.essence = {
        "numeric": {
            "cgpa":           cgpa,
            "dsa_marks":      dsa,
            "oops_marks":     oops,
            "active_backlogs": backlogs,
            "rejection_count": rej_count,
            "skill_count":    len(skills),
            "readiness_score": float(p.get("readiness_score", 0)),
        },
        "categorical": {
            "branch":              p.get("branch", ""),
            "year":                p.get("year", ""),
            "tier":                p.get("tier", "Tier3"),
            "verification_status": p.get("verification_status", "Pending"),
        },
        "skills":      skills,
        "history":     apps_hist,
        "eligibility": {
            "eligible_drive_count":   len(eligible_drives),
            "total_drive_count":      len(state.raw_drives),
            "eligible_drive_names":   [d.get("company_name","") for d in eligible_drives[:5]],
        },
        "text_repr":   text_repr,
        "student_name": p.get("full_name", "Student"),
    }

    print(f"  [EssenceExtractor] CGPA={cgpa} | Skills={len(skills)} | "
          f"Eligible drives={len(eligible_drives)}/{len(state.raw_drives)}")
    return state
