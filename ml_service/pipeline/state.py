"""
pipeline/state.py
==================
Custom StateGraph engine — pure Python, no LangGraph dependency.

HOW IT WORKS:
  1. PipelineState is a mutable dict-like dataclass that flows through every node.
     Each node reads from it and writes results back into it.
     This is identical to LangGraph's State concept.

  2. SPIEGraph is a simple directed graph:
       graph.add_node("name", fn)   → registers a function as a node
       graph.add_edge("a", "b")    → "a" runs before "b"
       graph.add_fan_out("router") → launches parallel branches
       graph.add_fan_in("join")    → waits for all branches to finish

  3. Execution:
       - Topological sort determines order
       - Fan-out nodes use concurrent.futures for true parallelism
       - State is thread-safe: each branch writes to its own key
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import time


# ── Pipeline State ─────────────────────────────────────────────────────────────
@dataclass
class PipelineState:
    """
    The single source of truth flowing through the entire pipeline.
    Every node reads from and writes to this object.

    Lifecycle:
      INPUT   → student_id set
      PHASE 1 → cache_hit, raw_profile, essence populated
      PHASE 2 → aspects, drift_penalty populated
      PHASE 3 → aspect_results populated (4 entries, one per branch)
      PHASE 4 → final_score, verdict, explanation, cached_result populated
    """

    # ── Input ──────────────────────────────────────────────────────────────────
    student_id:     str  = ""

    # ── Phase 1 ───────────────────────────────────────────────────────────────
    cache_hit:      bool                  = False
    cached_result:  Optional[Dict]        = None
    raw_profile:    Optional[Dict]        = None   # Raw MongoDB student doc
    raw_drives:     List[Dict]            = field(default_factory=list)
    raw_applications: List[Dict]          = field(default_factory=list)
    essence:        Optional[Dict]        = None   # Structured key metrics

    # ── Phase 2 ───────────────────────────────────────────────────────────────
    aspects:        List[Dict]            = field(default_factory=list)
    drift_penalty:  float                 = 0.0    # 0.0 = no drift, 0.3 = severe

    # ── Phase 3 (parallel results, one per aspect) ────────────────────────────
    aspect_results: List[Dict]            = field(default_factory=list)

    # ── Phase 4 ───────────────────────────────────────────────────────────────
    final_score:    float                 = 0.0    # 0–100
    verdict:        str                   = ""     # "Placement Ready" etc.
    explanation:    Dict                  = field(default_factory=dict)
    pipeline_meta:  Dict                  = field(default_factory=dict)  # timing, nodes run

    # ── Error tracking ─────────────────────────────────────────────────────────
    errors:         List[str]             = field(default_factory=list)

    def to_dict(self) -> dict:
        """Serializes state to a plain dict (for MongoDB cache + API response)."""
        return {
            "student_id":     self.student_id,
            "cache_hit":      self.cache_hit,
            "essence":        self.essence,
            "aspect_results": self.aspect_results,
            "final_score":    round(self.final_score, 2),
            "verdict":        self.verdict,
            "explanation":    self.explanation,
            "pipeline_meta":  self.pipeline_meta,
            "drift_penalty":  round(self.drift_penalty, 4),
            "errors":         self.errors,
        }


# ── Aspect Result ──────────────────────────────────────────────────────────────
@dataclass
class AspectResult:
    """Result object returned by each parallel branch (Node 9 output)."""
    name:             str    # "Academic" | "Technical" | "MarketFit" | "Risk"
    raw_score:        float  # 0.0–1.0 before penalties
    penalized_score:  float  # 0.0–1.0 after penalties
    verdict:          str    # "Strong" | "Average" | "Weak" | "Critical"
    evidence:         dict   # Supporting facts collected (Node 6)
    contradictions:   list   # Weaknesses found (Node 7)
    penalties_applied: list  # Description of each penalty applied

    def to_dict(self) -> dict:
        return {
            "name":              self.name,
            "raw_score":         round(self.raw_score, 4),
            "penalized_score":   round(self.penalized_score, 4),
            "score_pct":         round(self.penalized_score * 100, 1),
            "verdict":           self.verdict,
            "evidence":          self.evidence,
            "contradictions":    self.contradictions,
            "penalties_applied": self.penalties_applied,
        }


# ── StateGraph Engine ──────────────────────────────────────────────────────────
class SPIEGraph:
    """
    Lightweight StateGraph engine.

    Usage:
        graph = SPIEGraph()
        graph.add_node("cache_check", cache_check_fn)
        graph.add_node("profile_loader", profile_loader_fn)
        graph.add_edge("cache_check", "profile_loader")
        ...
        result = graph.run(PipelineState(student_id="..."))
    """

    def __init__(self):
        self._nodes:    Dict[str, Callable] = {}
        self._edges:    Dict[str, List[str]] = {}
        self._order:    List[str]           = []   # execution order
        self._fan_out:  Optional[str]       = None # name of fan-out node
        self._fan_in:   Optional[str]       = None # name of fan-in node
        self._parallel_fn: Optional[Callable] = None  # runs in each branch

    def add_node(self, name: str, fn: Callable) -> "SPIEGraph":
        self._nodes[name] = fn
        if name not in self._edges:
            self._edges[name] = []
        return self

    def add_edge(self, from_node: str, to_node: str) -> "SPIEGraph":
        self._edges.setdefault(from_node, []).append(to_node)
        return self

    def set_execution_order(self, order: List[str]) -> "SPIEGraph":
        """Set explicit execution order (simpler than topological sort for our pipeline)."""
        self._order = order
        return self

    def set_parallel_branch(self, fn: Callable) -> "SPIEGraph":
        """
        Register the function that runs IN PARALLEL for each aspect.
        This function receives (aspect_dict, state) and returns AspectResult.
        """
        self._parallel_fn = fn
        return self

    def run(self, state: PipelineState, max_workers: int = 4) -> PipelineState:
        """
        Execute the pipeline:
          1. Run sequential pre-fan-out nodes (Phase 1 + 2)
          2. Fan-out: run parallel branches (Phase 3) with ThreadPoolExecutor
          3. Fan-in: collect results
          4. Run sequential post-fan-in nodes (Phase 4)
        """
        start = time.time()
        state.pipeline_meta["nodes_executed"] = []
        state.pipeline_meta["timings"] = {}

        fan_out_idx = self._order.index("fan_out") if "fan_out" in self._order else len(self._order)
        fan_in_idx  = self._order.index("fan_in")  if "fan_in"  in self._order else len(self._order)

        # ── Phase 1 & 2: Sequential before fan-out ────────────────────────────
        for name in self._order[:fan_out_idx]:
            if name in self._nodes:
                t0 = time.time()
                try:
                    print(f"  [SPIE] Node: {name}")
                    state = self._nodes[name](state)
                    if state.cache_hit and state.cached_result:
                        print(f"  [SPIE] Cache hit — skipping pipeline")
                        state.pipeline_meta["total_ms"] = round((time.time() - start) * 1000, 1)
                        return state
                except Exception as e:
                    state.errors.append(f"{name}: {str(e)}")
                    print(f"  [SPIE] ⚠ Error in {name}: {e}")
                state.pipeline_meta["nodes_executed"].append(name)
                state.pipeline_meta["timings"][name] = round((time.time() - t0) * 1000, 1)

        # ── Phase 3: Fan-out (parallel aspect branches) ────────────────────────
        if self._parallel_fn and state.aspects:
            print(f"  [SPIE] Fan-out → {len(state.aspects)} parallel branches")
            t0 = time.time()
            results = []
            with ThreadPoolExecutor(max_workers=min(max_workers, len(state.aspects))) as executor:
                futures = {
                    executor.submit(self._parallel_fn, aspect, state): aspect["name"]
                    for aspect in state.aspects
                }
                for future in as_completed(futures):
                    aspect_name = futures[future]
                    try:
                        result: AspectResult = future.result(timeout=30)
                        results.append(result.to_dict())
                        print(f"  [SPIE]   ✓ Branch '{aspect_name}' done: score={result.penalized_score:.3f}")
                    except Exception as e:
                        state.errors.append(f"branch_{aspect_name}: {str(e)}")
                        print(f"  [SPIE]   ✗ Branch '{aspect_name}' error: {e}")

            state.aspect_results = results
            state.pipeline_meta["timings"]["parallel_branches"] = round((time.time() - t0) * 1000, 1)
            state.pipeline_meta["nodes_executed"].append("fan_out/fan_in")

        # ── Phase 4: Sequential after fan-in ──────────────────────────────────
        for name in self._order[fan_in_idx + 1:]:
            if name in self._nodes:
                t0 = time.time()
                try:
                    print(f"  [SPIE] Node: {name}")
                    state = self._nodes[name](state)
                except Exception as e:
                    state.errors.append(f"{name}: {str(e)}")
                    print(f"  [SPIE] ⚠ Error in {name}: {e}")
                state.pipeline_meta["nodes_executed"].append(name)
                state.pipeline_meta["timings"][name] = round((time.time() - t0) * 1000, 1)

        state.pipeline_meta["total_ms"] = round((time.time() - start) * 1000, 1)
        print(f"  [SPIE] ✅ Pipeline complete in {state.pipeline_meta['total_ms']}ms")
        return state
