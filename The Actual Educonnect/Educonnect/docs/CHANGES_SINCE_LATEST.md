# Changes since latest session (recent updates)

This document lists **all changes made in the latest development session** (AI-generated quizzes from resources, no-admin flow, chat and quiz improvements). For older changes (cohort insights, ML study plan), see [RECENT_CHANGES.md](./RECENT_CHANGES.md).

---

## 1. AI-generated quizzes from learning resources (no manual, no admin)

### What changed

- Quizzes can be **generated automatically from the learning resources (sites) that users access**.
- No manual question entry and **no admin step**: when a user opens the Quiz hub for a topic that has no quizzes yet, the app generates them from the resource titles and descriptions.
- “Take quiz” stays in the same place; only the **source** of quiz content is now AI + your resource data.

### Backend

- **New endpoint:** `POST /api/quiz/generate-from-resources`  
  - Body: `{ fieldId, fieldName? }`  
  - Finds all learning resources with `category === fieldId` in `server/data/learningResources.js`.  
  - Builds content from each resource’s **title** and **description**.  
  - Calls OpenAI to generate:
    - 1 quiz (5 questions) from that content  
    - 1 final assessment (10 questions) from that content  
  - Saves the field to `server/data/generatedQuizzes.json` (creates or overwrites).  
  - No admin or form required; any client can call it (e.g. when opening the quiz hub).

- **File:** `server/routes/quiz.js`  
  - Imports `learningResources` from `../data/learningResources.js`.  
  - Implements `generate-from-resources`: filter resources by `fieldId`, build content text, call OpenAI (quiz + final), normalize questions, save field, return it.

### Frontend

- **`src/api/quizApi.js`**  
  - New: **`generateFromResources({ fieldId, fieldName })`** – calls `POST /api/quiz/generate-from-resources`.

- **`src/pages/QuizHub.jsx`**  
  - If the **field does not exist** (e.g. first visit to `/quiz/agriculture`):  
    - Shows “Preparing your quiz…”  
    - Calls `generateFromResources` for that `fieldId`.  
    - On success, refreshes learning fields and shows the new quiz hub.  
  - If the **field exists but has no quizzes**:  
    - Same flow: generate from resources, then show the hub.  
  - Copy shown: “Generating quiz from your learning resources (courses/sites)…” and “No admin needed — quizzes are created from the learning resources you use.”  
  - On failure: “Try again” and “Back to Resources.”

### Files touched

- **Added/updated:** `server/routes/quiz.js` (generate-from-resources logic, use of `learningResources`).
- **Updated:** `src/api/quizApi.js` (export `generateFromResources`).
- **Updated:** `src/pages/QuizHub.jsx` (auto-generate when no field or no quizzes, generating state, retry on error).

---

## 2. Learning fields: static + AI-generated (LearningFieldsContext)

### What changed

- The app now uses a **single merged list** of learning fields: static (from `quizData.js`) plus AI-generated (from `GET /api/quiz/fields`).
- Quiz hub, resources, dashboard, and analytics all use this merged list so AI-generated quizzes appear everywhere without editing `quizData.js`.

### Implementation

- **`src/contexts/LearningFieldsContext.jsx`**  
  - Fetches generated fields via `getGeneratedFields()` from `quizApi.js` on mount.  
  - Merges with static `learningFields` and `categoryToField` from `src/data/quizData.js`.  
  - Exposes: `learningFields`, `resourceToField`, `categoryToField`, `loading`, `refreshGenerated()`.

- **`src/App.jsx`**  
  - Wraps routes with `LearningFieldsProvider` (inside `StudyProvider` and `NLPProvider`).

- **Pages now use `useLearningFields()` instead of importing from `quizData.js`:**  
  - `Dashboard.jsx`, `Quiz.jsx`, `QuizHub.jsx`, `LearningResources.jsx`, `StudyAnalytics.jsx`, `AdminQuizAssessments.jsx`  
  - They take `learningFields`, `resourceToField`, `categoryToField` from `useLearningFields()`.

### Files touched

- **Added:** `src/contexts/LearningFieldsContext.jsx`
- **Updated:** `src/App.jsx` (provider and route for admin quiz generate)
- **Updated:** `src/pages/Dashboard.jsx`, `Quiz.jsx`, `QuizHub.jsx`, `LearningResources.jsx`, `StudyAnalytics.jsx`, `AdminQuizAssessments.jsx` (use `useLearningFields()`)

---

## 3. Admin quiz generation (optional) and storage

