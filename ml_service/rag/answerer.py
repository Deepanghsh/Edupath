"""
rag/answerer.py
================
Template-based answer generator for the RAG system.
Receives retrieved MongoDB documents, generates plain-English answer.
No LLM. No hallucination. 100% deterministic.
"""
from typing import Optional


# Intent patterns → answer template selector
INTENT_MAP = [
    (["php", "developer", "mysql"],           "drive_skill_filter"),
    (["cgpa", "low", "minimum", "cutoff"],     "drive_cgpa_filter"),
    (["backlog", "kt", "arrear"],              "drive_backlog_filter"),
    (["package", "salary", "lpa", "pay"],      "drive_package"),
    (["how many", "total", "count", "number"], "stats_query"),
    (["skill", "learn", "improve", "missing"], "skill_advice"),
    (["risk", "tier", "danger", "warning"],    "risk_query"),
    (["placement", "rate", "percent"],         "placement_rate"),
]

def _detect_intent(query: str) -> str:
    q = query.lower()
    for keywords, intent in INTENT_MAP:
        if any(kw in q for kw in keywords):
            return intent
    return "general"


def generate_answer(query: str, docs: list[dict], student_id: Optional[str] = None) -> str:
    """
    Generates a plain-English answer from retrieved RAG documents.
    Each intent type has its own template that fills in data from the docs.
    """
    if not docs:
        return "I couldn't find relevant placement data for your query. Try rephrasing or check the drives page."

    intent = _detect_intent(query)
    drive_docs = [d for d in docs if d.get("type") == "drive"]
    stat_docs  = [d for d in docs if d.get("type") == "stats"]
    skill_docs = [d for d in docs if d.get("type") == "skill_demand"]

    if intent == "stats_query" and stat_docs:
        meta = stat_docs[0].get("metadata", {})
        return (
            f"📊 GEC Placement Stats: {meta.get('total_students','?')} total students, "
            f"{meta.get('active_drives','?')} active drives, "
            f"{meta.get('placement_rate','?')}% placement rate "
            f"({meta.get('selected','?')} selected out of {meta.get('total_apps','?')} applications)."
        )

    if intent == "placement_rate" and stat_docs:
        meta = stat_docs[0].get("metadata", {})
        return (
            f"The current placement rate at GEC is {meta.get('placement_rate','?')}%. "
            f"{meta.get('selected','?')} students were selected from {meta.get('total_apps','?')} applications across all drives."
        )

    if intent == "skill_advice" and skill_docs:
        meta = skill_docs[0].get("metadata", {})
        skills = meta.get("top_skills", {})
        if skills:
            skill_list = ", ".join(f"{k.title()} ({v} drives)" for k, v in skills.items())
            return f"🎯 Top skills in demand across GEC placement drives: {skill_list}. Focus on these to maximize your opportunities."

    if drive_docs:
        lines = []
        for d in drive_docs[:3]:
            m = d.get("metadata", {})
            skills = ", ".join(m.get("skills", [])) or "—"
            lines.append(
                f"• {m.get('company','')} ({m.get('role','')}): "
                f"CGPA ≥ {m.get('min_cgpa',0)}, Skills: {skills}, "
                f"Package: {m.get('package','?')}, Status: {m.get('status','?')}"
            )
        header = {
            "drive_skill_filter": "🏢 Companies matching your skill query:",
            "drive_cgpa_filter":  "📋 Drives by CGPA requirement:",
            "drive_backlog_filter":"📋 Drives allowing backlogs:",
            "drive_package":      "💰 Drives by package:",
        }.get(intent, "🔍 Relevant placement drives:")
        return header + "\n" + "\n".join(lines)

    # Fallback: return top doc text
    return docs[0]["text"] if docs else "No relevant data found."
