# Recent changes (Cohort insights + ML in study plan)

This document summarizes the **latest changes** added to EduConnect to demonstrate:

- **Cohort insights** (“students like you”) aggregation and suggestions
- A trained **ML model** integrated into the app (training in Python, inference in Node)

## What was added

### Cohort insights (Phase 2)

- **New file:** `server/cohortInsights.js`
  - Builds cohort aggregates from:
    - `users.study_stats` (weekly hours, total hours, field progress)
    - `activity_events` (e.g. `quiz_completed` payloads)
  - Outputs both:
    - **by course area** (e.g. Law / Business / Computing)
    - **global** aggregates

- **Updated:** `server/routes/studyPlan.js`
  - Study plan endpoints now compute `buildCohortInsights(req.db)` and pass them into the engine so suggestions can include cohort-based guidance.

- **Updated:** `server/studyPlanEngine.js`
  - Adds **cohort-based suggestions** such as peak study days and cohort averages.

- **Updated UI style:** `src/styles/Dashboard.css`
  - Added `.suggestion-type-cohort` styling so cohort suggestions look distinct in the Dashboard study plan section.

### ML model integration (trained + used in app)

This is a complete “train → export → inference → UI” ML loop.

- **New training script:** `scripts/train_next_topic_model.py`
  - Trains a **multinomial logistic regression** (scikit-learn) to predict the **next learning field** a student should focus on.
  - Reads from `server/educonnect.db` (users + study_stats).
  - Exports portable weights for Node:
    - `server/model_export.json` (scaler + coefficients + class labels)
    - also writes `server/ml_predictions.json` and `server/next_topic_model.joblib`

- **New deps list:** `scripts/requirements-ml.txt`
  - Minimal Python dependencies for training (numpy, scikit-learn, joblib).

- **New Node inference module:** `server/mlInference.js`
  - Loads `server/model_export.json`
  - Builds the same feature vector as Python
  - Applies scaling and runs softmax inference to produce a recommended `field_id`

- **Updated:** `server/routes/studyPlan.js`
  - Calls `predictNextTopic(user)` and passes the result into the study plan engine.

- **Updated:** `server/studyPlanEngine.js`
  - If an ML prediction is available, adds an **ML suggestion** at the top of the plan.

- **Updated UI style:** `src/styles/Dashboard.css`
  - Added `.suggestion-type-ml` styling for the ML suggestion.

- **New documentation:** `docs/ML_MODEL.md`
  - Explains the model, features, pipeline, and demo steps.

- **Updated:** `README.md`
  - Added a feature bullet + quick instructions for training the ML model.

## How to run the ML training

From the `Educonnect` folder:

```bash
pip install -r scripts/requirements-ml.txt
python scripts/train_next_topic_model.py
```

Notes:
- Run the server at least once so `server/educonnect.db` exists.
- For best results, have a few real users with quiz progress so training has real examples.
- After training writes `server/model_export.json`, restart the Node server to ensure it loads the new export (current inference module caches the file in memory).

## How to verify in the app

- Open the app and sign in.
- Go to **Dashboard → Your Study Plan**
  - You should see:
    - **ML suggestion** (type: `ml`) if `server/model_export.json` exists
    - **cohort suggestions** (type: `cohort`) as long as the DB has enough user stats/activity

## Files changed/added (quick list)

- **Added:** `server/cohortInsights.js`
- **Added:** `server/mlInference.js`
- **Added:** `scripts/train_next_topic_model.py`
- **Added:** `scripts/requirements-ml.txt`
- **Added:** `docs/ML_MODEL.md`
- **Added:** `docs/RECENT_CHANGES.md` (this file)
- **Updated:** `server/routes/studyPlan.js`
- **Updated:** `server/studyPlanEngine.js`
- **Updated:** `src/styles/Dashboard.css`
- **Updated:** `README.md`

