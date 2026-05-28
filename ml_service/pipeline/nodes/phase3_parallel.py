"""
pipeline/nodes/phase3_parallel.py
====================================
Phase 3: Parallel Aspect Branches (Nodes 6–9)

ONE INSTANCE of this file runs per aspect, concurrently.
If there are 4 aspects → 4 instances run in parallel via ThreadPoolExecutor.

Node 6 — Evidence Collector
  Fetches supporting evidence from MongoDB for this specific aspect.
  e.g., Academic aspect → fetches how many drives the student meets CGPA for
  e.g., Technical aspect → fetches skill overlap with all drives

Node 7 — Adversarial Checker
  Actively LOOKS FOR WEAKNESSES in this aspect.
  e.g., Academic → finds drives the student FAILS the cutoff for
  e.g., Technical → finds most demanded skills the student LACKS
  Also runs ECHO CHAMBER DETECTION:
    If a student applied to the same company multiple times and got rejected
    each time, that's an "echo chamber" — circular negative signal.
    Penalty: ×0.80 on this aspect's score.

Node 8 — Aspect Judge
  Scores this aspect from 0.0–1.0 and assigns a verdict.
  Uses different scoring logic per aspect:
    Academic  → CGPA threshold model + backlog penalty
    Technical → Weighted DSA/OOPs + skill diversity
    MarketFit → eligible_drive_pct × success_rate × skill_coverage
    Risk      → Inverse of risk indicators

Node 9 — Penalty Node
  Applies mathematical penalties to the raw score:
    - Each active backlog:    × 0.92
    - Echo chamber detected:  × 0.80
    - Drift penalty:          × (1 - drift_penalty)
    - EWS trigger (rej≥3):   × 0.75
    - Unverified profile:     × 0.95
  Returns final AspectResult.
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from pipeline.state import PipelineState, AspectResult
from data.mongo_loader import get_db, load_drives


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Node 6 — Evidence Collector
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def collect_evidence(aspect: dict, state: PipelineState) -> dict:
    """
    Collects supporting evidence from MongoDB for this aspect.
    Returns a dict of supporting facts.
    """
    name = aspect["name"]
    data = aspect["data"]
    drives = state.raw_drives or []

    if name == "Academic":
        cgpa     = data["cgpa"]
        backlogs = data["active_backlogs"]
        passing  = [d for d in drives if float(d.get("min_cgpa_required",0)) <= cgpa]
        return {
            "drives_meeting_cgpa":    len(passing),
            "total_drives":           len(drives),
            "cgpa_coverage_pct":      round(len(passing)/max(len(drives),1)*100,1),
            "cgpa":                   cgpa,
            "active_backlogs":        backlogs,
            "verification_status":    data["verification_status"],
            "supporting_drives":      [d.get("company_name","") for d in passing[:3]],
        }

    elif name == "Technical":
        skills       = set(data["skills"])
        all_req      = []
        for d in drives:
            all_req.extend([s.lower() for s in d.get("required_skills", [])])
        from collections import Counter
        demand = Counter(all_req)
        matched = [s for s in skills if s in demand]
        return {
            "dsa_marks":        data["dsa_marks"],
            "oops_marks":       data["oops_marks"],
            "skill_count":      data["skill_count"],
            "has_core_skill":   data["has_core_skill"],
            "matched_skills":   matched,
            "skills_in_demand": sorted(demand.most_common(5), key=lambda x: -x[1]),
            "skill_overlap_pct": round(len(matched)/max(len(demand),1)*100,1),
        }

    elif name == "MarketFit":
        h           = data["apps_history"]
        elig_pct    = data["eligible_pct"]
        success     = h["success_rate"]
        applications = state.raw_applications or []
        selected_drives = [a.get("drive_id","") for a in applications if a.get("status")=="Selected"]
        return {
            "eligible_drive_count": data["eligible_drive_count"],
            "total_drives":         data["total_drive_count"],
            "eligible_pct":         round(elig_pct*100, 1),
            "total_applications":   h["total"],
            "selected":             h["selected"],
            "rejected":             h["rejected"],
            "success_rate":         success,
            "selected_drive_ids":   selected_drives,
        }

    elif name == "Risk":
        rej    = data["rejection_count"]
        blogs  = data["active_backlogs"]
        tier   = data["tier"]
        ews    = rej >= 3
        return {
            "rejection_count":  rej,
            "active_backlogs":  blogs,
            "tier":             tier,
            "ews_triggered":    ews,
            "verification_status": data["verification_status"],
            "cgpa":             data["cgpa"],
        }

    return {}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Node 7 — Adversarial Checker
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def check_adversarial(aspect: dict, state: PipelineState, evidence: dict) -> tuple[list, bool]:
    """
    Actively finds weaknesses/contradictions for this aspect.
    Returns (contradictions: list[str], echo_chamber: bool)

    ECHO CHAMBER DETECTION:
      Checks if a student keeps applying to the same companies repeatedly
      and getting rejected. This inflates rejection_count without
      diversifying the search — a red flag for placement readiness.
    """
    name  = aspect["name"]
    data  = aspect["data"]
    drives = state.raw_drives or []
    apps  = state.raw_applications or []
    contradictions = []
    echo_chamber   = False

    if name == "Academic":
        cgpa     = data["cgpa"]
        backlogs = data["active_backlogs"]
        failing  = [d for d in drives if float(d.get("min_cgpa_required",0)) > cgpa]
        for d in failing[:3]:
            contradictions.append(
                f"{d.get('company_name','?')} requires CGPA {d.get('min_cgpa_required','?')} "
                f"— student has {cgpa:.1f} (FAIL)"
            )
        if backlogs > 0:
            zero_backlog_drives = [d for d in drives if int(d.get("max_backlogs_allowed",0)) == 0]
            contradictions.append(
                f"{len(zero_backlog_drives)} drives require 0 backlogs — student has {backlogs}"
            )

    elif name == "Technical":
        skills = set(data["skills"])
        for d in drives[:5]:
            req  = set(s.lower() for s in d.get("required_skills", []))
            miss = req - skills
            if miss:
                contradictions.append(
                    f"{d.get('company_name','?')} needs {', '.join(miss)} — not in student skills"
                )

    elif name == "MarketFit":
        from collections import Counter
        rejected_drive_ids = [a.get("drive_id","") for a in apps if a.get("status")=="Rejected"]
        drive_rejection_freq = Counter(rejected_drive_ids)
        # Echo chamber: same drive rejected ≥ 2 times
        for drive_id, count in drive_rejection_freq.items():
            if count >= 2:
                echo_chamber = True
                drive_name = next(
                    (d.get("company_name","?") for d in drives if str(d.get("_id","")) == drive_id), "?"
                )
                contradictions.append(
                    f"ECHO CHAMBER: Applied to {drive_name} {count}× and rejected each time"
                )
        if data["eligible_pct"] < 0.3:
            contradictions.append(
                f"Only {data['eligible_drive_count']}/{data['total_drive_count']} drives eligible — "
                f"profile needs improvement"
            )

    elif name == "Risk":
        rej   = data["rejection_count"]
        blogs = data["active_backlogs"]
        if rej >= 3:
            contradictions.append(f"⚠ EWS TRIGGERED: {rej} rejections — high intervention needed")
        if blogs >= 2:
            contradictions.append(f"⚠ {blogs} active backlogs — disqualified from most Tier-1 drives")
        if data["verification_status"] != "Approved":
            contradictions.append("⚠ Profile not verified — cannot apply to verified-only drives")
        if data["cgpa"] < 5.5:
            contradictions.append("⚠ CGPA below 5.5 — below most company minimum cutoffs")

    return contradictions, echo_chamber


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Node 8 — Aspect Judge
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def judge_aspect(aspect: dict, evidence: dict, contradictions: list) -> tuple[float, str]:
    """
    Scores the aspect from 0.0–1.0 and returns a verdict label.
    Each aspect uses domain-specific scoring logic.
    """
    name = aspect["name"]
    data = aspect["data"]
    score = 0.5  # default

    if name == "Academic":
        cgpa    = data["cgpa"]
        blogs   = data["active_backlogs"]
        cover   = evidence.get("cgpa_coverage_pct", 50) / 100.0
        verified = 1.0 if data["verification_status"] == "Approved" else 0.85
        # Score: CGPA normalized (4.0=0.0, 10.0=1.0) + coverage + backlog penalty
        cgpa_score = max(0, (cgpa - 4.0) / 6.0)
        blog_factor = max(0, 1.0 - blogs * 0.15)
        score = (cgpa_score * 0.50 + cover * 0.30 + verified * 0.10 + blog_factor * 0.10)

    elif name == "Technical":
        dsa   = data["dsa_marks"] / 100.0
        oops  = data["oops_marks"] / 100.0
        skill = min(data["skill_count"] / 6.0, 1.0)
        core  = 0.15 if data["has_core_skill"] else 0.0
        score = (dsa * 0.35 + oops * 0.25 + skill * 0.25 + core)

    elif name == "MarketFit":
        elig_pct = evidence.get("eligible_pct", 0) / 100.0
        success  = evidence.get("success_rate", 0) / 100.0
        overlap  = evidence.get("skill_overlap_pct", 0) / 100.0 if "skill_overlap_pct" in evidence else elig_pct
        # If no applications yet, don't penalize — just use eligibility
        if evidence.get("total_applications", 0) == 0:
            score = elig_pct * 0.70 + 0.30
        else:
            score = (elig_pct * 0.40 + success * 0.35 + elig_pct * 0.25)

    elif name == "Risk":
        rej   = data["rejection_count"]
        blogs = data["active_backlogs"]
        ews   = 1.0 if rej >= 3 else 0.0
        verified = 1.0 if data["verification_status"] == "Approved" else 0.0
        # Lower rejection + backlogs = lower risk = higher score
        rej_score  = max(0, 1.0 - rej * 0.20)
        blog_score = max(0, 1.0 - blogs * 0.25)
        score = (rej_score * 0.35 + blog_score * 0.35 + verified * 0.20 + (1 - ews) * 0.10)

    score = max(0.0, min(1.0, score))

    # Verdict label
    if score >= 0.75:   verdict = "Strong"
    elif score >= 0.55: verdict = "Average"
    elif score >= 0.35: verdict = "Weak"
    else:               verdict = "Critical"

    return score, verdict


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Node 9 — Penalty Node
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def apply_penalties(raw_score: float, aspect: dict, contradictions: list,
                    echo_chamber: bool, drift_penalty: float) -> tuple[float, list]:
    """
    Applies multiplicative penalties to the raw aspect score.
    Returns (penalized_score, list_of_penalty_descriptions).

    All penalties are multiplicative (not additive) so they compound:
    e.g., 0.80 × 0.92 × 0.75 = 0.552 (not 0.80 - 0.08 - 0.25 = 0.47)
    This mirrors Odis's penalty approach exactly.
    """
    score    = raw_score
    applied  = []
    data     = aspect["data"]

    # Penalty 1: Echo chamber (circular rejection pattern)
    if echo_chamber:
        score *= 0.80
        applied.append("Echo chamber: repeated same-company rejections × 0.80")

    # Penalty 2: Drift penalty from Phase 2 (decomposition fidelity)
    if drift_penalty > 0:
        factor = 1.0 - drift_penalty
        score  *= factor
        applied.append(f"Drift penalty: aspect drifted from essence × {factor:.2f}")

    # Penalty 3: EWS trigger (rejection_count ≥ 3)
    rej = data.get("rejection_count", 0)
    if rej >= 3:
        score *= 0.75
        applied.append(f"EWS triggered: {rej} rejections × 0.75")

    # Penalty 4: Active backlogs (each one multiplies by 0.92)
    blogs = data.get("active_backlogs", 0)
    if blogs > 0:
        factor = 0.92 ** blogs
        score  *= factor
        applied.append(f"{blogs} backlog(s): × {factor:.3f}")

    # Penalty 5: Profile not verified
    if data.get("verification_status", "Pending") not in ("Approved",):
        score *= 0.95
        applied.append("Profile unverified × 0.95")

    score = max(0.0, min(1.0, score))
    return score, applied


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Full Parallel Branch (Nodes 6→7→8→9 in sequence, per aspect)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def run_aspect_branch(aspect: dict, state: PipelineState) -> AspectResult:
    """
    Entry point for each parallel branch.
    Called by SPIEGraph.run() via ThreadPoolExecutor.
    Runs Nodes 6 → 7 → 8 → 9 for one aspect.
    """
    name         = aspect["name"]
    drift_penalty = aspect.get("drift_penalty", 0.0)

    # Node 6: Collect evidence from MongoDB
    evidence = collect_evidence(aspect, state)

    # Node 7: Find adversarial contradictions + echo chamber check
    contradictions, echo_chamber = check_adversarial(aspect, state, evidence)

    # Node 8: Judge the aspect
    raw_score, verdict = judge_aspect(aspect, evidence, contradictions)

    # Node 9: Apply penalties
    penalized_score, penalties = apply_penalties(
        raw_score, aspect, contradictions, echo_chamber, drift_penalty
    )

    return AspectResult(
        name              = name,
        raw_score         = raw_score,
        penalized_score   = penalized_score,
        verdict           = verdict,
        evidence          = evidence,
        contradictions    = contradictions,
        penalties_applied = penalties,
    )
