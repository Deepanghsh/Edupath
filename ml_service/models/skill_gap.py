"""
models/skill_gap.py
====================
ML Model 4: Skill Gap Analyzer

HOW IT WORKS:
  - Fetches the student's current skills from MongoDB
  - Fetches all eligible drives (those student can apply to based on CGPA/backlogs)
  - Counts how many drives require each skill
  - Finds skills the student is MISSING from those drives
  - Ranks missing skills by demand (how many drives need them)
  - Returns a prioritized learning roadmap

NO TRAINING NEEDED — this is pure data analysis from MongoDB.
It's "smart" because it adapts to current drive data in real-time.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from data.mongo_loader import load_drives, load_students
from collections import Counter


def analyze(student_id: str) -> dict:
    """
    Analyzes skill gap for a student against eligible drives.

    Returns:
        {
          owned_skills: [str],
          missing_skills: [{skill, demand_count, drives_needing}],
          matched_skills: [{skill, demand_count}],
          coverage_pct: float,   # % of drive skills already owned
          top_recommendation: str
        }
    """
    students_df = load_students()
    drives_df   = load_drives()

    if students_df.empty:
        return {"error": "No student data found"}

    student_row = students_df[students_df["_id"] == student_id]
    if student_row.empty:
        return {"error": "Student not found"}

    student       = student_row.iloc[0]
    student_skills = set(s.lower() for s in (student.get("skills") or []))
    cgpa          = float(student.get("cgpa", 0))
    backlogs      = int(student.get("active_backlogs", 0))

    # Get eligible drives (those the student can apply to)
    eligible_drives = drives_df[
        (drives_df["min_cgpa_required"].astype(float) <= cgpa) &
        (drives_df["max_backlogs_allowed"].astype(int)  >= backlogs) &
        (drives_df["status"].isin(["Active", "Upcoming"]))
    ]

    # Count skill demand across eligible drives
    skill_demand: Counter = Counter()
    skill_drive_map: dict = {}   # skill → [company names]

    for _, drive in eligible_drives.iterrows():
        company = drive.get("company_name", "")
        for skill in (drive.get("required_skills") or []):
            sk = skill.lower()
            skill_demand[sk] += 1
            skill_drive_map.setdefault(sk, []).append(company)

    if not skill_demand:
        return {
            "owned_skills":      list(student.get("skills", [])),
            "missing_skills":    [],
            "matched_skills":    [],
            "coverage_pct":      100.0,
            "top_recommendation":"You meet all skill requirements for eligible drives!",
            "eligible_drives_count": 0,
        }

    # Separate: skills student HAS vs MISSING
    missing_skills  = []
    matched_skills  = []
    total_demand    = sum(skill_demand.values())
    matched_demand  = 0

    for skill, count in skill_demand.most_common():
        if skill in student_skills:
            matched_skills.append({"skill": skill.title(), "demand_count": count})
            matched_demand += count
        else:
            missing_skills.append({
                "skill":         skill.title(),
                "demand_count":  count,
                "drives_needing": skill_drive_map.get(skill, [])[:3],  # max 3 company names
            })

    coverage_pct = round(matched_demand / max(total_demand, 1) * 100, 1)

    # Top recommendation
    if missing_skills:
        top = missing_skills[0]
        rec = f"Learn '{top['skill']}' — needed by {top['demand_count']} eligible drive(s)"
    else:
        rec = "Excellent! You have all required skills for your eligible drives."

    return {
        "owned_skills":          [s.title() for s in sorted(student_skills)],
        "missing_skills":        missing_skills,
        "matched_skills":        matched_skills,
        "coverage_pct":          coverage_pct,
        "top_recommendation":    rec,
        "eligible_drives_count": len(eligible_drives),
        "total_skills_demanded": len(skill_demand),
    }
