"""
models/placement_predictor.py
==============================
ML Model 1: Placement Predictor using Random Forest Classifier

HOW IT WORKS:
  - Trains on historical Application records (Selected/Rejected)
  - Joins student profile features to each application
  - Learns which combination of CGPA, DSA, OOPs, backlogs, skills
    most often leads to placement
  - Predicts probability (0–100%) of a new student getting placed

WHY RANDOM FOREST:
  - Handles small datasets without overfitting (10-100 students)
  - Gives feature importance (which factor matters most)
  - No need for feature scaling
  - Works well even with imbalanced classes (more rejections than selections)
"""

import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import PLACEMENT_MODEL_PATH
from data.mongo_loader import load_applications_with_students, load_students


# Feature columns used for training/inference (must match in both)
FEATURES = ["cgpa", "dsa_marks", "oops_marks", "active_backlogs",
            "skill_count", "has_core_skill", "rejection_count"]

# ── Synthetic training data generator ──────────────────────────────────────────
# Since seed data has very few labeled applications, we augment with synthetic
# samples based on domain rules. This improves generalization significantly.

def _generate_synthetic_data(n=200) -> pd.DataFrame:
    """
    Generates synthetic placement records based on domain knowledge.
    Used when real MongoDB data is insufficient (< 10 labeled records).

    Rule set (based on real placement patterns at engineering colleges):
      - CGPA > 7.5 + DSA > 70 → high chance of placement
      - backlogs > 1 → low chance
      - skill_count > 3 → boosts probability
      - has_core_skill → boosts probability
    """
    np.random.seed(42)
    rows = []
    for _ in range(n):
        cgpa        = np.random.uniform(5.0, 10.0)
        dsa         = np.random.uniform(30, 100)
        oops        = np.random.uniform(30, 100)
        backlogs    = int(np.random.choice([0, 0, 0, 1, 2, 3], p=[0.5, 0.15, 0.1, 0.1, 0.1, 0.05]))
        skill_count = int(np.random.randint(1, 8))
        core        = int(np.random.choice([0, 1], p=[0.4, 0.6]))
        rej_count   = int(np.random.choice([0, 1, 2, 3], p=[0.4, 0.3, 0.2, 0.1]))

        # Placement probability based on domain rules
        score = (
            (cgpa / 10) * 0.35 +
            (dsa / 100) * 0.25 +
            (oops / 100) * 0.15 +
            (skill_count / 7) * 0.10 +
            core * 0.10 -
            backlogs * 0.05 -
            rej_count * 0.02
        )
        label = 1 if score > 0.55 + np.random.normal(0, 0.1) else 0

        rows.append({
            "cgpa": cgpa, "dsa_marks": dsa, "oops_marks": oops,
            "active_backlogs": backlogs, "skill_count": skill_count,
            "has_core_skill": core, "rejection_count": rej_count, "label": label
        })
    return pd.DataFrame(rows)


