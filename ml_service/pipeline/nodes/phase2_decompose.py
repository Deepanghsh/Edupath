"""
pipeline/nodes/phase2_decompose.py
====================================
Phase 2: Decomposition & Drift Guard

Node 4 — Aspect Splitter
  Breaks the student essence into 4 independent "aspects":
    1. Academic  → CGPA, backlogs, verification
    2. Technical → DSA, OOPs, skill count, core skills
    3. MarketFit → eligible drives, skill-drive overlap, application history
    4. Risk      → rejection count, backlog trend, EWS trigger

  Each aspect gets its own text_repr for the drift guard check.

Drift Guard (between Node 4 and Node 5)
  Runs a TF-IDF cosine similarity check.
  Compares:
    essence["text_repr"]  vs  each aspect["text_repr"]
  If any aspect drifts too far from the original essence
  (similarity < 0.1), it means the decomposition lost important context.
  A drift_penalty (0.0–0.3) is saved to state to penalize final scores.

  WHY TF-IDF COSINE FOR DRIFT:
    - Same library already imported for recommender
    - Works on text representations of numeric profiles
    - No embedding model download needed
    - Sub-millisecond computation

Node 5 — Aspect Router (Fan-Out)
  Packages aspects for concurrent.futures parallel execution.
  Each aspect dict is what the parallel branch (Node 6-9) receives.
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from pipeline.state import PipelineState


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Node 4 — Aspect Splitter
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def node_aspect_splitter(state: PipelineState) -> PipelineState:
    """
    Splits the student essence into 4 independent analysis aspects.
    Each aspect carries only the data relevant to its domain.
    """
    if not state.essence:
        state.errors.append("aspect_splitter: no essence available")
        return state

    e  = state.essence
    n  = e["numeric"]
    c  = e["categorical"]
    sk = e["skills"]
    h  = e["history"]
    el = e["eligibility"]

    CORE = {"java","python","react","node.js","dsa","c++","sql","javascript","spring","mongodb"}
    has_core = any(s in CORE for s in sk)
    core_skills = [s for s in sk if s in CORE]

    # Aspect 1: Academic
    academic_text = (
        f"cgpa {n['cgpa']:.1f} grade academic marks verified "
        f"{c['verification_status']} backlogs {n['active_backlogs']} "
        f"year {c['year']} branch {c['branch']}"
    )

    # Aspect 2: Technical
    technical_text = (
        f"dsa {n['dsa_marks']:.0f} oops {n['oops_marks']:.0f} "
        f"technical skills {' '.join(sk)} programming "
        f"core skill {' '.join(core_skills)} skill count {n['skill_count']}"
    )

    # Aspect 3: Market Fit
    eligible_names = " ".join(el.get("eligible_drive_names", []))
    marketfit_text = (
        f"eligible drives {el['eligible_drive_count']} of {el['total_drive_count']} "
        f"companies {eligible_names} placement application history "
        f"selected {h['selected']} rejected {h['rejected']} "
        f"success rate {h['success_rate']}"
    )

    # Aspect 4: Risk
    risk_text = (
        f"risk rejection {n['rejection_count']} backlogs {n['active_backlogs']} "
        f"early warning danger vulnerable tier {c['tier']} "
        f"verification {c['verification_status']}"
    )

    state.aspects = [
        {
            "name":      "Academic",
            "text_repr": academic_text,
            "data": {
                "cgpa":                n["cgpa"],
                "active_backlogs":     n["active_backlogs"],
                "verification_status": c["verification_status"],
                "year":                c["year"],
                "branch":              c["branch"],
                "readiness_score":     n["readiness_score"],
            }
        },
        {
            "name":      "Technical",
            "text_repr": technical_text,
            "data": {
                "dsa_marks":     n["dsa_marks"],
                "oops_marks":    n["oops_marks"],
                "skills":        sk,
                "skill_count":   n["skill_count"],
                "has_core_skill": has_core,
                "core_skills":   core_skills,
            }
        },
        {
            "name":      "MarketFit",
            "text_repr": marketfit_text,
            "data": {
                "eligible_drive_count": el["eligible_drive_count"],
                "total_drive_count":    el["total_drive_count"],
                "eligible_pct":         el["eligible_drive_count"] / max(el["total_drive_count"], 1),
                "apps_history":         h,
                "skills":               sk,
                "cgpa":                 n["cgpa"],
                "active_backlogs":      n["active_backlogs"],
            }
        },
        {
            "name":      "Risk",
            "text_repr": risk_text,
            "data": {
                "rejection_count":     n["rejection_count"],
                "active_backlogs":     n["active_backlogs"],
                "tier":                c["tier"],
                "verification_status": c["verification_status"],
                "cgpa":                n["cgpa"],
                "dsa_marks":           n["dsa_marks"],
            }
        },
    ]

    print(f"  [AspectSplitter] 4 aspects created: {[a['name'] for a in state.aspects]}")
    return state


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Drift Guard (between Node 4 and Node 5)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def drift_guard(state: PipelineState) -> PipelineState:
    """
    TF-IDF Cosine Similarity drift check.

    Checks that each aspect's text_repr is sufficiently similar
    to the original essence text_repr.

    If min similarity < 0.08 → severe drift → penalty = 0.25
    If min similarity < 0.15 → moderate drift → penalty = 0.10
    Otherwise → no penalty

    This prevents the system from confidently scoring a student
    if the aspect decomposition lost key information.
    """
    if not state.essence or not state.aspects:
        return state

    essence_text = state.essence.get("text_repr", "")
    aspect_texts = [a["text_repr"] for a in state.aspects]
    all_texts    = [essence_text] + aspect_texts

    try:
        vectorizer   = TfidfVectorizer(min_df=1, ngram_range=(1, 2))
        tfidf_matrix = vectorizer.fit_transform(all_texts)
        essence_vec  = tfidf_matrix[0:1]
        aspect_vecs  = tfidf_matrix[1:]
        sims         = cosine_similarity(essence_vec, aspect_vecs)[0]
        min_sim      = float(sims.min())
        avg_sim      = float(sims.mean())

        if min_sim < 0.08:
            state.drift_penalty = 0.25
        elif min_sim < 0.15:
            state.drift_penalty = 0.10
        else:
            state.drift_penalty = 0.0

        print(f"  [DriftGuard] Similarities: {[f'{s:.3f}' for s in sims]} | "
              f"min={min_sim:.3f} | penalty={state.drift_penalty}")
        state.pipeline_meta["drift_similarities"] = [round(float(s), 3) for s in sims]

    except Exception as e:
        state.errors.append(f"drift_guard: {str(e)}")
        state.drift_penalty = 0.0

    return state


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Node 5 — Aspect Router (Fan-Out marker)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def node_aspect_router(state: PipelineState) -> PipelineState:
    """
    Prepares aspects for parallel dispatch.
    The actual fan-out is handled by SPIEGraph.run() via ThreadPoolExecutor.
    This node just validates state is ready.
    """
    if not state.aspects:
        state.errors.append("aspect_router: no aspects to route")
    else:
        print(f"  [AspectRouter] Ready to dispatch {len(state.aspects)} branches → Fan-Out")
        for a in state.aspects:
            a["drift_penalty"] = state.drift_penalty   # pass to each branch
    return state
