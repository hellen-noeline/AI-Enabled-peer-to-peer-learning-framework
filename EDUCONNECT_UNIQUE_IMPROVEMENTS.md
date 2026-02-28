# EduConnect – Bigger, Unique Improvements (All Aspects)

**Goal:** Transform EduConnect into a **distinctive, research-grade** platform that stands out in every dimension: algorithms, data science, NLP, product experience, and system design. Each area gets **major** upgrades, not tweaks.

---

## Vision: What Makes EduConnect Unique

- **First peer-learning platform** that combines **behavior-aware matching** (who you actually study with + how you learn) with **explainable recommendations** and **AI study coaching**.
- **Learning analytics** that go beyond hours: **knowledge gaps**, **at-risk prediction**, **personalized study paths**, and **peer effect estimation**.
- **NLP-powered** feedback loop: **chatbot tutor**, **auto-generated quizzes** from resources, **dialogue-based matching**, and **feedback-to-product** pipeline.
- **Product:** **Virtual study rooms**, **live session presence**, **gamification with ML-driven challenges**, and **streak/engagement forecasting**.

---

# Part 1: ALGORITHMS (Major Overhauls)

## 1.1 Behavior-Aware Collaborative Filtering (Unique Differentiator)

**Current:** Pure content-based (profile similarity). No use of “who did what.”

**Big improvement:** Use **implicit feedback** to improve recommendations over time.

- **Signals:** Profile views, “Connect” clicks, messages sent, study sessions started together, same group joined, quiz help requested.
- **Model:**  
  - **Option A:** **Matrix factorization** (e.g. SVD/ALS): users × partners, values = interaction strength (e.g. 1 if messaged, 0.5 if viewed). Train offline; serve top-N by predicted score.  
  - **Option B:** **Two-tower** or **item-based CF:** “Users who connected with X also connected with Y.”  
- **Hybrid:** `final_score = α * content_similarity + (1−α) * collaborative_score`. Cold start: α=1; as interactions grow, α decreases (e.g. from user activity tier).
- **Where:** Backend Python service (e.g. `ml_service/recommendation.py`) with periodic retraining; API `POST /api/recommendations/personalized` returns ranked list + source (content vs collaborative vs hybrid).
- **Report:** “Collaborative filtering for study partner recommendation”; cold start vs warm user; offline metrics (precision@k, NDCG).

**Makes you unique:** Almost no student project uses **behavior** to refine peer matching; you do.

---

## 1.2 Multi-Objective & Constrained Matching (Research-Grade)

**Current:** Single scalar “match score.”

**Big improvement:** Treat matching as **multi-objective optimization** with **constraints**.

- **Objectives (to maximize):**  
  - Compatibility (your current similarity).  
  - **Complementarity:** e.g. one strong in ML, one in security (so they can teach each other).  
  - **Diversity:** different universities/backgrounds (optional).  
  - **Availability overlap:** same preferred study hours.
- **Constraints:**  
  - Minimum compatibility (e.g. > 0.3).  
  - Max group size (e.g. ≤ 6).  
  - Balance: no user in too many groups.
- **Formulation:**  
  - **Pareto ranking:** Compute 2–3 objective scores per pair; rank by non-dominated fronts (or weighted sum with tuned weights).  
  - **Constraint satisfaction:** Filter candidates by constraints first; then rank by combined objective.
- **UI:** “Match breakdown”: Compatibility 85%, Complementarity 70%, Availability 100%. Let user slide “Prefer similar” vs “Prefer complementary.”
- **Where:** Backend `ml_service/matching.py`; frontend sends preferences (e.g. `preferComplementary: true`); API returns ranked list + objective breakdown.
- **Report:** “Multi-objective study partner matching”; small experiment (user satisfaction or synthetic metric) comparing single-objective vs multi-objective.

**Makes you unique:** Matching is framed as **optimization**, not just similarity.

---

## 1.3 Study Group Formation: Graph + Constraints + Fairness

**Current:** One group per interest; 30% threshold.

**Big improvement:** **Stable, balanced, diverse** groups via graph and fairness.

- **Graph model:**  
  - Nodes = users.  
  - Edge weight = similarity (or multi-objective score).  
  - Optional: **bipartite** “users × interests” and project to user–user.
