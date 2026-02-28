# EduConnect – Improvement Plan for Final Year Project (2 Semesters)

**Goal:** Make the project stand out in **algorithms** and **data science** while keeping it feasible over two semesters. Each suggestion is designed to be defensible in a thesis and impressive in a viva.

---

## Current strengths (baseline)

- Weighted Jaccard similarity for study partner recommendations
- BERTopic for topic modeling on feedback/chat
- In-browser sentiment (DistilBERT)
- Study groups with a simple match threshold (30%)
- Existing notebook: US students ML pipeline (KMeans, RandomForest, PCA, silhouette)

---

## Part A: Algorithm improvements

### A1. Recommendation system – multi-strategy & explainability (High impact)

**Why it stands out:** Shows you understand **recommender systems** (content-based, collaborative, hybrid) and **explainable AI**.

**Improvements:**

1. **Add a second similarity measure (e.g. cosine on TF–IDF or embeddings)**  
   - Treat each user’s text fields (interests, skills, etc.) as one document.  
   - Compute TF–IDF (or use SentenceTransformer embeddings from backend) and **cosine similarity** between users.  
   - **Hybrid score:** `final = α * jaccard_weighted + (1−α) * cosine` (tune α, e.g. 0.6/0.4).  
   - Compare in a notebook: Jaccard vs cosine vs hybrid on a few hand-picked “good matches”.

2. **Explainability – “Why this partner?”**  
   - For each recommended user, return **contribution per factor** (e.g. CS interests +32%, Technical skills +18%, …).  
   - In the UI: show a small bar chart or list: “Matched on: Machine Learning, Python, morning study.”  
   - **In report:** Discuss explainability and user trust (reference: Explainable Recommendation).

3. **Diversity and exploration**  
   - Avoid “all top-10 look the same”. Add **MMR (Maximal Marginal Relevance)** or a simple diversity penalty: slightly demote users very similar to already-shown ones.  
   - One formula: `score_final(u) = score(u) − λ * max_{v in shown} similarity(u,v)`.  
   - **In report:** Describe cold start, diversity vs relevance trade-off.

**Where in code:**  
- New module e.g. `src/utils/recommendationEngineV2.js` (or Python service) for hybrid + explainability.  
- Backend endpoint optional: `POST /api/similarity` that returns scores + breakdown (if you move TF–IDF/embeddings to server).

**Deliverable:** Short “Recommendation methodology” section + comparison table (Jaccard vs hybrid) and a screenshot of “Why this partner?” in the report.

---

### A2. Study group formation as an optimization / graph problem (High impact)

**Why it stands out:** Moves from “ad-hoc groups by interest” to a clear **algorithmic formulation**.

**Option 1 – Graph-based communities**

- **Graph:** Nodes = users; edge between two users = similarity (from your existing engine).  
- Run **community detection:** e.g. **Louvain** or **Label Propagation** (e.g. `python-louvain`, `networkx`).  
- Each community = one study group. You can filter by “has at least one interest in common” and min size (e.g. 3–6).  
- **In report:** Describe the graph model, the algorithm, and why it yields more coherent groups than “one group per interest”.

**Option 2 – Constrained clustering (e.g. K-means or custom)**

- **Features:** Vector per user from interests/skills (e.g. multi-hot or embedding).  
- **Goal:** Cluster users into K groups with constraints:  
  - Min/max group size (e.g. 3–8).  
  - Minimum average intra-cluster similarity (so groups are not random).  
- Implement with **K-means** (or K-medoids) and post-process to enforce size; or use **constrained K-means** if you find a library.  
- **In report:** Objective function, constraints, and comparison with current “interest-only” groups (e.g. average match score, balance of group sizes).

**Where in code:**  
- Backend (Python): `backend/group_formation.py` – input: list of users; output: list of groups.  
- Frontend: Study Groups page calls this API when generating groups (with fallback to current logic if API fails).

**Deliverable:** “Study group formation algorithm” subsection + graph figure (nodes = users, edges = similarity, colors = communities) in the report.

---

### A3. Session quality / “productive time” inference (Medium impact)

**Why it stands out:** Shows **behavioral modeling** and simple **state/activity** reasoning.

**Idea:** Not all “timer on” time is equal. Use heuristics or a tiny model to label segments as **productive** vs **idle**.

**Simple approach (no ML):**

- Use **inactivity windows**: if the user was inactive for >2 min in a 10 min window, count only the active segments (e.g. 8 min productive).  
- Store both “raw minutes” and “productive minutes” in study stats; show both in analytics.

**Data-science approach (if you have enough data):**

