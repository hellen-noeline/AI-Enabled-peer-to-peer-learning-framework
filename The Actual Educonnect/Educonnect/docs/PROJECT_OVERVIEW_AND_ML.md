# EduConnect — Project Overview & ML Models

This document gives you a single place to **read and understand the whole project**, with **emphasis on the ML (machine learning) models** used in the system. Use it for onboarding, reports, or demos.

---

## 1. What EduConnect Is

**EduConnect** is an AI-enabled peer-to-peer learning platform for students (initially targeting Ugandan universities). It helps students:

- **Find study partners** matched by interests, skills, and preferences  
- **Access curated learning resources** by field (Computing, Law, Business, Education, Humanities, Health, Agriculture)  
- **Take quizzes** and track proficiency per learning field  
- **Get a personalised study plan** (weekly schedule + improvement suggestions)  
- **Chat with EduBot** for help, resource recommendations, and intent-based answers  
- **Form study groups** and use group chat with resource suggestions from conversation  

The stack is: **React (Vite)** frontend, **Node.js (Express)** API server, **SQLite** (sql.js) database, optional **Python** backend for NLP. Data pipelines and ML training are in **Python**; inference is in **Node.js** for the next-topic model and in **Python** (or Node) for the chatbot.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                                                 │
│  Dashboard, Profile, Recommendations, Quiz, Study Groups, EduBot, etc.  │
└─────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Node.js server (Express) — port 5000                                    │
│  Auth, users, dataset, signup options, study plan, chat (proxies NLP),   │
│  admin, feedback, activity logging                                      │
└─────────────────────────────────────────────────────────────────────────┘
        │                         │
        │                         │  (optional) POST /api/nlp/atlas-intent
        ▼                         ▼
┌──────────────────┐    ┌─────────────────────────────────────────────────┐
│  SQLite (sql.js) │    │  Python backend (Flask) — port 5001               │
│  users,          │    │  Intent classification (trained or embedding),  │
│  activity_events,│    │  sentence embeddings for EduBot                   │
│  signup_suggestions │  └─────────────────────────────────────────────────┘
└──────────────────┘

  Offline / periodic (Python scripts):
  - train_next_topic_model.py  → writes model_export.json for Node
  - signup_ml_pipeline.py      → writes signup_trends.json
  - (Colab) intent model       → download to backend/models/intent