- **Algorithms:**  
  - **Community detection:** Louvain or Leiden; then split communities > max_size into smaller groups (e.g. by subgraph clustering).  
  - **Constrained clustering:** K-means or K-medoids with **size constraints** (min/max per cluster); use **sklearn** or custom (e.g. repeated runs + swap).  
  - **Fairness:** Balance **group diversity** (e.g. no group all same university); maximize **minimum** within-group similarity so no one is “left behind.”
- **Output:** Groups with metadata: avg similarity, diversity index, “suggested focus” (common interest).
- **Where:** Backend `ml_service/group_formation.py`; endpoint `POST /api/groups/form` (body: user list or “current user + dataset”); returns list of groups with stats.
- **Report:** “Fair and constrained study group formation”; comparison with baseline (current method); graph visualizations.

**Makes you unique:** Groups are **optimized**, not just filtered.

---

## 1.4 Adaptive “What to Study Next” (Bandit / RL Flavor)

**Current:** Static “next quiz” or none.

**Big improvement:** **Contextual bandit** or **reinforcement learning** style “next best action.”

- **State:** User profile (weak topics, goals), recent activity (last 3 resources/quizzes), time available, day of week.  
- **Actions:** Recommend one of: “Take quiz X,” “Read resource Y,” “Join group Z,” “Review topic W.”  
- **Reward (proxy):** Quiz pass, time-on-resource, or “completed recommended action” (click-through).  
- **Model:**  
  - **Simple:** Contextual bandit (e.g. LinUCB or Thompson sampling with linear model): features = state, arms = actions; learn from logged feedback.  
  - **Richer:** Small DQN or policy gradient (optional, if you have enough data).  
- **Fallback:** Rule-based (weak topic + not completed) when no data.  
- **Where:** Backend `ml_service/next_best_action.py`; API `GET /api/me/next-action?time_minutes=30`; Dashboard shows “Suggested now: …”.  
- **Report:** “Adaptive study recommendation”; exploration vs exploitation; comparison with random/rule-based.

**Makes you unique:** **Reinforcement learning / bandits** in an educational product.

---

## 1.5 Session Quality & Engagement Scoring (Behavioral ML)

**Current:** Timer only; no “quality” notion.

**Big improvement:** **Engagement score** per session (and over time).

- **Features:** Duration, pauses, time-of-day, day-of-week, subject (if tagged), device (optional), before/after quiz (if any).  
- **Label:** “High quality” = e.g. session >15 min and (passed quiz soon after OR user marked “productive”); else “low” (or ordinal).  
- **Model:** Classifier (e.g. Random Forest or XGBoost) or regressor (engagement score 0–1).  
- **Use:**  
  - Show “Productive minutes” vs “Total minutes” in analytics.  
  - Feed into “at-risk” and “next best action” (low engagement → suggest different format).  
- **Where:** Backend trains on exported session logs; API returns `productive_minutes` for a session or aggregate; frontend charts both.  
- **Report:** “Engagement prediction from study session behavior”; feature importance.

**Makes you unique:** You **infer** quality from behavior, not just time.

---

# Part 2: DATA SCIENCE (Deep & Unique)

## 2.1 Knowledge Gap & Learning Curve Modeling

**Big improvement:** Explicit **knowledge state** and **learning curves** per topic.

- **Knowledge state:** Per user, per topic (e.g. ML, Security): latent “mastery” or level (e.g. 0–1) inferred from quiz history, attempts, and time.  
  - **Simple:** Running average of quiz scores per topic, decay for inactivity.  
  - **Richer:** **IRT (Item Response Theory)** or **BKT (Bayesian Knowledge Tracing)** lite: estimate ability and item difficulty; update after each attempt.  
- **Learning curve:** For each topic, model “score vs time” or “score vs attempts” (e.g. exponential or power law). Predict “time to reach 80%” for a topic.  
- **Use:**  
  - Dashboard: “Your knowledge map” (radar or bar per topic).  
  - “What to study next”: prioritize topics with **largest gap** (goal level − current level).  
  - Admin: cohort learning curves (average by topic).  
- **Where:** Backend `ml_service/knowledge_state.py`; DB stores `user_topic_mastery`; API for dashboard and recommendations.  
- **Report:** “Knowledge tracing and learning curve modeling in EduConnect.”

**Makes you unique:** **Knowledge state** is first-class, not just “hours + quiz score.”

---

## 2.2 At-Risk & Dropout Prediction (High Impact)

