"""
pipeline/graph.py
==================
Wires all nodes into the SPIE pipeline graph.

This is the master definition file — it creates the SPIEGraph,
registers all 12 nodes in order, and sets the parallel branch function.

Think of this as the LangGraph `StateGraph` definition file.
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from pipeline.state import SPIEGraph, PipelineState
from pipeline.nodes.phase1_ingestion  import (
    node_cache_check, node_profile_loader, node_essence_extractor
)
from pipeline.nodes.phase2_decompose  import (
    node_aspect_splitter, drift_guard, node_aspect_router
)
from pipeline.nodes.phase3_parallel   import run_aspect_branch
from pipeline.nodes.phase4_synthesis  import (
    node_score_aggregator, node_explanation_generator, node_cache_writer
)


def build_graph() -> SPIEGraph:
    """
    Constructs and returns the complete SPIE pipeline graph.

    Execution order:
      Phase 1: cache_check → profile_loader → essence_extractor
      Phase 2: aspect_splitter → drift_guard → aspect_router
      [fan_out marker]
      Phase 3: run_aspect_branch × 4  (parallel, via ThreadPoolExecutor)
      [fan_in marker]
      Phase 4: score_aggregator → explanation_generator → cache_writer

    Returns a fully wired, ready-to-run SPIEGraph instance.
    """
    graph = SPIEGraph()

    # ── Phase 1 nodes ─────────────────────────────────────────────────────────
    graph.add_node("cache_check",        node_cache_check)
    graph.add_node("profile_loader",     node_profile_loader)
    graph.add_node("essence_extractor",  node_essence_extractor)

    # ── Phase 2 nodes ─────────────────────────────────────────────────────────
    graph.add_node("aspect_splitter",    node_aspect_splitter)
    graph.add_node("drift_guard",        drift_guard)
    graph.add_node("aspect_router",      node_aspect_router)

    # ── Phase 4 nodes ─────────────────────────────────────────────────────────
    graph.add_node("score_aggregator",    node_score_aggregator)
    graph.add_node("explanation_generator", node_explanation_generator)
    graph.add_node("cache_writer",        node_cache_writer)

    # ── Execution order (explicit, no topological sort needed) ────────────────
    graph.set_execution_order([
        # Phase 1
        "cache_check",
        "profile_loader",
        "essence_extractor",
        # Phase 2
        "aspect_splitter",
        "drift_guard",
        "aspect_router",
        # Fan-out/Fan-in markers (handled by SPIEGraph.run())
        "fan_out",
        "fan_in",
        # Phase 4
        "score_aggregator",
        "explanation_generator",
        "cache_writer",
    ])

    # ── Register parallel branch function ─────────────────────────────────────
    # This runs for EACH aspect in Phase 3 (Nodes 6 → 7 → 8 → 9)
    graph.set_parallel_branch(run_aspect_branch)

    return graph


# ── Singleton graph instance (built once, reused for every request) ────────────
_graph: SPIEGraph = None

def get_graph() -> SPIEGraph:
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph


# ── Main entry point ───────────────────────────────────────────────────────────
def run_pipeline(student_id: str) -> dict:
    """
    Runs the full SPIE pipeline for a student.

    Args:
        student_id: MongoDB _id string or email of the student

    Returns:
        dict: Full SPIEResult (serializable, ready for JSON response)
    """
    print(f"\n{'='*60}")
    print(f"  SPIE Pipeline — student_id={student_id}")
    print(f"{'='*60}")

    graph = get_graph()
    state = PipelineState(student_id=student_id)
    state = graph.run(state)

    # If cache hit, return cached result directly
    if state.cache_hit and state.cached_result:
        return {**state.cached_result, "cache_hit": True}

    return state.to_dict()