### What changed

- Admins can still trigger **full field generation** (3 quizzes + 1 final) from the admin UI; results are **saved on the server** and appear on the frontend without copy-paste.
- Generated fields are stored in `server/data/generatedQuizzes.json` and returned by `GET /api/quiz/fields`.

### Backend

- **`server/routes/quiz.js`**  
  - `POST /api/quiz/generate-field`: generates full field (3 quizzes + final), saves to `generatedQuizzes.json`, replaces existing field with same `fieldId`.  
  - `GET /api/quiz/fields`: returns all saved generated fields.

### Frontend

- **`src/pages/AdminQuizGenerate.jsx`**  
  - Form for field id, name, description; “Generate full field” calls `generateQuizField`, shows result, calls `refreshGenerated()` so the new field appears immediately.

### Files touched

- **Updated:** `server/routes/quiz.js` (generate-field, save/read generated, generate-from-resources).
- **Updated:** `src/pages/AdminQuizGenerate.jsx` (refresh after generate).

---

## 4. Chat (EduBot/AtlasBot) improvements

### What changed

- Quiz suggestions and navigation now refer to **“Learning Resources”** and `/resources` instead of “Quiz hub”.
- Broader **topic coverage**: law, business, health, education, humanities, agriculture, etc., so queries like “learn about health” return health resources.
- **Full-keyword matching** for categories so “learn about law” is not confused with “machine learning”.
- **LLM fallback**: General (non–EduConnect) questions can use OpenAI when `OPENAI_API_KEY` is set; otherwise a short EduConnect-focused message is shown (no mention of API keys to users).

### Files touched

- **Updated:** `server/routes/chat.js`  
  - Quiz-related text and paths → “Learning Resources”, `/resources`.  
  - `EDUCONNECT_KEYWORDS` and `CATEGORY_KEYWORDS` / `CATEGORY_LABELS` expanded (e.g. education, humanities, health, agriculture).  
  - `getCategoriesFromMessage` uses full-keyword matching only.  
  - `handleResources` uses all categories; generic resource reply mentions them.  
  - `isEduConnectQuestion` and early LLM path for non–EduConnect questions; fallback message when LLM not configured.

---

## 5. Data pipeline and Postgres load (earlier in session)

### What changed

- **Single canonical CSV:** `public/educonnect_students_unified.csv` is the one output used by the app and by the Postgres load script.
- **`scripts/build_final_dataset.py`** copies the final unified CSV into `public/educonnect_students_unified.csv`.
- **`scripts/Load_final_postgres.py`**  
  - Reads from that canonical path.  
  - Uses env vars for DB credentials (with defaults).  
  - Sanitizes column names for PostgreSQL; deduplicates column names; UTF-8; batched inserts; clearer error messages (e.g. connection refused).

### Files touched

- **Updated:** `scripts/build_final_dataset.py` (copy to `public/educonnect_students_unified.csv`).
- **Updated:** `scripts/Load_final_postgres.py` (canonical path, env, column sanitization, errors).

---

## 6. Git and repo hygiene (earlier in session)

### What changed

- `.gitignore` updated so GitHub does not receive: virtual envs (e.g. `.venv`, `venv`), `__pycache__`, large model files (`*.safetensors`, `backend/models/`), `.env` and `.env.example` where appropriate.
- Steps for pull → push to a shared repo (e.g. Helen’s) and handling large files/secrets are documented in conversation.

### Files touched

- **Updated:** `.gitignore` at repo root and under `Educonnect` (envs, models, `.env`).
- **Updated:** `server/.env.example` (no real API key; placeholder only).

---

## Quick file summary (changes since latest session)

| Area | Files |
|------|--------|
| Quiz from resources | `server/routes/quiz.js`, `src/api/quizApi.js`, `src/pages/QuizHub.jsx` |
| Learning fields context | `src/contexts/LearningFieldsContext.jsx`, `src/App.jsx`, Dashboard, Quiz, QuizHub, LearningResources, StudyAnalytics, AdminQuizAssessments |
| Admin quiz generate | `server/routes/quiz.js`, `src/pages/AdminQuizGenerate.jsx` |
| Chat | `server/routes/chat.js` |
| Data pipeline / Postgres | `scripts/build_final_dataset.py`, `scripts/Load_final_postgres.py` |
| Git / env | `.gitignore`, `server/.env.example` |
| Docs | `docs/README.md`, `docs/CHANGES_SINCE_LATEST.md` (this file) |

---

**Last updated:** February 2025