```

---

## 3. ML Models — Summary Table

| Model / component        | Type                    | Where it runs     | Purpose |
|-------------------------|-------------------------|-------------------|--------|
| **Next-topic recommender** | Multinomial logistic regression | Node.js (inference), Python (training) | Suggests which learning field to study next |
| **EduBot intent**       | Transformer classifier or embedding similarity | Python backend    | Classify user message intent for chatbot replies |
| **Signup trends**       | Aggregation / stats     | Python script     | Summarise user/signup data for dropdowns and tuning |
| **Study plan engine**   | Rule-based + cohort stats | Node.js          | Weekly schedule and text suggestions (no ML) |
| **Cohort insights**     | Aggregation             | Node.js          | “Students like you” stats for study plan |
| **Recommendation engine** | Weighted scoring (Jaccard, exact match) | Frontend (React) | Study partner match score (algorithm, not trained ML) |
| **Chat resource recommender** | Keyword + profile bias | Frontend / server | Suggest resources from chat content and user profile |

Below we go through each **ML-related** part in more detail.

---

## 4. ML Model 1: Next-Topic Recommender

This is the **main trained ML model** in the app: it predicts **which learning field a student should focus on next** (e.g. AI, Law, Business).

### 4.1 What it does

- **Input:** User profile (course area, interests, weak/strong topics) and `study_stats` (quiz scores per field, total hours).
- **Output:** A recommended field ID (e.g. `ai`, `law`, `business`).
- **Where you see it:** Dashboard section “Your Study Plan” → “Our ML model suggests focusing on [Field] next”.

### 4.2 How it works

- **Training (Python)**  
  - Script: `scripts/Machine_learning_models/train_next_topic_model.py`  
  - Reads: `server/educonnect.db` (users + `study_stats`).  
  - **Target (label):** For each user, the “next topic” is the field with the **lowest final quiz score**, or the **first field not yet taken**.  
  - **Model:** Multinomial **logistic regression** (scikit-learn).  
  - **Features (17-D):**  
    - Course area one-hot (4): Computing & IT, Law, Business & Management, Other  
    - Normalised counts: `n_interests` (capped 0–1), `n_weak`, `n_strong` (capped 0–1)  
    - `total_hours` (normalised)  
    - Per-field final quiz score 0–1 for 9 fields: `ai`, `ml`, `ds`, `nlp`, `cv`, `cyber`, `web`, `law`, `business`  
  - **Export:**  
    - `server/model_export.json` — coefficients, intercept, scaler (mean/scale), feature names, class names (for Node).  
    - `server/next_topic_model.joblib` — full model for Python.  
    - Optionally `server/ml_predictions.json` — user_id → recommended field.

- **Inference (Node.js)**  
  - Module: `server/mlInference.js`  
  - Loads `model_export.json` (cached).  
  - For a given user object, builds the **same 17-D feature vector**, applies the **same scaler** (mean/scale), runs **linear combination + softmax**, returns the class with highest probability as the recommended field.  
  - Used by: `server/routes/studyPlan.js` → `server/studyPlanEngine.js` which adds one “ML suggestion” to the study plan.

### 4.3 How to run / retrain

From project root (Educonnect):

```bash
pip install -r scripts/requirements-ml.txt
python scripts/Machine_learning_models/train_next_topic_model.py
```

Ensure the server has been run at least once so `server/educonnect.db` exists (and ideally has some users with quiz data). After training, restart the Node server if it caches `model_export.json` in memory.

### 4.4 Why this counts as “applied ML”

- **Real training pipeline:** Python script, real DB data, scikit-learn.  
- **Real inference:** Node.js loads exported weights and runs the same maths (scaler + linear + softmax).  
- **Clear UX:** Dashboard shows “ML model suggests …” when the model is available.

---

## 5. ML / NLP Model 2: EduBot Intent (EduBot / AtlasBot)

EduBot (formerly AtlasBot) answers user messages and recommends resources. Its “brain” for **understanding intent** can be:

1. **Trained intent classifier** (optional): A transformer-based model trained in a Colab notebook, placed in `backend/models/intent` (or `intent_advanced`).  
2. **Fallback:** Embedding similarity: user message is embedded with **sentence-transformers**; intent is chosen by **cosine similarity** to predefined phrases per intent.

### 5.1 Trained intent model (optional)

- **Where:** Python backend (`backend/app.py`), port 5001.  
- **What:** If `backend/models/intent` (or `intent_advanced`) contains a Hugging Face–style model (`config.json`, tokenizer, weights), the backend loads **AutoModelForSequenceClassification** and **AutoTokenizer** and uses it for intent classification.  
- **Endpoint:** `POST /api/nlp/atlas-intent` with `{ "message": "..." }`. Returns `{ "intent": "...", "confidence": 0.0–1.0 }`.  
- **Training:** Done in a Colab notebook (e.g. intent classification on a custom dataset). Model is downloaded and placed under `backend/models/intent`. See `docs/INTENT_MODEL_SETUP.md`.  
- **Low confidence:** If confidence &lt; 0.35, intent is forced to `out_of_scope`.

### 5.2 Embedding fallback (no Colab model)

- **Model:** `SentenceTransformer` (e.g. a small sentence-embedding model).  
- **Intent phrases:** A fixed set of example phrases per intent in `ATLAS_INTENT_PHRASES`.  
- **Process:** Encode user message; encode each phrase; pick intent with **highest cosine similarity**; that similarity is the “confidence”.  
- So even without a trained classifier, the bot uses **semantic similarity** (embedding-based “NLP”) to match intents.

### 5.3 Flow in the app

- Frontend sends chat message to Node; Node can proxy to Python `POST /api/nlp/atlas-intent`.  
- Node (or Python) then uses the intent to choose a reply and/or call the **chat resource recommender** (keyword + user profile).  
- So: **NLP/ML here = intent classification (trained or embedding-based)** that drives EduBot’s behaviour.

---

## 6. “ML” Pipeline 3: Signup Trends (Aggregation)

Not a trained model, but an **ML-style pipeline** that uses the same DB and feeds into product behaviour.

- **Script:** `scripts/Machine_learning_models/signup_ml_pipeline.py`  
- **Input:** SQLite `users` and `signup_suggestions` tables.  
- **Process:** Aggregates counts and simple trends (e.g. popular degree programmes, interests, skills).  
- **Output:** `public/signup_trends.json`  
- **Use:** Can drive dropdown options, admin dashboards, or future model training.  
- Run manually from Educonnect root: `python scripts/Machine_learning_models/signup_ml_pipeline.py`

---

## 7. Rule-Based and Data-Driven (Not Trained ML)

These are important for “how the app works” but are **not** trained ML models.

### 7.1 Study plan engine

- **File:** `server/studyPlanEngine.js`  
- **Logic:** Rule-based. Uses user profile (weak/strong topics, ordered interests, preferred hours) and `study_stats` (field progress, weekly hours) to:  
  - Build a **weekly schedule** (which day, which focus, suggested hours).  
  - Generate **improvement suggestions** (e.g. “Improve in X”, “Take final for Y”).  
- **Cohort:** Gets **cohort insights** from `server/cohortInsights.js` (e.g. average hours by course area, peak days) and can add suggestions like “Students in your field often study most on Monday”.  
- **ML hook:** The **next-topic recommender** (Section 4) adds one extra suggestion line when available (“Our ML model suggests focusing on [Field] next”).

### 7.2 Cohort insights

- **File:** `server/cohortInsights.js`  
- **Input:** All non-admin users’ `course_area` and `study_stats` (and optionally activity).  
- **Output:** Aggregates by course area and globally: e.g. average weekly hours, peak days, quiz counts per field.  
- **Used by:** Study plan engine to personalise suggestions. No training; pure aggregation.

### 7.3 Recommendation engine (study partners)

- **File:** `src/utils/recommendationEngine.js`  
- **Method:** Weighted scoring, **no** trained model.  
  - **Content similarity (≈60%):** Jaccard on interests (ordered + additional), technical/soft/research/professional interests, hobbies; exact match on learning style, partner preference, academic level. Interests get 40% + 10% ranked-interest bonus.  
  - **Availability (≈25%):** Overlap of preferred study hours.  
  - **Engagement (≈15%):** From study stats (sessions, hours).  
- **Output:** Match score 0–100 and reasons. Used on Recommendations page and for study group formation.

### 7.4 Chat resource recommender

- **File:** `src/utils/chatResourceRecommender.js` (and server-side copy if used by chat route).  
- **Method:**  
  - **Keywords:** Map chat text to categories (ai, ml, law, business, etc.) via predefined keyword lists.  
  - **User bias:** If user profile is available, boost categories from `orderedInterests` and `courseArea`.  
- **Output:** List of suggested resources/categories. Used by EduBot and group chat to suggest links.

---

## 8. Data Flow and Where ML Fits

1. **User signs up / logs in** → Profile and preferences stored in SQLite.  
2. **User takes quizzes** → `study_stats.fieldProgress` updated (scores, proficiency per field).  
3. **User opens Dashboard** → Frontend requests study plan from Node.  
   - Node loads user + `study_stats`, builds **cohort insights**, calls **study plan engine**.  
   - Study plan engine uses **rule-based** schedule and suggestions, then calls **predictNextTopic(user)** in `mlInference.js` if `model_export.json` exists.  
   - One **ML suggestion** is appended: “Our ML model suggests focusing on [Field] next.”  
4. **User chats with EduBot** → Message sent to Node; Node may call Python `POST /api/nlp/atlas-intent`.  
   - Intent is either **trained classifier** or **embedding similarity**.  
   - Reply and resource suggestions use intent + **chat resource recommender** (keywords + profile).  
5. **Periodic/offline:**  
   - Run `train_next_topic_model.py` to refresh the next-topic model.  
   - Run `signup_ml_pipeline.py` to refresh signup trends.  
   - Optionally retrain intent model in Colab and replace files in `backend/models/intent`.

---

## 9. File Reference — Where to Find What

| What | Where |
|------|--------|
| Next-topic model **training** | `scripts/Machine_learning_models/train_next_topic_model.py` |
| Next-topic model **export** | `server/model_export.json` |
| Next-topic **inference** | `server/mlInference.js` |
| Study plan API + ML hook | `server/routes/studyPlan.js`, `server/studyPlanEngine.js` |
| EduBot **intent** (trained or embedding) | `backend/app.py` (Flask), `/api/nlp/atlas-intent` |
| Intent model **setup** | `docs/INTENT_MODEL_SETUP.md` |
| Next-topic model **doc** | `docs/ML_MODEL.md` |
| Signup trends pipeline | `scripts/Machine_learning_models/signup_ml_pipeline.py` |
| Cohort insights | `server/cohortInsights.js` |
| Study plan design | `docs/STUDY_PLAN_AND_ML.md` |
| Recommendation engine | `src/utils/recommendationEngine.js` |
| Chat resource recommender | `src/utils/chatResourceRecommender.js` |

---

## 10. How to Explain “We Used ML” in This Project

You can accurately say:

1. **Next-topic recommender:** We train a **multinomial logistic regression** in Python on user and quiz data, export weights to JSON, and run **inference in Node.js** to suggest the next learning field. This is a real ML pipeline (train → export → infer in production).  
2. **EduBot:** We use **NLP** for intent: either a **transformer-based intent classifier** (trained in Colab and loaded in the Python backend) or **sentence embedding similarity** as fallback.  
3. **Signup trends:** We run an **ML-style pipeline** (Python script) that aggregates user and signup data into trends used for product behaviour.  
4. **Personalisation:** The study plan combines **rule-based** logic, **cohort aggregation**, and the **ML next-topic suggestion**; study partner matching uses a **weighted scoring algorithm** (not a trained model but a clear, explainable method).

This document plus `docs/ML_MODEL.md` and `docs/INTENT_MODEL_SETUP.md` should be enough to read and understand the whole project with emphasis on the ML models.