- Collect (anonymized) features: duration, time-of-day, day-of-week, subject (if user tags), number of pauses.  
- Label: “productive” if e.g. they later passed a quiz in that subject or self-rated (optional survey).  
- Train a small **classifier** (e.g. Random Forest or logistic regression) and predict productive vs idle for new sessions.  
- **In report:** Feature importance, precision/recall, and limitation (labels may be noisy).

**Where in code:**  
- StudyContext: when stopping a session, compute “productive seconds” (e.g. total − idle segments).  
- Optional: backend endpoint to log session features and return “productive_minutes” from a small model.

**Deliverable:** “Study session quality estimation” paragraph + one chart (e.g. raw vs productive hours per week) in the report.

---

### A4. “What to study next” – simple recommender (Medium impact)

**Why it stands out:** Classic **recommendation** problem (next best action) using profile and progress.

**Idea:** Recommend **next learning resource** or **next quiz** based on:

- **Weak topics** (from profile or from low quiz scores in `fieldProgress`).  
- **Goals:** e.g. “Improve in ML” if ML score is lowest.  
- **Time available:** e.g. “You have 30 min – try this short resource.”  
- **Diversity:** don’t recommend the same category every time.

**Algorithm:**

- Score each resource/quiz: + for “matches weak topic”, + for “not completed yet”, + for “fits time”, − for “recently recommended”.  
- Rank and show top 3 as “Suggested for you” on Dashboard or Resources page.

**Where in code:**  
- `src/utils/nextBestAction.js` (or similar) using `user.studyStats.fieldProgress`, `user.weakTopics`, and `learningResources` / `quizData`.  
- Dashboard: one card “Suggested for you” with 2–3 links.

**Deliverable:** “Next-best-action recommendation” in report + one UI screenshot.

---

## Part B: Data science improvements

### B1. Proper EDA and dataset story (Essential)

**Why it stands out:** Every strong data science project starts with **data understanding** and **reproducibility**.

**Improvements:**

1. **Single “project dataset”**  
   - Combine Ugandan + US (and any survey) into one clean dataset with a **data dictionary** (column names, types, meaning).  
   - Version it (e.g. `data/educonnect_students_v1.csv`) and document how it was built.

2. **EDA notebook (Jupyter)**  
   - Distributions: interests, skills, learning style, study hours.  
   - Missing values: count, simple imputation strategy (e.g. “None” for text, mode for categorical).  
   - Correlations: e.g. GPA vs study hours, interests vs skills (heatmap).  
   - Text: word clouds or bar charts of top N interests/skills.  
   - **In report:** “Data exploration” section with 4–6 key figures and short conclusions.

3. **Feature engineering**  
   - Derived features: “number of interests”, “number of skills”, “interest–skill overlap”, “preferred_hour_encoded” (morning/afternoon/evening).  
   - Use these in clustering and in “what to study next”.  
   - **In report:** Table of engineered features and rationale.

**Where:**  
- `notebooks/01_eda_and_feature_engineering.ipynb` (and keep `us_students_ml_pipeline.ipynb` as the ML part).

**Deliverable:** EDA notebook + “Data” and “Feature engineering” sections in report.

---

### B2. Predictive models (High impact)

**Why it stands out:** Shows **supervised learning**, **evaluation**, and **interpretation**.

**Model 1 – Match satisfaction / “good match” prediction (if you have or can simulate labels)**

- **Idea:** Predict whether a pair (user A, user B) would be a “good” study match.  
- **Labels:** From implicit feedback (e.g. “did they message / join same group?”) or from a small survey; if no data, **synthetic labels**: good match = top 20% by current Jaccard score, bad = bottom 20%.  
- **Features:** All pairwise features you already use (Jaccard per dimension, cosine if added), plus user A/B features (e.g. number of interests).  
- **Model:** Logistic regression or Random Forest.  
- **Evaluation:** Accuracy, F1, ROC–AUC; cross-validation.  
- **In report:** “Predicting match quality” + feature importance (e.g. which factors matter most).

**Model 2 – Quiz performance / at-risk prediction**

- **Idea:** Predict **quiz pass/fail** or **score bucket** (e.g. &lt;50, 50–70, 70–90, 90+) from: study hours (total and per week), field, number of quizzes attempted, time since last study.  
- **Data:** From `studyStats` and `fieldProgress` (export to CSV from app or seed from script).  
- **Model:** Random Forest or XGBoost; report accuracy and **feature importance** (e.g. “study hours this week” is top predictor).  
- **In report:** “Predicting quiz performance” + confusion matrix and business interpretation (e.g. “suggests promoting more study time before quizzes”).

**Model 3 – Study hours / engagement forecast (optional)**