**Big improvement:** Predict **at-risk** (e.g. will disengage or fail next quiz) and **actionable insights**.

- **Target:** Binary or multi-class: “at-risk” / “on-track” / “excelling” (e.g. from next-week activity or next quiz result).  
- **Features:** Study hours (total, last 7 days, trend), quiz attempts and pass rate, session count, days since last login, streak, profile (year, course load), engagement score.  
- **Model:** Random Forest or XGBoost; class imbalance handled (e.g. SMOTE or class weight).  
- **Output:** Risk score (0–1) + top reasons (“Low study hours last week,” “No quiz attempts in ML”).  
- **Use:**  
  - Dashboard: “You might be at risk in ML – try a short quiz.”  
  - Admin: “At-risk students” list; optional email/nudge.  
- **Where:** Backend `ml_service/at_risk.py`; retrain weekly; API `GET /api/me/risk` and `GET /api/admin/at-risk-users`.  
- **Report:** “Early prediction of at-risk learners”; precision/recall, feature importance, ethical note (no high-stakes use without consent).

**Makes you unique:** **Predictive intervention**, not just dashboards.

---

## 2.3 Peer Effect Estimation (Research Angle)

**Big improvement:** **Estimate** whether studying with a matched partner **improves outcomes** (causal flavor).

- **Question:** “Do users who connect with a study partner have better quiz performance / engagement than similar users who don’t?”  
- **Method:**  
  - **Quasi-experiment:** Compare “connected” vs “not connected” users with similar covariates (propensity score matching or regression adjustment).  
  - **Outcome:** e.g. quiz pass rate next 2 weeks, or study hours.  
- **Data:** Need “connected” flag (e.g. sent message or joined same session) and outcome over time.  
- **Report:** “Estimating peer effects in a study partner platform”; limitations (selection bias, small N).  
- **Optional in product:** “Students who found a partner improved by X% on average” (if result is positive and robust).

**Makes you unique:** **Causal-style analysis** in a capstone project.

---

## 2.4 Cohort & Institutional Analytics (Admin Power)

**Big improvement:** **Cohort** and **institutional** views for admins (e.g. “CS 2024”, “Campus A”).

- **Cohorts:** Define by signup month, course, or self-reported “cohort” in profile.  
- **Metrics per cohort:** Active users, avg study hours, quiz pass rate, topic mastery distribution, at-risk %, retention (e.g. still active after 4 weeks).  
- **Institutional:** If you have “university” or “institution,” same metrics by institution; compare institutions (anonymized).  
- **Visualizations:** Cohort retention curves, funnel (signup → first quiz → first partner), heatmaps (topic × cohort).  
- **Where:** Backend analytics pipeline; Admin dashboard “Cohorts” and “Institutions” tabs; optional export CSV.  
- **Report:** “Learning analytics at cohort and institution level.”

**Makes you unique:** Admin analytics that **institutions** could actually use.

---

## 2.5 A/B Testing & Experimentation Framework

**Big improvement:** **Run experiments** (e.g. recommendation algorithm A vs B) and measure impact.

- **Design:** Users randomly assigned to variant (e.g. 50% “Jaccard only,” 50% “Hybrid”); log variant in DB.  
- **Metrics:** Primary (e.g. “connection rate,” “messages sent”); secondary (session length, quiz attempts).  
- **Analysis:** Proportion or mean per variant; simple **significance test** (e.g. two-proportion z-test or t-test); confidence intervals.  
- **UI:** Admin “Experiments” page: create experiment (name, variants, % split), view results (table + “Winner” or “Inconclusive”).  
- **Where:** Backend: experiment assignment at login; logging of events with `experiment_id` and `variant`; analysis script or endpoint.  
- **Report:** “A/B testing framework for EduConnect”; one example experiment (e.g. hybrid vs Jaccard).

**Makes you unique:** **Evidence-based** product decisions, not just features.

---

# Part 3: NLP (Full Pipeline)

## 3.1 Conversational AI: Study Coach Chatbot

**Big improvement:** **Chatbot** that answers study-related questions and suggests resources/partners.

- **Capabilities:**  
  - “What should I study today?” → Use next-best-action + knowledge state.  
  - “Explain [topic]” → Short definition + link to resource (from your catalog).  
  - “Find me a partner for ML” → Query recommendations filtered by interest.  
  - “Why did you recommend X?” → Explainability from recommendation engine.  
