"""
pipeline/nodes/phase4_synthesis.py
====================================
Phase 4: Synthesis & Storage

Node 10 — Score Aggregator
  Fan-in: collects all 4 aspect results.
  Computes the final SPIE score using weighted formula:
    Academic  × 0.30
    Technical × 0.30
    MarketFit × 0.25
    Risk      × 0.15
  Maps score to a verdict label.

Node 11 — Explanation Generator
  Template engine that generates a plain-English summary.
  NO LLM — completely deterministic.
  Uses the aspect results to fill in structured templates.
  Output: {summary, strengths, weaknesses, top_recommendation}

Node 12 — Cache Writer
  Saves the complete result to MongoDB `pipeline_cache`.
  Key: SHA-256(student_id + today's date)
  TTL: 1 calendar day
"""

import hashlib
from datetime import datetime, timezone, timedelta
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from pipeline.state import PipelineState
from data.mongo_loader import get_db


# Aspect weights (must sum to 1.0)
ASPECT_WEIGHTS = {
    "Academic":  0.30,
    "Technical": 0.30,
    "MarketFit": 0.25,
    "Risk":      0.15,
}

VERDICTS = [
    (80, "Placement Ready",      "You are highly competitive for Tier-1 placement drives."),
    (60, "Conditionally Ready",  "Good profile — targeted improvements will unlock Tier-1 companies."),
    (40, "Needs Development",    "Core gaps identified — focused training over 4–6 weeks recommended."),
    ( 0, "High Risk",            "Immediate intervention required — connect with TPO office now."),
]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Node 10 — Score Aggregator
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def node_score_aggregator(state: PipelineState) -> PipelineState:
    """
    Weighted aggregation of all 4 aspect penalized scores → final SPIE score.

    Formula:
      SPIE = Σ (aspect_penalized_score × aspect_weight) × 100

    This is the "Score Aggregator" node — identical role to Odis's Node 10,
    but using domain weights instead of LLM confidence.
    """
    if not state.aspect_results:
        state.errors.append("score_aggregator: no aspect results")
        state.final_score = 0.0
        state.verdict     = "Error — pipeline incomplete"
        return state

    weighted_sum   = 0.0
    total_weight   = 0.0
    aspect_summary = {}

    for result in state.aspect_results:
        name   = result.get("name", "")
        weight = ASPECT_WEIGHTS.get(name, 0.25)
        score  = result.get("penalized_score", 0.0)
        weighted_sum += score * weight
        total_weight += weight
        aspect_summary[name] = {
            "score_pct": result.get("score_pct", 0.0),
            "verdict":   result.get("verdict", ""),
            "weight":    weight,
        }

    final = (weighted_sum / max(total_weight, 1.0)) * 100.0
    state.final_score = round(final, 2)

    # Verdict
    for threshold, label, _ in VERDICTS:
        if final >= threshold:
            state.verdict = label
            break

    print(f"  [ScoreAggregator] SPIE Score = {state.final_score:.1f} → '{state.verdict}'")
    state.pipeline_meta["aspect_summary"] = aspect_summary
    return state


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Node 11 — Explanation Generator
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def node_explanation_generator(state: PipelineState) -> PipelineState:
    """
    Generates a structured plain-English explanation from aspect results.
    100% template-based — no LLM, no hallucination.

    Output structure:
      {
        headline:            str,   "Your SPIE score is 72/100 — Conditionally Ready"
        summary:             str,   1-2 sentences summarizing overall standing
        strengths:           [str], what's working well (Strong/Average aspects)
        weaknesses:          [str], what needs work (Weak/Critical aspects)
        top_contradictions:  [str], worst adversarial findings across all aspects
        top_recommendation:  str,   single most important action to take
        aspect_insights:     {name: str},  one sentence per aspect
        penalties_summary:   [str], all penalties applied
      }
    """
    score   = state.final_score
    verdict = state.verdict
    essence = state.essence or {}
    name    = essence.get("student_name", "Student")

    # Find verdict description
    verdict_desc = ""
    for threshold, label, desc in VERDICTS:
        if score >= threshold:
            verdict_desc = desc
            break

    # Categorize aspects
    strong_aspects   = [r for r in state.aspect_results if r.get("verdict") in ("Strong",)]
    average_aspects  = [r for r in state.aspect_results if r.get("verdict") in ("Average",)]
    weak_aspects     = [r for r in state.aspect_results if r.get("verdict") in ("Weak","Critical")]

    # Build strengths
    strengths = []
    for r in strong_aspects:
        n = r["name"]
        s = r["score_pct"]
        strengths.append(f"{n} profile is strong ({s:.0f}/100) — this is a competitive advantage")
    for r in average_aspects:
        n = r["name"]
        strengths.append(f"{n} is on track — minor improvements will push it to 'Strong'")

    # Build weaknesses
    weaknesses = []
    for r in weak_aspects:
        n = r["name"]
        s = r["score_pct"]
        label = r.get("verdict","Weak")
        weaknesses.append(f"{n} is {label} ({s:.0f}/100) — needs focused attention")

    # Top contradictions across all aspects
    all_contradictions = []
    for r in state.aspect_results:
        all_contradictions.extend(r.get("contradictions", []))
    top_contradictions = all_contradictions[:5]

    # Top penalties
    all_penalties = []
    for r in state.aspect_results:
        all_penalties.extend(r.get("penalties_applied", []))

    # Per-aspect insight (one sentence each)
    aspect_insights = {}
    for r in state.aspect_results:
        n       = r["name"]
        s       = r["score_pct"]
        verdict = r.get("verdict", "")
        ev      = r.get("evidence", {})

        if n == "Academic":
            cgpa = ev.get("cgpa", 0)
            cov  = ev.get("cgpa_coverage_pct", 0)
            aspect_insights[n] = (
                f"CGPA {cgpa:.1f} qualifies for {cov:.0f}% of available drives. "
                f"Academic standing is {verdict.lower()}."
            )
        elif n == "Technical":
            dsa   = ev.get("dsa_marks", 0)
            skills = len(ev.get("matched_skills", []))
            aspect_insights[n] = (
                f"DSA score {dsa:.0f}/100 with {skills} in-demand skills matched. "
                f"Technical readiness is {verdict.lower()}."
            )
        elif n == "MarketFit":
            elig = ev.get("eligible_drive_count", 0)
            tot  = ev.get("total_drives", 1)
            sr   = ev.get("success_rate", 0)
            aspect_insights[n] = (
                f"Eligible for {elig}/{tot} drives with {sr:.0f}% application success rate. "
                f"Market fit is {verdict.lower()}."
            )
        elif n == "Risk":
            rej  = ev.get("rejection_count", 0)
            ews  = ev.get("ews_triggered", False)
            aspect_insights[n] = (
                f"{'⚠ EWS active — ' if ews else ''}{rej} rejection(s) recorded. "
                f"Risk level is {verdict.lower()}."
            )

    # Top recommendation (from weakest aspect)
    if weak_aspects:
        weakest    = min(weak_aspects, key=lambda r: r["score_pct"])
        wname      = weakest["name"]
        wc         = weakest.get("contradictions", [])
        top_rec    = wc[0] if wc else f"Focus on improving {wname} profile immediately."
    elif state.drift_penalty > 0.1:
        top_rec = "Profile data is inconsistent — update your profile on the portal."
    else:
        top_rec = "Maintain your strong profile and target Tier-1 companies."

    state.explanation = {
        "headline":           f"Your SPIE score is {score:.0f}/100 — {verdict}",
        "summary":            f"{verdict_desc}",
        "strengths":          strengths or ["No strong aspects identified yet — keep building!"],
        "weaknesses":         weaknesses,
        "top_contradictions": top_contradictions,
        "top_recommendation": top_rec,
        "aspect_insights":    aspect_insights,
        "penalties_summary":  all_penalties,
        "drift_note":         (
            f"Drift penalty {state.drift_penalty:.0%} applied — "
            f"profile decomposition had minor inconsistencies."
        ) if state.drift_penalty > 0 else "",
    }

    print(f"  [ExplanationGenerator] Generated explanation for '{name}'")
    return state


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Node 12 — Cache Writer
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def node_cache_writer(state: PipelineState) -> PipelineState:
    """
    Saves the complete pipeline result to MongoDB `pipeline_cache`.

    Cache document:
      {
        _id:        SHA-256(student_id + YYYY-MM-DD),
        student_id: str,
        created_at: datetime,
        expires_at: datetime (next midnight UTC),
        result:     {full SPIEResult dict}
      }

    Uses upsert=True so re-runs overwrite stale same-day cache.
    Written synchronously (fast enough — <10ms for one document).
    """
    try:
        today     = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        cache_key = hashlib.sha256(f"{state.student_id}:{today}".encode()).hexdigest()
        now       = datetime.now(timezone.utc)
        # Expire at midnight tonight UTC
        expires   = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)

        result_doc = state.to_dict()
        result_doc["generated_at"] = now.isoformat()

        db = get_db()
        db.pipeline_cache.update_one(
            {"_id": cache_key},
            {"$set": {
                "student_id": state.student_id,
                "created_at": now,
                "expires_at": expires,
                "result":     result_doc,
            }},
            upsert=True
        )
        # Create TTL index if it doesn't exist
        db.pipeline_cache.create_index("expires_at", expireAfterSeconds=0, background=True)
        print(f"  [CacheWriter] Saved → key={cache_key[:16]}... expires={expires.strftime('%Y-%m-%d %H:%M')} UTC")
    except Exception as e:
        state.errors.append(f"cache_writer: {str(e)}")
        print(f"  [CacheWriter] ⚠ Failed to write cache: {e}")

    return state