- **Idea:** Simple **time series** or **regression**: predict next week’s study hours from past weeks (and optionally user features).  
- **Model:** Linear regression on lagged features (last 2–3 weeks) or a simple AR-like model.  
- **In report:** RMSE/MAE and use case (“dashboard can show predicted hours”).

**Where:**  
- `notebooks/02_match_prediction.ipynb`, `03_quiz_performance_prediction.ipynb` (and optionally 04 for forecasting).  
- Optionally expose “predicted pass probability” or “suggested study hours” via backend for the UI.

**Deliverable:** One or two full notebook(s) with train/test split, metrics, and feature importance; summary in report.

---

### B3. NLP – beyond BERTopic (High impact)

**Why it stands out:** Demonstrates **NLP pipeline**, **evaluation**, and **product use**.

**1. Topic model evaluation**

- Compute **topic coherence** (e.g. C_v or NPMI) for BERTopic output.  
- Compare **number of topics** (e.g. auto vs fixed 5, 10) and report coherence scores.  
- **In report:** “Topic model evaluation” with a table (e.g. min_topic_size=2 vs 5, coherence score).

**2. Sentiment over time**

- For each feedback/chat message with a timestamp, run your existing sentiment (or backend call).  
- Aggregate by week: % positive / negative / neutral.  
- **Dashboard:** Simple line chart “Sentiment trend” (weeks on x-axis).  
- **In report:** “Sentiment analysis of user feedback” + one trend figure.

**3. Keyphrase extraction from feedback**

- Use **YAKE** (or KeyBERT, or simple TF–IDF top phrases) on feedback text to get “what users talk about” (e.g. “login issue”, “quiz difficulty”).  
- Show top 10–15 key phrases in admin or NLP Insights page.  
- **In report:** “Keyphrase extraction for feedback summarization”.

**4. Resource recommendation from chat (optional)**

- When a user writes in group/DM chat, embed the message (e.g. SentenceTransformer), find **nearest learning resources** by embedding (or by keyword match), and suggest “You might find this resource helpful”.  
- **In report:** “Retrieval-based resource suggestion in chat”.

**Where:**  
- Backend: `backend/nlp_utils.py` – coherence, keyphrases (YAKE/KeyBERT).  
- New endpoint e.g. `GET /api/feedback/summary` (keyphrases + sentiment trend).  
- Frontend: NLP Insights or Admin – sentiment trend + keyphrases section.

**Deliverable:** “NLP pipeline” section with coherence, sentiment trend, and keyphrases; screenshots of the UI.

---

### B4. Clustering – extend existing notebook (Medium impact)

**Why it stands out:** You already have KMeans + PCA; making it **interpretable** and **actionable** strengthens the story.

**Improvements:**

1. **Optimal K**  
   - Use **elbow method** (inertia) and **silhouette score** vs K (e.g. K=2..10).  
   - Report chosen K and why.

2. **Cluster profiles**  
   - For each cluster: average values and top interests/skills (e.g. “Cluster 2: high ML interest, morning study”).  
   - Name clusters (e.g. “ML-focused”, “Broad interest”, “Evening learners”).

3. **Use clusters in the app**  
   - When a user signs up, assign them to a cluster (e.g. by nearest centroid or by running the same pipeline on their profile).  
   - **Recommendation:** Boost users in the **same cluster** in the recommendation list (e.g. `final_score = 0.7 * similarity + 0.3 * same_cluster_bonus`).  
   - **In report:** “User segments” and “Integration of clustering into recommendations”.

**Where:**  
- `notebooks/us_students_ml_pipeline.ipynb` (or a new `04_clustering_segments.ipynb`).  
- Backend: optional endpoint that returns cluster id for a user (or store cluster in user profile after batch run).

**Deliverable:** Cluster profile table + silhouette plot + “How we use clusters” in report.

---

### B5. Evaluation and offline metrics (High impact)

**Why it stands out:** Shows you care about **measuring** your algorithms, not just building them.

**Recommendation evaluation**

- **If you have implicit feedback:** e.g. “clicked on partner”, “sent message” → define “relevant = contacted”. Then compute **Precision@K**, **Recall@K**, **NDCG@K** for your engine (and for a random baseline).  
- **If you don’t:** Use **synthetic relevance**: top 20% by current score = relevant; compare Jaccard vs hybrid (e.g. which ranks “relevant” higher on average).  
- **In report:** “Recommendation evaluation” with a small table (e.g. P@5, R@5 for baseline vs your method).

**A/B or ablation**

- **Ablation:** Recommendation with all factors vs “only CS interests” vs “only skills”. Report average match score and diversity (e.g. number of unique interests in top 10).  
- **In report:** “Ablation study” paragraph + one table.

