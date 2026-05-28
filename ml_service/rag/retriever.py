"""
rag/retriever.py
=================
MongoDB-Native RAG — TF-IDF Document Index

HOW IT WORKS:
  1. Pulls all drives, students (anonymized), and stats from MongoDB
  2. Converts each document into a text "chunk" (like a knowledge article)
  3. Builds a TF-IDF matrix over all chunks
  4. At query time: vectorizes the query, runs cosine similarity,
     returns top-K most relevant chunks
  5. No LLM, no embeddings download, no external service

WHY THIS IS RAG:
  "Retrieval-Augmented Generation" = retrieve relevant docs FIRST,
  then generate an answer FROM those docs.
  Here, generation = template engine (phase4 answerer.py).
  Retrieval = TF-IDF cosine similarity over MongoDB documents.
"""

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import RAG_INDEX_PATH
from data.mongo_loader import get_db, load_drives, load_students, load_placement_stats


def _build_documents() -> list[dict]:
    """
    Converts MongoDB collections into text "documents" for the RAG index.
    Each document has: {text: str, type: str, metadata: dict}
    """
    docs = []

    # ── Drive documents ────────────────────────────────────────────────────────
    drives_df = load_drives()
    for _, d in drives_df.iterrows():
        skills  = ", ".join(d.get("required_skills", []))
        text = (
            f"{d.get('company_name','')} is hiring for {d.get('job_role','')}. "
            f"Required skills: {skills}. "
            f"Minimum CGPA: {d.get('min_cgpa_required',0)}. "
            f"Maximum backlogs allowed: {d.get('max_backlogs_allowed',0)}. "
            f"Package: {d.get('avg_package','')}. "
            f"Status: {d.get('status','')}."
        )
        docs.append({
            "text":     text,
            "type":     "drive",
            "metadata": {
                "company":  d.get("company_name",""),
                "role":     d.get("job_role",""),
                "skills":   d.get("required_skills",[]),
                "min_cgpa": d.get("min_cgpa_required",0),
                "package":  d.get("avg_package",""),
                "status":   d.get("status",""),
            }
        })

    # ── Student tier summaries (anonymized — no PII) ────────────────────────
    students_df = load_students()
    if not students_df.empty:
        for tier in ["Tier1","Tier2","Tier3"]:
            tier_df = students_df[students_df["tier"] == tier]
            if tier_df.empty:
                continue
            avg_cgpa = tier_df["cgpa"].mean()
            avg_dsa  = tier_df["dsa_marks"].mean()
            count    = len(tier_df)
            text = (
                f"{tier} students at GEC have an average CGPA of {avg_cgpa:.2f} "
                f"and average DSA score of {avg_dsa:.1f}. "
                f"There are {count} students in this tier. "
                f"{tier} students are {'eligible for top companies' if tier=='Tier1' else 'building towards higher placement'}."
            )
            docs.append({"text": text, "type": "tier_summary",
                          "metadata": {"tier": tier, "count": count, "avg_cgpa": round(avg_cgpa,2)}})

    # ── Placement stats ────────────────────────────────────────────────────────
    stats = load_placement_stats()
    text = (
        f"GEC placement statistics: {stats['total_students']} total students, "
        f"{stats['verified']} verified profiles, "
        f"{stats['active_drives']} active or upcoming company drives. "
        f"Out of {stats['total_apps']} applications, {stats['selected']} students were selected "
        f"(placement rate: {stats['placement_rate']}%). "
        f"{stats['rejected']} applications were rejected."
    )
    docs.append({"text": text, "type": "stats", "metadata": stats})

    # ── Skill demand summary ───────────────────────────────────────────────────
    from collections import Counter
    all_skills: Counter = Counter()
    for _, d in drives_df.iterrows():
        for sk in d.get("required_skills", []):
            all_skills[sk.lower()] += 1
    if all_skills:
        top5 = all_skills.most_common(5)
        text = (
            f"Most demanded skills across all company drives at GEC: "
            + ", ".join(f"{sk} ({n} drives)" for sk, n in top5) + ". "
            f"Students should prioritize these skills for maximum placement opportunities."
        )
        docs.append({"text": text, "type": "skill_demand",
                      "metadata": {"top_skills": {k:v for k,v in top5}}})

    return docs


def build_index() -> dict:
    """
    Builds (or rebuilds) the TF-IDF index over all MongoDB documents.
    Saves vectorizer + document list to disk.
    """
    print("[RAG] Building TF-IDF index from MongoDB...")
    docs = _build_documents()
    if not docs:
        return {"success": False, "doc_count": 0}

    texts      = [d["text"] for d in docs]
    vectorizer = TfidfVectorizer(min_df=1, ngram_range=(1,2), sublinear_tf=True)
    tfidf_mat  = vectorizer.fit_transform(texts)

    joblib.dump({
        "vectorizer": vectorizer,
        "tfidf_mat":  tfidf_mat,
        "docs":       docs,
    }, RAG_INDEX_PATH)

    print(f"[RAG] Index built: {len(docs)} documents")
    return {"success": True, "doc_count": len(docs), "doc_types": list({d["type"] for d in docs})}


def query_index(query: str, top_k: int = 3) -> list[dict]:
    """
    Retrieves the top-K most relevant documents for a query.
    Builds index automatically if not found.
    """
    if not RAG_INDEX_PATH.exists():
        build_index()

    bundle     = joblib.load(RAG_INDEX_PATH)
    vectorizer = bundle["vectorizer"]
    tfidf_mat  = bundle["tfidf_mat"]
    docs       = bundle["docs"]

    query_vec  = vectorizer.transform([query])
    scores     = cosine_similarity(query_vec, tfidf_mat)[0]
    top_idx    = np.argsort(scores)[::-1][:top_k]

    return [
        {**docs[i], "similarity": round(float(scores[i]), 4)}
        for i in top_idx if scores[i] > 0.0
    ]
