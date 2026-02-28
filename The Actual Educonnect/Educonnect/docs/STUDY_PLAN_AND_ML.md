# Study Schedule & Improvement Suggestions — Design

## Is it possible?

Yes. EduConnect can support a **model** that:

1. **Learns from all users’ info and stats** — profile (course area, ordered interests, weak/strong topics), quiz scores, study hours, and (optionally) fine-grained activity.
2. **Generates a study schedule** — e.g. “This week: focus Law 2h, Data Science 1h” based on weak topics, goals, and preferred hours.
3. **Generates improvement suggestions** — e.g. “Your Law final score is 65%; review Legal Writing resources” or “You haven’t taken the ML final yet.”
4. **Keeps learning and adjusting** — as more quiz attempts, resource views, and study sessions are recorded, the system can refine suggestions (e.g. cohort averages, time-on-topic, next-best-topic).

## Data we already have

| Source | Data |
|--------|------|
| **users** | course_area, ordered_interests, weak_topics, strong_topics, preferred_study_hours, preferred_learning_style |
| **study_stats** (JSON on user) | fieldProgress (quiz scores, final score, proficiency per field), weeklyHours, totalHours, sessionsCompleted, quizCompletions |

This is enough for a **rule-based** schedule and suggestions. For **ongoing learning**, we add optional event logging.

## Best way to add it

### Phase 1 (current): Rule-based engine + API

- **Engine** (`server/studyPlanEngine.js`): Pure logic. Input: user profile + `study_stats`. Output: `{ schedule, suggestions }`.
  - **Schedule**: Distribute recommended hours across the week (from `preferred_study_hours`), prioritizing weak topics and fields with no/low final score.
  - **Suggestions**: e.g. “Improve in X (quiz 65%)”, “Take final for Y”, “You’re on track in Z.”
- **API**: `GET /api/users/:userId/study-plan` returns the plan. Frontend calls it with the logged-in user’s id.
- **Frontend**: Dashboard section or “Study Plan” page that shows this week’s schedule and improvement suggestions.

No ML yet; the “model” is deterministic rules. This ships quickly and is easy to explain.

### Phase 2: Activity events + cohort insights (implemented)

- **Table** `activity_events`: `user_id`, `event_type` (e.g. `quiz_completed`, `resource_viewed`, `session_logged`), `payload` (JSON), `created_at`.
- **Recording**: `POST /api/activity`; frontend calls it when the user completes a quiz (and can be extended for resource_viewed, session_logged).
- **Cohort insights**: `server/cohortInsights.js` aggregates users’ `study_stats` and `activity_events` by `course_area` (and globally). Computed on each study-plan request via `buildCohortInsights(db)`.
- **Wired into engine**: `generateStudyPlan(user, cohortInsights)` uses cohort data to add suggestions such as “Students in your field often study most on Monday” and “Peers in Law average Xh total study.” The study-plan API builds insights and passes them into the engine so plans stay personalised as more data is collected.

### Phase 3 (optional): Lightweight ML

- **Input**: Same as above + activity_events (and optionally cohort aggregates).
- **Output**: Same shape — schedule + suggestions.
- **Where**: A **Python script** run periodically (cron or on-demand) that:
  - Reads from SQLite (and any exported activity).
  - Trains a simple model (e.g. next-topic recommender, or time-allocation) or uses collaborative filtering (“users like you”).
  - Writes results to `user_insights` or a JSON file; the API serves from there.
- **Alternative**: A small **ML microservice** (e.g. FastAPI) that the Node server calls for “get plan for user.” Same idea, more infra.

## Summary

| Phase | What | Keeps learning? |
|-------|------|------------------|
| 1 | Rule-based engine + API + Dashboard UI | No — same rules each time (but input data changes as user studies). |
| 2 | activity_events + batch aggregation → insights | Yes — more data over time improves cohort stats and future rules. |
| 3 | ML model (script or service) using events + insights | Yes — model retrained periodically; suggestions adapt. |

**Recommendation:** Implement **Phase 1** first (engine + API + UI), then add **Phase 2** (activity table + recording + optional batch script) so the system “keeps learning” from usage. Phase 3 can follow when you need stronger personalization.
