# ML Model: Next-Topic Recommender

EduConnect includes a trained **ML model** that recommends which learning field (e.g. AI, Law, Business) a student should focus on next. This demonstrates a real ML pipeline integrated into the app.

## What it does

- **Training (Python):** A script reads user profiles and `study_stats` from the SQLite DB, builds a feature vector per user, and trains a **multinomial logistic regression** to predict “next topic to study”. The target is derived from each user’s current progress (e.g. field with lowest quiz score or not yet taken).
- **Inference (Node):** The server loads exported weights from `server/model_export.json` and runs inference in JavaScript so every study-plan request can get an ML suggestion without calling Python at runtime.
- **UI:** The Dashboard “Your Study Plan” section shows an **ML suggestion** when the model is available: *“Our ML model suggests focusing on [Field] next, based on your progress and similar learners.”*

## Pipeline

1. **Train (run periodically or after seeding users)**  
   From the `Educonnect` project root:
   ```bash
   pip install -r scripts/requirements-ml.txt
   python scripts/train_next_topic_model.py
   ```
   This writes:
   - `server/model_export.json` — feature names, classes, scaler (mean/scale), coefficients, intercept (used by Node).
   - `server/ml_predictions.json` — user_id → recommended field_id for users in the DB (optional; Node uses live inference instead).
   - `server/next_topic_model.joblib` — full scikit-learn model and scaler (for Python retraining/evaluation).

2. **Inference**  
   When the API serves a study plan (`GET /api/users/:userId/study-plan` or `POST /api/study-plan`), it calls `predictNextTopic(user)` in `server/mlInference.js`. That builds the same 17-dimensional feature vector, applies the scaler, runs the logistic regression (softmax), and returns the recommended `field_id`. The study plan engine adds an ML suggestion when a prediction is returned.

3. **Fallback**  
   If `model_export.json` is missing (e.g. before first training), no ML suggestion is added; the rest of the study plan (schedule + rule-based and cohort suggestions) is unchanged.

## Features (input to the model)

The same 17 features are used in training (Python) and inference (Node):

| Feature(s) | Description |
|------------|-------------|
| `course_area_*` | One-hot (4): Computing & IT, Law, Business & Management, Other |
| `n_interests` | Count of ordered interests (capped 0–1) |
| `n_weak`, `n_strong` | Counts of weak/strong topics (capped 0–1) |
| `total_hours` | Total study hours (normalized) |
| `final_score_ai`, … | Per-field final quiz score 0–1 (0 if not taken) |

## How to show “we applied ML”

1. **Run the training script** at least once (after the DB has some users, e.g. from signup or seed).
2. Ensure `server/model_export.json` exists so the server can load it.
3. Open the Dashboard: the “Your Study Plan” section will show the ML suggestion when the model is loaded and the user has a valid profile.

For reports/demos you can point to:

- **Training:** `scripts/train_next_topic_model.py` (scikit-learn `LogisticRegression`, multinomial).
- **Export:** `model_export.json` (portable weights + scaler for Node).
- **Inference:** `server/mlInference.js` (same features, scaling, softmax, argmax).
- **Integration:** `server/routes/studyPlan.js` and `server/studyPlanEngine.js` (ML suggestion merged into the study plan).

## Retraining

Re-run the script whenever you want to refresh the model (e.g. after new users or more quiz activity):

```bash
python scripts/train_next_topic_model.py
```

No server restart is strictly required if the server re-reads `model_export.json` on each request (current implementation caches it in memory; restart to load a new file, or add a file-watcher / cache-bust if needed).
