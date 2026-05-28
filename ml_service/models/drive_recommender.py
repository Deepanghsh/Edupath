"""
models/drive_recommender.py
============================
ML Model 2: Drive Recommendation using TF-IDF + Cosine Similarity

HOW IT WORKS:
  1. Convert every company drive into a "text document":
       "Cognizant Full Stack Developer React Node.js MongoDB"
  2. Convert student profile into a similar text document:
       "CSE React Python SQL Java"
  3. TF-IDF vectorizes all documents into numerical vectors
       - Words that appear in few drives get higher weight (rare=important)
       - Common words like "and", "the" get near-zero weight
  4. Cosine similarity measures angle between student vector and drive vectors
       - 1.0 = perfect match, 0.0 = no overlap
  5. Apply hard eligibility filters (CGPA, backlogs) on top
  6. Return ranked list with match percentage

WHY TF-IDF + COSINE:
  - No training data needed (unsupervised)
  - Works with any number of drives/students
  - Naturally handles skill synonyms partially (React, react.js)
  - Fast, interpretable, no GPU needed
"""

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from data.mongo_loader import load_drives, load_students


def _build_student_text(skills: list, branch: str = "") -> str:
    """Convert student profile to a text document for TF-IDF matching."""
    parts = []
    if branch:
        parts.append(branch.lower())
    for skill in (skills or []):
        # Add skill twice to increase its weight in TF-IDF
        clean = skill.lower().replace(".", "").replace("/", " ")
        parts.extend([clean, clean])
    return " ".join(parts)


def _build_drive_text(drive: dict) -> str:
    """Convert drive info to a text document."""
    parts = [
        drive.get("company_name", "").lower(),
        drive.get("job_role", "").lower(),
    ]
    for skill in drive.get("required_skills", []):
        clean = skill.lower().replace(".", "").replace("/", " ")
        parts.extend([clean, clean])   # weight skills higher
    return " ".join(parts)


def recommend(student_id: str, top_n: int = 5) -> list:
    """
    Recommends the most suitable drives for a given student.

    Steps:
    1. Fetch student from MongoDB by ID
    2. Fetch all active/upcoming drives from MongoDB
    3. Build TF-IDF matrix: [all drives + student]
    4. Compute cosine similarity between student and each drive
    5. Filter by eligibility (CGPA, backlogs)
    6. Return top_n ranked drives with match score

    Returns:
        [{
          drive_id, company_name, job_role, match_score (0-100),
          match_label ("Excellent"/"Good"/"Fair"),
          eligible, reason_ineligible
        }, ...]
    """
    # Load data from MongoDB
    students_df = load_students()
    drives_df   = load_drives()

    if students_df.empty or drives_df.empty:
        return []

    # Find our student
    student_row = students_df[students_df["_id"] == student_id]
    if student_row.empty:
        return []
    student = student_row.iloc[0]

    # Filter to active/upcoming drives
    active_drives = drives_df[drives_df["status"].isin(["Active", "Upcoming"])]
    if active_drives.empty:
        return []

    # Build text documents
    drive_texts   = [_build_drive_text(d) for _, d in active_drives.iterrows()]
    student_text  = _build_student_text(
        skills=student.get("skills", []),
        branch=student.get("branch", "")
    )
    all_texts = drive_texts + [student_text]

    # TF-IDF vectorization
    # min_df=1: include even rare words (small corpus)
    # ngram_range=(1,2): also consider 2-word phrases ("full stack", "node js")
    vectorizer = TfidfVectorizer(min_df=1, ngram_range=(1, 2), sublinear_tf=True)
    try:
        tfidf_matrix = vectorizer.fit_transform(all_texts)
    except ValueError:
        return []

    drive_vectors  = tfidf_matrix[:-1]        # All rows except last
    student_vector = tfidf_matrix[-1:]         # Last row

    # Cosine similarity: shape (1, n_drives)
    similarities = cosine_similarity(student_vector, drive_vectors)[0]

    results = []
    for i, (_, drive) in enumerate(active_drives.iterrows()):
        sim_score   = float(similarities[i])
        match_pct   = round(sim_score * 100, 1)

        # Hard eligibility checks
        cgpa_ok     = float(student["cgpa"]) >= float(drive.get("min_cgpa_required", 0))
        backlog_ok  = int(student["active_backlogs"]) <= int(drive.get("max_backlogs_allowed", 0))
        eligible    = cgpa_ok and backlog_ok

        reason = None
        if not cgpa_ok:
            reason = f"CGPA {student['cgpa']:.1f} < required {drive.get('min_cgpa_required', 0)}"
        elif not backlog_ok:
            reason = f"Backlogs {int(student['active_backlogs'])} > allowed {drive.get('max_backlogs_allowed', 0)}"

        # Match quality label
        if match_pct >= 60:
            label = "Excellent Match"
        elif match_pct >= 35:
            label = "Good Match"
        elif match_pct >= 15:
            label = "Fair Match"
        else:
            label = "Low Match"

        results.append({
            "drive_id":          str(drive["_id"]),
            "company_name":      drive.get("company_name", ""),
            "job_role":          drive.get("job_role", ""),
            "required_skills":   drive.get("required_skills", []),
            "min_cgpa":          drive.get("min_cgpa_required", 0),
            "max_backlogs":      drive.get("max_backlogs_allowed", 0),
            "avg_package":       drive.get("avg_package", ""),
            "status":            drive.get("status", ""),
            "match_score":       match_pct,
            "match_label":       label,
            "eligible":          eligible,
            "reason_ineligible": reason,
        })

    # Sort: eligible first, then by match score descending
    results.sort(key=lambda r: (int(r["eligible"]), r["match_score"]), reverse=True)
    return results[:top_n]