# ── Train ──────────────────────────────────────────────────────────────────────
def train() -> dict:
    """
    Trains the Random Forest placement predictor.
    1. Load real data from MongoDB via PyMongo
    2. If real data < 10, augment with synthetic data
    3. Split 80/20 train/test
    4. Train RandomForestClassifier
    5. Save model to disk with joblib
    6. Return accuracy metrics
    """
    print("[PlacementPredictor] Loading training data from MongoDB...")
    real_df = load_applications_with_students()
    print(f"  → Real labeled applications found: {len(real_df)}")

    # Augment with synthetic data (always add some to improve generalization)
    synth_df = _generate_synthetic_data(n=300)

    # Combine: real data weighted 3× (duplicate it)
    frames = [synth_df]
    if not real_df.empty:
        for _ in range(3):          # Weight real data 3×
            frames.append(real_df)
    df = pd.concat(frames, ignore_index=True)
    df = df.dropna()

    print(f"  → Total training samples: {len(df)} ({df['label'].sum()} placed, {(df['label']==0).sum()} not placed)")

    X = df[FEATURES].values
    y = df["label"].values

    # Cross-validation (5-fold) for honest accuracy estimate
    model_cv = RandomForestClassifier(
        n_estimators=150,
        max_depth=8,
        min_samples_split=4,
        class_weight="balanced",   # handles imbalanced classes
        random_state=42
    )
    cv_scores = cross_val_score(model_cv, X, y, cv=5, scoring="accuracy")
    print(f"  → 5-Fold CV Accuracy: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

    # Final model on full data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestClassifier(
        n_estimators=150, max_depth=8,
        min_samples_split=4, class_weight="balanced", random_state=42
    )
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"  → Test Accuracy: {acc:.3f}")
    print(classification_report(y_test, y_pred, target_names=["Not Placed", "Placed"]))

    # Feature importances
    importances = dict(zip(FEATURES, model.feature_importances_))
    print("  → Feature Importances:", {k: f"{v:.3f}" for k, v in importances.items()})

    # Save to disk
    joblib.dump({"model": model, "features": FEATURES}, PLACEMENT_MODEL_PATH)
    print(f"  → Model saved to {PLACEMENT_MODEL_PATH}")

    return {
        "cv_accuracy": round(float(cv_scores.mean()), 3),
        "test_accuracy": round(float(acc), 3),
        "samples": len(df),
        "feature_importances": {k: round(float(v), 4) for k, v in importances.items()},
    }


# ── Predict ────────────────────────────────────────────────────────────────────
def predict(cgpa: float, dsa_marks: float, oops_marks: float,
            active_backlogs: int, skills: list) -> dict:
    """
    Predicts placement probability for a given student profile.

    Returns:
        {
          placed: bool,           # True if predicted to be placed
          confidence: float,      # 0-100 probability
          insights: [str],        # Human-readable explanation
          feature_values: dict    # The features used for this prediction
        }
    """
    if not PLACEMENT_MODEL_PATH.exists():
        train()

    bundle = joblib.load(PLACEMENT_MODEL_PATH)
    model: RandomForestClassifier = bundle["model"]

    skill_count    = len(skills) if skills else 0
    CORE_SKILLS    = {"java", "python", "react", "node.js", "dsa", "c++", "sql", "javascript"}
    has_core_skill = int(any(s.lower() in CORE_SKILLS for s in (skills or [])))

    # We use rejection_count=0 for prediction (future student, unknown rejections)
    X = np.array([[cgpa, dsa_marks, oops_marks, active_backlogs,
                   skill_count, has_core_skill, 0]])

    prob = model.predict_proba(X)[0]
    placed_prob = float(prob[1]) * 100  # probability of class=1 (Placed)
    placed      = placed_prob >= 50.0

    # Human-readable insights
    insights = []
    if cgpa >= 7.5:
        insights.append(f"✅ Strong CGPA ({cgpa:.1f}) boosts placement chance")
    elif cgpa < 6.0:
        insights.append(f"⚠️ CGPA ({cgpa:.1f}) is below most company cutoffs — aim for 6.0+")

    if dsa_marks >= 70:
        insights.append(f"✅ Good DSA score ({dsa_marks:.0f}/100)")
    else:
        insights.append(f"⚠️ DSA score ({dsa_marks:.0f}/100) needs improvement — target 70+")

    if active_backlogs > 0:
        insights.append(f"⚠️ {active_backlogs} active backlog(s) — many companies require 0 backlogs")

    if has_core_skill:
        insights.append("✅ You have at least one in-demand core skill")
    else:
        insights.append("⚠️ Learn at least one core skill: Java, Python, React, or DSA")

    if skill_count >= 4:
        insights.append(f"✅ Good skill variety ({skill_count} skills listed)")

    return {
        "placed":        placed,
        "confidence":    round(placed_prob, 1),
        "insights":      insights,
        "feature_values": {
            "cgpa": cgpa, "dsa_marks": dsa_marks, "oops_marks": oops_marks,
            "active_backlogs": active_backlogs, "skill_count": skill_count,
        }
    }
