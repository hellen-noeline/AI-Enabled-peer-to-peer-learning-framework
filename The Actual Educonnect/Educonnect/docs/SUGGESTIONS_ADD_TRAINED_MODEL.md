# Suggestions: How to Add a Trained Model to EduConnect

You already have **training pipelines** in the project; what’s missing are the **trained artifacts** (export files or weights). Below are concrete ways to add at least one (or more) trained models.

---

## Option 1: Add the Next-Topic Model (Easiest — Use Existing Script)

This gives you a **real trained model** used on the Dashboard (“Our ML model suggests focusing on [Field] next”).

### Steps

1. **Ensure you have data to train on**
   - The script reads `server/educonnect.db`. If the DB has few or no users with `study_stats`, the model will still train but on very little data.
   - **Option A:** Run the app, sign up a few users, take some quizzes, then train.
   - **Option B:** Run the server seed so the DB has users:  
     `cd server && npm run seed` (if you have a seed script). Then run the training script.

2. **Run the training script** (from project root `Educonnect/`):
   ```bash
   pip install -r scripts/requirements-ml.txt
   python scripts/Machine_learning_models/train_next_topic_model.py
   ```
   This creates:
   - `server/model_export.json` ← Node uses this for inference
   - `server/next_topic_model.joblib` (optional, for Python)
   - `server/ml_predictions.json` (optional)

3. **Restart the Node server** so it loads the new `model_export.json`.

4. **(Optional) Commit the trained export**
   - If you want the repo to ship with a working model, add and commit `server/model_export.json`.
   - You may want to add a note in README: “Pre-trained next-topic model included; run `train_next_topic_model.py` to retrain.”

### If the DB is empty: train on synthetic data

- Add a small script or one-off that inserts a few dozen synthetic users with `study_stats` (e.g. random course areas, interests, and per-field quiz scores) into the DB, then run `train_next_topic_model.py`. That way you always get a valid export even with no real users yet.
- Alternatively, change the training script so that when there are too few rows it generates synthetic training data and trains on that, then exports as usual. Then you always have a trained model after one run.

---

## Option 2: Add the EduBot Intent Model (NLP)

This gives you a **trained intent classifier** for EduBot instead of (or before) embedding similarity.

### Steps

1. **Get or create an intent dataset**
   - Use existing data: e.g. `data/intents.csv` if present, or the intent examples from the backend (e.g. `ATLAS_INTENT_PHRASES` in `backend/app.py`).
   - Format: rows like `text, intent` (e.g. “how do I find study partners”, “study_partners”).

2. **Train the model**
   - **In Colab:** Use the notebook mentioned in `docs/INTENT_MODEL_SETUP.md` (e.g. intent classification with a small BERT or DistilBERT). Export the model (e.g. Hugging Face format: `config.json`, `pytorch_model.bin` or `model.safetensors`, tokenizer files).
   - **Locally:** If you have a notebook under `notebooks/` (e.g. `NLP_intent_final.ipynb`), run it locally and set the output dir to `backend/models/intent` so the saved model is already in the right place.

3. **Place the full model in the project**
   - Copy the **entire** saved model folder into:
     - `Educonnect/backend/models/intent/`  
     or keep using  
     - `Educonnect/backend/models/intent_advanced/`
   - The folder must contain at least:
     - `config.json`
     - `pytorch_model.bin` **or** `model.safetensors`
     - Tokenizer files (`tokenizer_config.json`, `vocab.txt` or `tokenizer.json`, etc.)

4. **Run the Python backend**
   - Start the Flask app: `cd backend && python app.py`. It will load the model from `models/intent` or `intent_advanced` and use it for `POST /api/nlp/atlas-intent`.

5. **(Optional) Commit the model**
   - If the model is small, you can commit it. If it’s large, use Git LFS or document “Download from [link] and place in `backend/models/intent`” in README.

---

## Option 3: Ship a Default Next-Topic Export (No Runtime Data Needed)

So that **every clone has a working trained model** without running the training script first.

### Idea

- Add a **pre-trained** `server/model_export.json` that was produced by running `train_next_topic_model.py` once (e.g. on a DB with synthetic or seeded users).
- Commit this file. New users get the ML suggestion on the Dashboard immediately.
- In README, say: “A default next-topic model is included. To retrain with your own data, run `python scripts/Machine_learning_models/train_next_topic_model.py`.”

### Steps

1. Run the training script once (with seeded or synthetic data) to generate `server/model_export.json`.
2. Commit `server/model_export.json`.
3. Optionally add `server/model_export.json` to a “pre-trained models” section in README or in `docs/ML_MODEL.md`.

---

## Option 4: New Trained Models (Ideas for Extension)

If you want to add **another** trained model beyond next-topic and intent:

| Idea | What it does | Where it could live |
|------|----------------|---------------------|
| **Study partner compatibility** | Predict match score or “good match” from two profiles (e.g. small neural net or boosted tree). | Train in Python; export coefficients or ONNX; call from Node or from a small Python service. |
| **Quiz difficulty / performance** | Predict score or “pass” for a user on a quiz from profile + history. | Same as above; use in Quiz Hub or recommendations. |
| **Resource recommendation** | Given user profile + history, output top-k resource categories or IDs. | Collaborative filtering or a small classifier; export or serve via API. |
| **Session length / engagement** | Predict “likely to study X minutes” or “likely to complete session.” | Small regression/classification model; use for study plan or reminders. |

For any of these:

- **Data:** Use existing tables (`users`, `study_stats`, `activity_events`) or new ones.
- **Train:** Python script or notebook; save model (e.g. joblib, ONNX, or JSON weights like next-topic).
- **Inference:** Node (if you export simple weights) or a small Python microservice the Node server calls.

---

## Summary: What to Do First

1. **Fastest:** Run **Option 1** (next-topic script). You then have one real trained model in the app.
2. **For demos/reports:** Do **Option 3** (commit a default `model_export.json`) so the repo “has a trained model” out of the box.
3. **For stronger NLP:** Do **Option 2** (intent model in Colab/local → put weights in `backend/models/intent`).
4. **For more ML depth:** Pick one idea from **Option 4** and implement a small pipeline (data → train → export or API).

If you tell me which option you want (e.g. “Option 1 + Option 3” or “Option 2”), I can give step-by-step commands and exact file paths for your repo.