- **Tech:**  
  - **Retrieval-based:** Intent classification (e.g. small classifier or keyword rules) + retrieval from FAQs, resource descriptions, or embedded chunks (SentenceTransformer + similarity).  
  - **Generative (optional):** Small LLM (e.g. fine-tuned or prompt-based) for open-ended answers; guardrails to stay on-topic.  
- **Where:** Backend `nlp_service/chatbot.py`; WebSocket or REST `POST /api/chat`; frontend “Study Coach” widget (sidebar or modal).  
- **Report:** “Conversational AI for study guidance”; architecture; evaluation (e.g. intent accuracy, user satisfaction survey).

**Makes you unique:** **AI coach** in the product, not just static resources.

---

## 3.2 Auto-Generated Quizzes from Resources (NLP + Assessment)

**Big improvement:** **Generate quiz questions** from learning resource text (e.g. summaries or descriptions).

- **Pipeline:**  
  - Input: Resource text (or URL → scrape/summarize).  
  - **Summarization** (e.g. extractive or abstractive) → key sentences.  
  - **Question generation:** Template-based or NLG (e.g. T5/LLM): “What is X?” “Which of the following…?”  
  - **Multiple choice:** Generate 1 correct + 3 distractors (e.g. from same doc or similar terms).  
- **Quality:** Filter by length, redundancy; optional human-in-the-loop for high-stakes quizzes.  
- **Use:** “Quiz from this resource” button; or “Practice from your last resource.”  
- **Where:** Backend `nlp_service/quiz_generation.py`; endpoint `POST /api/resources/:id/generate-quiz`; store generated quiz in DB; frontend Quiz page can load it.  
- **Report:** “Automatic quiz generation from learning resources”; pipeline; sample evaluation (e.g. clarity, correctness).

**Makes you unique:** **NLP for assessment creation**, not just consumption.

---

## 3.3 Dialogue-Based Matching (Match via Conversation)

**Big improvement:** **Refine recommendations** from a short **conversation** (“What are you looking for?”).

- **Flow:** User answers 2–3 questions: e.g. “Prefer same level or complementary?” “Focus this week: exam prep or project?” “Preferred group size?”  
- **NLP:** Extract intent and entities (e.g. “exam prep”, “ML”) from free text; update **temporary preference** vector.  
- **Matching:** Re-rank or filter candidates using this preference (e.g. boost “exam prep” or “complementary”).  
- **Where:** Frontend short wizard; backend `POST /api/recommendations/dialogue` with answers; returns refined list.  
- **Report:** “Dialogue-based preference elicitation for study partner recommendation.”

**Makes you unique:** Matching **driven by conversation**, not only profile.

---

## 3.4 Feedback-to-Product Pipeline (NLP in the Loop)

**Big improvement:** **Automate** feedback handling: categorize, route, summarize, and surface to product.

- **Categorization:** Multi-label (e.g. “Bug,” “Feature,” “Content,” “UX”) via classifier trained on historical feedback or zero-shot LLM.  
- **Sentiment + urgency:** Sentiment (existing) + “urgent” if keywords (“broken,” “cannot login”).  
- **Summarization:** Per category or per week: short summary (e.g. extractive or abstractive).  
- **Keyphrases:** YAKE/KeyBERT (as in previous plan) for “what users ask for.”  
- **Admin:** “Feedback digest” (weekly): categories, sentiment trend, top keyphrases, suggested actions (e.g. “3 requests for dark mode”).  
- **Where:** Backend `nlp_service/feedback_pipeline.py`; runs on new feedback (or batch); stores category, summary; Admin “Feedback digest” page.  
- **Report:** “Closing the loop: from user feedback to product insights with NLP.”

**Makes you unique:** **Feedback** directly drives product narrative.

---

## 3.5 Topic Coherence & Evolving Topic Model

**Big improvement:** **Evaluate** and **evolve** BERTopic; show “topic evolution” over time.

- **Coherence:** Compute C_v or NPMI for BERTopic topics; compare hyperparameters (min_topic_size, nr_topics); report in notebook and Admin.  
- **Temporal:** If feedback/chat have timestamps, run BERTopic per month (or rolling window); track topic drift and new topics (e.g. “Exam stress” in November).  
- **UI:** “Topic trends”: timeline of top topics; “New this month” topics.  
- **Where:** Backend `nlp_service/topics.py`; coherence in training pipeline; optional `GET /api/topics/evolution`.  
- **Report:** “Topic modeling and evolution in user-generated feedback.”