**Where:**  
- `notebooks/05_recommendation_evaluation.ipynb` (and optionally a small “evaluation” section in backend if you log clicks later).

**Deliverable:** “Evaluation” subsection in report + one table of metrics.

---

## Part C: Phased 2-semester roadmap

### Semester 1 (Foundation + first impact)

| Priority | Item | Outcome |
|--------|------|--------|
| 1 | EDA notebook + data dictionary + feature engineering | Solid “Data” chapter and reproducibility |
| 2 | Recommendation: hybrid (Jaccard + cosine/TF–IDF) + explainability (“Why this partner?”) | Strong algorithm section + UI differentiator |
| 3 | BERTopic: add coherence evaluation + sentiment trend (backend + dashboard) | Strong NLP section |
| 4 | Match prediction or quiz performance prediction (one notebook) | One clear “Predictive model” with metrics |
| 5 | Clustering: optimal K, cluster profiles, optional “same cluster” boost in recommendations | Clear “User segments” and link to product |

**Report focus (Semester 1):** Data, Recommendation algorithm (with explainability), NLP (topics + sentiment), One predictive model, Clustering and segments.

### Semester 2 (Depth + polish)

| Priority | Item | Outcome |
|--------|------|--------|
| 1 | Study group formation: graph-based (Louvain) or constrained clustering | “Advanced algorithm” section |
| 2 | “What to study next” recommender + “Session quality” (productive vs idle) | Two more algorithm angles |
| 3 | Keyphrase extraction (YAKE/KeyBERT) for feedback summary | NLP completeness |
| 4 | Recommendation evaluation (P@K, R@K or synthetic) + ablation | Evaluation chapter |
| 5 | Optional: resource suggestion in chat (embeddings); optional forecast (study hours) | Extra data science points |
| 6 | Polish: dashboards, admin analytics, thesis writing | Submission-ready |

**Report focus (Semester 2):** Study group algorithm, Evaluation, Remaining models/features, Limitations and future work.

---

## Part D: Quick wins (low effort, high impression)

1. **Explainability in UI** – “Why this partner?” breakdown (from A1).  
2. **Sentiment trend chart** – aggregate existing sentiment by week (B3).  
3. **Cluster labels in notebook** – name clusters and add one “cluster profile” table (B4).  
4. **One evaluation table** – e.g. P@5 for Jaccard vs hybrid (B5).  
5. **Data dictionary** – one markdown/Excel file listing all columns and meanings (B1).

---

## Part E: Thesis / report structure suggestion

1. **Introduction** – problem, objectives, scope.  
2. **Related work** – recommender systems, learning analytics, NLP in education.  
3. **Data** – sources, EDA, cleaning, feature engineering (B1).  
4. **System design** – architecture, APIs, frontend/backend.  
5. **Algorithms**  
   - Recommendation (Jaccard, hybrid, explainability, diversity) (A1).  
   - Study group formation (current + graph/clustering) (A2).  
   - Session quality / next-best-action (A3, A4).  
6. **Data science and ML**  
   - Clustering and user segments (B4).  
   - Predictive models (match / quiz performance) (B2).  
   - NLP: BERTopic, coherence, sentiment, keyphrases (B3).  
7. **Evaluation** – recommendation metrics, ablation, model metrics (B5).  
8. **Implementation** – tech stack, deployment notes.  
9. **Limitations and future work.**  
10. **Conclusion.**

---

## Summary table – impact vs effort

| Improvement | Algorithm/DS | Impact | Effort |
|-------------|--------------|--------|--------|
| Hybrid recommendation + explainability | Algorithm | High | Medium |
| Study groups: graph / constrained clustering | Algorithm | High | Medium–High |
| EDA + feature engineering + data dictionary | Data science | High | Medium |
| Match or quiz performance prediction | Data science | High | Medium |
| Topic coherence + sentiment trend + keyphrases | Data science / NLP | High | Medium |
| Clustering profiles + use in recommendations | Data science | Medium | Low–Medium |
| Recommendation evaluation (P@K, ablation) | Data science | High | Low–Medium |
| Session quality / productive time | Algorithm | Medium | Low–Medium |
| “What to study next” | Algorithm | Medium | Low |
| Resource suggestion in chat | NLP | Medium | Medium |

Implementing **A1 (recommendation + explainability)**, **B1 (EDA + features)**, **B2 (one predictive model)**, **B3 (NLP evaluation + sentiment + keyphrases)**, and **B5 (evaluation)** will already make the project stand out. Adding **A2 (study group algorithm)** and **B4 (clustering integration)** gives a very strong, balanced story across algorithms and data science for a 2-semester final year project.
