"""
models/risk_clusterer.py
=========================
ML Model 3: Student Risk Classification using K-Means Clustering

HOW IT WORKS:
  1. Fetch all students from MongoDB
  2. Extract numerical features: [cgpa, dsa_marks, oops_marks,
                                   active_backlogs, rejection_count]
  3. Normalize features to same scale (StandardScaler)
     (Without this, CGPA=8 and backlogs=2 are incomparable)
  4. K-Means with k=3 clusters students into 3 natural groups
  5. Auto-label clusters: sort by average CGPA
     → highest avg CGPA cluster = "Low Risk" (Tier1)
     → middle cluster = "Medium Risk" (Tier2)
     → lowest cluster = "High Risk" (Tier3)
  6. For a new student: transform with scaler → assign to nearest cluster

WHY K-MEANS:
  - Truly learns from data (vs. our hardcoded ES formula thresholds)
  - 3 clusters maps naturally to Tier1/Tier2/Tier3
  - Fast inference (<1ms per student)
  - Explainable via cluster centroids

TRAINING SUGGESTIONS (rule engine on cluster label):
  - High Risk → DSA fundamentals, clear backlogs, aptitude prep
  - Medium Risk → Apply to Tier-2, refine top skills
  - Low Risk → Tier-1 core companies, mock interviews
"""

import numpy as np
import pandas as pd
import joblib
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import RISK_MODEL_PATH
from data.mongo_loader import load_students


FEATURES = ["cgpa", "dsa_marks", "oops_marks", "active_backlogs", "rejection_count"]

SUGGESTIONS = {
    "High Risk": [
        "Focus on clearing active backlogs — required by 80% of companies",
        "Revise DSA fundamentals (arrays, linked lists, sorting)",
        "Practice aptitude questions (30 min/day)",
        "Target Tier-3 companies with relaxed CGPA cutoffs",
        "Join college mentorship programme immediately",
    ],
    "Medium Risk": [
        "Improve DSA score above 70 to qualify for Tier-2 companies",
        "Add at least one in-demand skill (Java, Python, or React)",
        "Apply to 3–5 companies to increase selection probability",
        "Work on communication and resume clarity",
        "Attend mock interview sessions",
    ],
    "Low Risk": [
        "You are Tier-1 ready — target TCS, Infosys, Cognizant",
        "Sharpen system design and OOP concepts for interviews",
        "Aim for companies paying above 8 LPA",
        "Build at least one strong portfolio project",
        "Practice HR rounds and negotiation",
    ],
}


# ── Train ──────────────────────────────────────────────────────────────────────
def train() -> dict:
    """
    Trains K-Means risk clusterer on all students in MongoDB.
    Saves model + scaler + cluster-label mapping to disk.
    """
    print("[RiskClusterer] Loading student data from MongoDB...")
    df = load_students()

    if df.empty or len(df) < 3:
        # Not enough real data — generate synthetic
        print("  → Not enough real students, using synthetic data for K-Means")
        np.random.seed(42)
        n = 150
        data = {
            "cgpa":            np.clip(np.random.normal(7.0, 1.2, n), 4, 10),
            "dsa_marks":       np.clip(np.random.normal(65,  20,  n), 0, 100),
            "oops_marks":      np.clip(np.random.normal(65,  18,  n), 0, 100),
            "active_backlogs": np.random.choice([0,0,0,1,2,3], n),
            "rejection_count": np.random.choice([0,0,1,2,3],   n),
        }
        df = pd.DataFrame(data)

    X = df[FEATURES].fillna(0).values
    print(f"  → Training on {len(X)} students")

    # Normalize: StandardScaler makes each feature mean=0, std=1
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # K-Means with k=3, multiple restarts for stability
    kmeans = KMeans(n_clusters=3, n_init=20, random_state=42, max_iter=500)
    labels = kmeans.fit_predict(X_scaled)

    # Auto-label clusters by average CGPA of each cluster
    cluster_means = {}
    for c in range(3):
        mask = labels == c
        cluster_means[c] = df["cgpa"].values[mask].mean()

    # Sort: highest CGPA = Low Risk, lowest = High Risk
    sorted_clusters = sorted(cluster_means.items(), key=lambda x: -x[1])
    risk_map = {
        sorted_clusters[0][0]: "Low Risk",
        sorted_clusters[1][0]: "Medium Risk",
        sorted_clusters[2][0]: "High Risk",
    }

    print(f"  → Cluster → Risk mapping: {risk_map}")
    for c, risk in risk_map.items():
        mask = labels == c
        avg_cgpa = df["cgpa"].values[mask].mean()
        print(f"     Cluster {c} ({risk}): avg CGPA={avg_cgpa:.2f}, n={mask.sum()}")

    # Save everything
    joblib.dump({
        "kmeans":   kmeans,
        "scaler":   scaler,
        "risk_map": risk_map,
        "features": FEATURES,
    }, RISK_MODEL_PATH)
    print(f"  → Model saved to {RISK_MODEL_PATH}")

    return {
        "clusters": 3,
        "samples":  len(X),
        "risk_map": {str(k): v for k, v in risk_map.items()},
    }


# ── Predict ────────────────────────────────────────────────────────────────────
def predict(cgpa: float, dsa_marks: float, oops_marks: float,
            active_backlogs: int, rejection_count: int = 0) -> dict:
    """
    Assigns a student to a risk cluster and returns training suggestions.

    Returns:
        {
          risk_level: "High Risk" | "Medium Risk" | "Low Risk",
          cluster_id: int,
          suggestions: [str],    # 5 personalized training tips
          features_used: dict
        }
    """
    if not RISK_MODEL_PATH.exists():
        train()

    bundle = joblib.load(RISK_MODEL_PATH)
    kmeans:  KMeans         = bundle["kmeans"]
    scaler:  StandardScaler = bundle["scaler"]
    risk_map: dict          = bundle["risk_map"]

    X = np.array([[cgpa, dsa_marks, oops_marks, active_backlogs, rejection_count]])
    X_scaled = scaler.transform(X)
    cluster_id = int(kmeans.predict(X_scaled)[0])
    risk_level = risk_map.get(cluster_id, "Medium Risk")

    return {
        "risk_level":    risk_level,
        "cluster_id":    cluster_id,
        "suggestions":   SUGGESTIONS.get(risk_level, []),
        "features_used": {
            "cgpa": cgpa, "dsa_marks": dsa_marks, "oops_marks": oops_marks,
            "active_backlogs": active_backlogs, "rejection_count": rejection_count,
        }
    }