**Makes you unique:** **Evaluated** and **temporal** topic models.

---

# Part 4: PRODUCT & UX (Distinctive Experience)

## 4.1 Virtual Study Rooms (Presence & Co-study)

**Big improvement:** **Live study rooms** where users see who’s “here” and can start a focused session together.

- **Concept:** “Join room: ML revision” or “Room: Morning focus.”  
- **Presence:** Who’s in the room (avatar, name); “Studying” vs “Break” status (optional).  
- **Sync (optional):** Shared timer (e.g. Pomodoro); “Start 25 min” for everyone.  
- **Tech:** WebSockets or Socket.io for presence; optional WebRTC for video/audio (simplest: presence only first).  
- **Where:** New backend `realtime/` (Node or Python with Socket.io); frontend “Study Rooms” page + room detail; DB: rooms, membership, sessions.  
- **Report:** “Real-time collaboration and presence in virtual study rooms.”

**Makes you unique:** **Togetherness** without requiring video from day one.

---

## 4.2 Gamification with ML-Driven Challenges

**Big improvement:** **Challenges** that are **personalized** (from knowledge state and goals), not generic.

- **Challenge types:** “Pass 2 ML quizzes this week,” “Study 5 hours with a partner,” “Complete one resource in your weak topic.”  
- **Generation:** From knowledge gaps, at-risk signal, and “what to study next”; one challenge per week (or user-picked).  
- **Rewards:** Points, badges, streak; leaderboard (optional: by cohort or friends).  
- **Where:** Backend “challenges” logic; Dashboard “This week’s challenge” card; DB: challenges, completions, points.  
- **Report:** “Personalized gamification using learning analytics.”

**Makes you unique:** **ML-generated** challenges, not static badges.

---

## 4.3 Streak & Engagement Forecasting (User-Facing)

**Big improvement:** **Predict** and show “You’re on track for a 5-day streak” or “At current pace, you’ll hit your goal.”

- **Streak prediction:** Simple model (e.g. probability of returning tomorrow from recent pattern); show “Likely streak: 3–5 days” if they continue.  
- **Goal forecast:** “At 2 h/day you’ll reach 20 h by Friday”; or “To pass ML final, study 30 min/day in ML.”  
- **Where:** Backend lightweight model or rules; Dashboard “Forecast” or “On track” widget.  
- **Report:** “User-facing engagement and goal forecasting.”

**Makes you unique:** **Forward-looking** UX, not only past stats.

---

## 4.4 Smart Notifications (When & What)

**Big improvement:** **Recommend** when to study and what to do (without being spammy).

- **When:** Model “best time to nudge” (e.g. when user usually studies, or when at-risk); respect “do not disturb” and frequency cap.  
- **What:** “Your study buddy X is online,” “New resource in ML,” “You’re 2 hours from your weekly goal,” “At-risk in Security – try a quiz.”  
- **Channels:** In-app first; optional email/push later.  
- **Where:** Backend job (cron or queue) that computes “who to notify and with what”; frontend notification center.  
- **Report:** “Smart notification policy using engagement and risk signals.”

**Makes you unique:** **Context-aware** nudges.

---

# Part 5: SYSTEM & ARCHITECTURE

## 5.1 ML Service Layer (Scalable & Clear)

**Big improvement:** Dedicated **ML service** (Python) for all heavy algorithms.

- **Components:**  
  - Recommendation (CF, hybrid, explainability).  
  - Group formation.  
  - Next-best-action, knowledge state, at-risk.  
  - NLP: BERTopic, chatbot, quiz generation, feedback pipeline.  
- **API:** REST (or gRPC); one service or split (e.g. `ml-api` + `nlp-api`).  
- **Data:** Reads from main DB (or replica); writes recommendations/caches; optional model registry (e.g. save/load sklearn models).  
- **Scheduling:** Retrain jobs (e.g. CF weekly, at-risk weekly); topic model on new feedback.  
- **Report:** “ML service architecture and training pipeline.”

**Makes you unique:** **Production-style** ML separation.

---

## 5.2 Real-Time Layer (Presence & Chat)

**Big improvement:** **Unified real-time** layer for presence, chat, and live rooms.

