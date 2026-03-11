#!/usr/bin/env python3
"""
Train an ML model for "next topic to study" recommendation.

- Reads users + study_stats from EduConnect SQLite DB.
- Builds features: course_area (one-hot), interest/weak/strong counts, total_hours,
  and per-field final scores (0–100 or 0 if not taken).
- Target: field that needs work (lowest score or first not taken).
- Trains a Logistic Regression (multinomial) so we can export weights for Node inference.
- Exports:
  - server/ml_predictions.json  — user_id -> recommended field_id (for known users)
  - server/model_export.json    — feature_names, classes, coefficients, intercept (for Node)
  - server/next_topic_model.joblib — full model (for Python retraining/eval)

Run from Educonnect root:
  python scripts/train_next_topic_model.py
"""

import json
import sqlite3
from pathlib import Path

import numpy as np

BASE_DIR = Path(__file__).resolve().parents[1]
DB_PATH = BASE_DIR / "server" / "educonnect.db"
SERVER_DIR = BASE_DIR / "server"

FIELD_IDS = [
    "ai", "ml", "ds", "nlp", "cv", "cyber", "web", "law", "business"
]
COURSE_AREAS = ["Computing & IT", "Law", "Business & Management", "Other"]


def split_list(s):
    if not s or not isinstance(s, str):
        return []
    return [x.strip() for x in s.split(",") if x.strip()]


def build_feature_vector(row, course_area_index, feature_names_out=None):
    """Build a numeric feature vector for one user. Must match Node's buildFeatureVector."""
    course_area = (row.get("course_area") or "").strip() or "Other"
    try:
        area_idx = COURSE_AREAS.index(course_area)
    except ValueError:
        area_idx = COURSE_AREAS.index("Other")
    area_one_hot = [1.0 if i == area_idx else 0.0 for i in range(len(COURSE_AREAS))]

    ordered = split_list(row.get("ordered_interests") or "")
    weak = split_list(row.get("weak_topics") or "")
    strong = split_list(row.get("strong_topics") or "")

    n_interests = min(len(ordered), 20)
    n_weak = min(len(weak), 10)
    n_strong = min(len(strong), 10)

    try:
        stats = json.loads(row["study_stats"]) if row.get("study_stats") else {}
    except (TypeError, json.JSONDecodeError):
        stats = {}
    fp = stats.get("fieldProgress") or {}
    total_hours = float(stats.get("totalHours") or 0)
    total_hours = min(total_hours, 200) / 100.0  # rough normalize

    field_scores = []
    for fid in FIELD_IDS:
        p = fp.get(fid) or {}
        score = p.get("finalScore")
        if score is None:
            score = 0.0
        else:
            score = float(score)
        field_scores.append(min(max(score, 0), 100) / 100.0)

    vec = area_one_hot + [n_interests / 20.0, n_weak / 10.0, n_strong / 10.0, total_hours] + field_scores
    if feature_names_out is not None:
        feature_names_out.clear()
        feature_names_out.extend(
            [f"course_area_{a}" for a in COURSE_AREAS]
            + ["n_interests", "n_weak", "n_strong", "total_hours"]
            + [f"final_score_{f}" for f in FIELD_IDS]
        )
    return vec


def get_target_field_id(row):
    """Recommendation target: field with lowest final score, or first not taken."""
    try:
        stats = json.loads(row["study_stats"]) if row.get("study_stats") else {}
    except (TypeError, json.JSONDecodeError):
        stats = {}
    fp = stats.get("fieldProgress") or {}
    best = None
    best_score = 101.0
    for fid in FIELD_IDS:
        p = fp.get(fid) or {}
        score = p.get("finalScore")
        if score is None:
            return fid  # first not taken
        score = float(score)
        if score < best_score:
            best_score = score
            best = fid
    return best or FIELD_IDS[0]


def main():
    try:
        from sklearn.linear_model import LogisticRegression
        from sklearn.preprocessing import StandardScaler
        import joblib
    except ImportError:
        print("Install scikit-learn and joblib: pip install scikit-learn joblib")
        raise

    if not DB_PATH.exists():
        print(f"DB not found: {DB_PATH}. Start the server once to create it.")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.execute(
        "SELECT id, course_area, ordered_interests, weak_topics, strong_topics, study_stats FROM users WHERE role = ?",
        ("user",),
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    if len(rows) < 5:
        print("Few users in DB; creating a minimal model from seed-like data.")
        # Synthetic fallback: still export a valid model_export so Node doesn't break
        n_features = 4 + 4 + len(FIELD_IDS)  # course_area(4) + n_* + total_hours(4) + field_scores(9)
        X = np.zeros((5, n_features))
        X[:, 0] = 1  # Computing & IT
        y = np.array([FIELD_IDS.index("ai"), FIELD_IDS.index("ml"), FIELD_IDS.index("ds"), FIELD_IDS.index("law"), FIELD_IDS.index("business")])
    else:
        feature_names = []
        X_list = []
        y_list = []
        for row in rows:
            vec = build_feature_vector(row, None, feature_names)
            X_list.append(vec)
            target_fid = get_target_field_id(row)
            y_list.append(FIELD_IDS.index(target_fid))
        X = np.array(X_list, dtype=np.float64)
        y = np.array(y_list)

    n_features = X.shape[1]
    feature_names_final = (
        [f"course_area_{a}" for a in COURSE_AREAS]
        + ["n_interests", "n_weak", "n_strong", "total_hours"]
        + [f"final_score_{f}" for f in FIELD_IDS]
    )
    assert n_features == len(feature_names_final), (n_features, len(feature_names_final))

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    # Handle possible constant columns
    X_scaled = np.nan_to_num(X_scaled, nan=0.0, posinf=0.0, neginf=0.0)

    model = LogisticRegression(
        multi_class="multinomial",
        max_iter=500,
        random_state=42,
        C=0.5,
    )
    model.fit(X_scaled, y)

    SERVER_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {"model": model, "scaler": scaler, "feature_names": feature_names_final, "classes": FIELD_IDS},
        SERVER_DIR / "next_topic_model.joblib",
    )

    # Predictions per user for known users
    predictions = {}
    for i, row in enumerate(rows):
        if i < X.shape[0]:
            pred_idx = model.predict(X_scaled[i : i + 1])[0]
            predictions[row["id"]] = FIELD_IDS[pred_idx]

    with open(SERVER_DIR / "ml_predictions.json", "w", encoding="utf-8") as f:
        json.dump(predictions, f, indent=2)

    # Export for Node: coefficients and intercept (after scaling)
    # Node will need to scale features the same way: (x - mean) / std
    mean_ = scaler.mean_.tolist()
    scale_ = scaler.scale_.tolist()
    scale_ = [s if s > 1e-8 else 1.0 for s in scale_]
    coef = model.coef_.tolist()
    intercept = model.intercept_.tolist()
    export = {
        "modelType": "logistic_multinomial",
        "featureNames": feature_names_final,
        "classes": FIELD_IDS,
        "scaler": {"mean": mean_, "scale": scale_},
        "coefficients": coef,
        "intercept": intercept,
    }
    with open(SERVER_DIR / "model_export.json", "w", encoding="utf-8") as f:
        json.dump(export, f, indent=2)

    print(f"Trained on {X.shape[0]} users. Exported:")
    print(f"  - {SERVER_DIR / 'ml_predictions.json'}")
    print(f"  - {SERVER_DIR / 'model_export.json'}")
    print(f"  - {SERVER_DIR / 'next_topic_model.joblib'}")


if __name__ == "__main__":
    main()