- **Stack:** Socket.io (or WebSockets) on Node; rooms = study groups or “lobby.”  
- **Events:** Join/leave, typing, message, “start session,” “pause.”  
- **Persistence:** Chat and presence events stored in DB for history and analytics.  
- **Report:** “Real-time architecture for collaboration.”

---

## 5.3 Data Pipeline & Feature Store (Lightweight)

**Big improvement:** **Batch pipeline** for analytics and ML features.

- **Steps:** Export from app DB → clean → aggregate (e.g. user-week features) → write to analytics DB or CSV for notebooks.  
- **Feature store (simple):** Table or files with user_id, date, and computed features (study_hours_7d, quiz_pass_rate, etc.) for at-risk and next-best-action.  
- **Where:** Scripts in `pipeline/` or `jobs/`; run daily/weekly.  
- **Report:** “Data pipeline and feature store for learning analytics.”

---

# Part 6: ROADMAP (2 Semesters – Big Improvements)

### Semester 1 (Foundation + First “Wow” Features)

| # | Area | Big improvement | Deliverable |
|---|------|------------------|-------------|
| 1 | Data | Single dataset + EDA + feature engineering + data dictionary | EDA notebook, “Data” chapter |
| 2 | Algorithms | Hybrid recommendation (content + CF or cosine) + **full explainability** (“Why this partner?”) | New engine + UI breakdown |
| 3 | Algorithms | Study groups: **graph (Louvain)** or **constrained clustering** | Backend API + report section |
| 4 | Data science | **Knowledge state** (simple: per-topic mastery from quizzes) + “Knowledge map” in dashboard | Backend + Dashboard widget |
| 5 | Data science | **At-risk** model (one outcome, e.g. “next quiz pass”) + Admin list + Dashboard nudge | Model + API + UI |
| 6 | NLP | BERTopic **coherence** + **sentiment trend** + **keyphrases** (feedback digest) | Backend + Admin/NLP page |
| 7 | Product | **Study Coach chatbot** (retrieval-based: next action, explain, find partner) | Backend + “Coach” UI |

### Semester 2 (Depth + Differentiation)

| # | Area | Big improvement | Deliverable |
|---|------|------------------|-------------|
| 1 | Algorithms | **Collaborative filtering** (matrix factorization or two-tower) + hybrid with content | CF pipeline + A/B idea |
| 2 | Algorithms | **Multi-objective matching** (compatibility + complementarity + availability) + UI sliders | Matching API + Recommendations UI |
| 3 | Algorithms | **Next-best-action** (contextual bandit or rules) + “Suggested now” on Dashboard | Backend + Dashboard |
| 4 | Data science | **Learning curves** + “Time to 80%” per topic; **peer effect** estimation (simple) | Notebook + report |
| 5 | Data science | **Cohort/Institution analytics** + **A/B framework** (one experiment) | Admin “Cohorts” + Experiments |
| 6 | NLP | **Auto-generated quiz** from one resource (template or NLG) + “Quiz from this resource” | Pipeline + UI |
| 7 | NLP | **Feedback-to-product**: auto-categorize + digest + topic evolution | Feedback pipeline + Admin digest |
| 8 | Product | **Virtual study rooms** (presence + optional shared timer) | Realtime backend + Rooms page |
| 9 | Product | **Personalized challenges** (from knowledge state / at-risk) + streak forecast | Challenges + “On track” widget |
| 10 | System | **ML service** design + **data pipeline** (export → features) | Doc + scripts |

---

# Summary: What Makes EduConnect Unique After This

| Dimension | Unique elements |
|-----------|------------------|
| **Algorithms** | Behavior-aware CF, multi-objective matching, graph/constrained groups, contextual bandit for “what’s next,” engagement scoring |
| **Data science** | Knowledge state & learning curves, at-risk prediction, peer effect estimation, cohort analytics, A/B testing |
| **NLP** | Study Coach chatbot, auto-generated quizzes, dialogue-based matching, feedback-to-product pipeline, topic evolution |
| **Product** | Virtual study rooms, ML-driven challenges, streak/engagement forecasting, smart notifications |
| **System** | Dedicated ML service, real-time layer, data pipeline & feature store |

This plan turns EduConnect into a **platform** that demonstrates strength in **algorithms**, **data science**, **NLP**, and **product thinking**, with a clear path over two semesters and a thesis story that is easy to defend and impressive to examiners.
