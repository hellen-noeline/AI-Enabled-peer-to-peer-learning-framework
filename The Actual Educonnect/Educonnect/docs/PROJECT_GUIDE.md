# EduConnect – Guide to Understanding the Project

Follow this guide in order. Each phase builds on the previous one.

---

## Phase 1: How the app starts (15 min)

**Goal:** See how the app boots and who wraps what.

1. **`index.html`** (project root)  
   - The single HTML file. Points to `src/main.jsx`.

2. **`src/main.jsx`**  
   - Renders the React app into the DOM. Imports and renders `<App />`.

3. **`src/App.jsx`**  
   - **Wrappers (top to bottom):** `ThemeProvider` → `AuthProvider` → `StudyProvider` → `NLPProvider` → `BrowserRouter`.  
   - **Routes:** All `<Route path="..." element={...} />` live here. Open the file and skim the list: `/login`, `/signup`, `/dashboard`, `/profile`, `/recommendations`, etc.  
   - **Route guards:** `PrivateRoute`, `StudentRoute`, `AdminRoute` – they check `user` and `isAdmin` and send you to login or the right dashboard.  
   - **Global UI:** When logged in and not on login/signup, it renders `<AudioReader />` and `<AtlasBot />`.

**Takeaway:** App.jsx is the shell: providers, routing, and the two global components (Listen + EduBot).

---

## Phase 2: Shared state – contexts (20 min)

**Goal:** Understand where user, theme, and study data live.

4. **`src/contexts/AuthContext.jsx`**  
   - Holds `user`, `login`, `logout`, `updateUser`, `recordManualStudySession`, `recordFieldProgress`, etc.  
   - Used everywhere via `useAuth()`.  
   - Session is restored from `localStorage` on load.

5. **`src/contexts/ThemeContext.jsx`**  
   - Theme (e.g. light/dark) if the app supports it. Used for styling.

6. **`src/contexts/StudyContext.jsx`**  
   - Study timer and activity. Tracks focus time and calls `recordManualStudySession` when the user finishes a session.

7. **`src/contexts/NLPContext.jsx`**  
   - Wraps NLP-related state (e.g. topic/sentiment) if used by the UI.

**Takeaway:** Auth is the main one; others add theme, study time, and NLP. Any page can `useAuth()` (and the others) to read or update that state.

---

## Phase 3: One flow end-to-end – Login (20 min)

**Goal:** Follow one feature from UI to backend.

8. **`src/pages/Login.jsx`**  
   - Form (email, password), submit handler. On success it calls something from `useAuth()` (e.g. `login`) and then navigates (e.g. to `/dashboard`).

9. **`src/api/authApi.js`** (or wherever login is called)  
   - Find the function that sends credentials to the server (e.g. `POST /api/auth/login`). That’s the “frontend → backend” call.

10. **`server/routes/auth.js`**  
    - Handles `/api/auth/login` (and usually `/api/auth/signup`). Reads DB, checks password, returns user (and maybe a token).  
11. **`server/db.js`**  
    - How the server talks to the database (e.g. SQLite). Tables like `users`.

**Takeaway:** Login page → auth API module → auth route → database. Same pattern (page → api → route → db) applies to other features.

---

## Phase 4: Main pages and what they do (30 min)

**Goal:** Map each URL to a page and a single sentence of purpose.

| Route | File | Purpose in one line |
|-------|------|----------------------|
| `/login` | `Login.jsx` | Log in with email/password. |
| `/signup` | `SignUp.jsx` | Register; form posts to auth API. |
| `/dashboard` | `Dashboard.jsx` | Home: study plan, quick links, charts, timer. |
| `/profile` | `Profile.jsx` | View/edit profile and preferences. |
| `/recommendations` | `Recommendations.jsx` | Study partner suggestions (uses recommendation engine). |
| `/resources` | `LearningResources.jsx` | Browse learning resources by category. |
| `/analytics` | `StudyAnalytics.jsx` | Charts and stats for study time and quizzes. |
| `/quiz/:fieldId` | `QuizHub.jsx` | List of quizzes for a field. |
| `/quiz/:fieldId/:quizId` | `Quiz.jsx` | Take a single quiz; records progress. |
| `/groups` | `StudyGroups.jsx` | List and create study groups. |
| `/groups/chat/:chatRoomId` | `GroupChat.jsx` | Group chat room. |
| `/chat/dm/:otherUserId` | `PersonalChat.jsx` | 1:1 chat with another user. |
| `/feedback` | `Feedback.jsx` | Send feedback to the team. |
| `/admin/dashboard` | `AdminDashboard.jsx` | Admin home. |
| `/admin/users` | `AdminUsers.jsx` | List/manage users. |
| `/admin/assessments` | `AdminQuizAssessments.jsx` | View quiz assessments. |

Open each file and read the first 20–30 lines (imports + state). You don’t need to understand every line; just see “this page does X and uses Y from context/API.”

---

## Phase 5: Global components (15 min)

**Goal:** Know what the Listen button and EduBot are and where they live.

12. **`src/components/AudioReader.jsx`**  
    - The “Listen” (read-aloud) button. Uses `useTextToSpeech` to read the main content of the page.

13. **`src/hooks/useTextToSpeech.js`**  
    - Uses the browser’s `speechSynthesis` to speak text. No backend.

14. **`src/components/AtlasBot.jsx`**  
    - EduBot chat UI: input, send, message list, action buttons. On send it calls `sendAtlasMessage(text)`.

15. **`src/api/chatApi.js`**  
    - `sendAtlasMessage(message)` → `POST /api/chat` with `{ message }`. Returns `{ reply, actions }`.

**Takeaway:** Listen = AudioReader + useTextToSpeech (browser only). Chat = AtlasBot → chatApi → server.

---

## Phase 6: Chat and study-plan backend (25 min)

**Goal:** See how the bot reply and study plan are built.

16. **`server/routes/chat.js`**  
    - Handles `POST /api/chat`. Flow: optional NLP intent (Python) → keyword handlers (hello, help, resources, etc.) → if nothing matches, optional LLM fallback (OpenAI) or out-of-scope reply. Returns `{ reply, actions }`.

17. **`server/routes/studyPlan.js`**  
    - Handles study-plan requests. Calls `buildCohortInsights`, `predictNextTopic`, and `generateStudyPlan`.

18. **`server/studyPlanEngine.js`**  
    - Builds the study schedule and suggestions from user + cohort + ML hint.

19. **`server/cohortInsights.js`**  
    - Aggregates “students like you” stats from the DB.

20. **`server/mlInference.js`**  
    - Loads the next-topic model and returns a suggested topic.

**Takeaway:** Chat = intent + keywords + optional LLM. Study plan = engine + cohort insights + optional ML.

---

## Phase 7: Data and utilities (20 min)

**Goal:** Know where key data and helpers live.

21. **`src/utils/recommendationEngine.js`**  
    - Partner matching (e.g. weighted Jaccard on interests/fields). Used by Recommendations page.

22. **`src/data/learningResources.js`**  
    - List of learning resources (courses, links). Used by LearningResources and chat.

23. **`src/data/quizData.js`**  
    - Quiz questions and answers by field. Used by Quiz and QuizHub.

24. **`server/data/learningResources.js`**  
    - Server-side copy (or source) of resources for the chat bot.

25. **`src/api/studyPlanApi.js`**  
    - Fetches study plan from the server. Used by Dashboard.

**Takeaway:** Recommendations and resources/quizzes have clear “data + util” homes; study plan has its own API and backend.

---

## Phase 8: Optional – Python and NLP (15 min)

**Goal:** See where optional NLP runs.

26. **`backend/app.py`**  
    - Flask app. Endpoints: e.g. `/api/health`, `/api/nlp/atlas-intent` (embed message, match to intent phrases, return intent + confidence). Used by the Node chat route when the Python service is running.

**Takeaway:** Python is optional; when up, the Node chat uses it for better intent detection before keywords/LLM.

---

## Quick reference – folder map

| Folder / file | Role |
|---------------|------|
| `src/App.jsx` | Routes, guards, global components. |
| `src/main.jsx` | React entry. |
| `src/contexts/*` | Auth, theme, study, NLP state. |
| `src/pages/*` | One page per route. |
| `src/components/*` | Reusable UI (Nav, AtlasBot, AudioReader, etc.). |
| `src/api/*` | Functions that call the Node backend. |
| `src/utils/*` | Helpers (recommendation engine, dataset loader, etc.). |
| `src/data/*` | Static data (resources, quiz data). |
| `src/hooks/*` | Reusable logic (e.g. useTextToSpeech). |
| `server/index.js` | Express app, mounts routes. |
| `server/routes/*` | Auth, users, chat, study plan, feedback, etc. |
| `server/*.js` | DB, study plan engine, cohort insights, ML inference. |
| `backend/app.py` | Optional Flask NLP (intent). |

---

## How to use this guide

- Do **Phase 1–3** first so you see startup, context, and one full flow (login).  
- Then **Phase 4** to attach “this URL = this page = this purpose.”  
- **Phase 5–6** for chat and study plan (where a lot of the “smarts” live).  
- **Phase 7–8** when you need to find or change data and backend behavior.

Educonnect Architecture
                         ┌───────────────────────────┐
                         │         User              │
                         │ Student / Admin / Visitor │
                         └─────────────┬─────────────┘
                                       │
                                       ▼
                         ┌───────────────────────────┐
                         │     React Frontend        │
                         │ src/main.jsx → App.jsx    │
                         │ Pages, Routes, Components │
                         └─────────────┬─────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
      ┌─────────────────────┐  ┌──────────────────┐  ┌──────────────────┐
      │   AuthContext       │  │   StudyContext   │  │    NLPContext    │
      │ user, login, logout │  │ timer, sessions  │  │ NLP-related state│
      └──────────┬──────────┘  └────────┬─────────┘  └────────┬─────────┘
                 │                       │                     │
                 └───────────────┬───────┴───────────────┬─────┘
                                 │                       │
                                 ▼                       ▼
                    ┌───────────────────────┐   ┌──────────────────────┐
                    │ Global Components     │   │ Frontend API Layer   │
                    │ AtlasBot, AudioReader │   │ src/api/*            │
                    └───────────┬───────────┘   └──────────┬───────────┘
                                │                          │
                                └──────────────┬───────────┘
                                               │ HTTP / JSON
                                               ▼
                           ┌──────────────────────────────────┐
                           │      Node.js / Express Backend   │
                           │         server/index.js          │
                           └───────────────┬──────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         │                                 │                                 │
         ▼                                 ▼                                 ▼
┌──────────────────┐            ┌──────────────────┐              ┌──────────────────┐
│ Auth Routes      │            │ Chat Routes      │              │ Study Plan Routes │
│ login, signup    │            │ /api/chat        │              │ /api/study-plan   │
└────────┬─────────┘            └────────┬─────────┘              └────────┬─────────┘
         │                               │                                  │
         ▼                               ▼                                  ▼
┌──────────────────┐            ┌──────────────────┐              ┌──────────────────────┐
│ Database Layer   │            │ Intent / Keyword │              │ Study Plan Engine    │
│ server/db.js     │            │ handling         │              │ Recommendations      │
└────────┬─────────┘            └────────┬─────────┘              └────────┬─────────────┘
         │                               │                                  │
         ▼                               ▼                                  ▼
┌──────────────────┐            ┌──────────────────┐              ┌──────────────────────┐
│ SQLite Database  │            │ Optional Python  │              │ ML Inference         │
│ users, progress, │            │ Flask NLP API    │              │ next-topic model     │
│ study stats      │            │ backend/app.py   │              │ cohort insights      │
└──────────────────┘            └──────────────────┘              └──────────────────────┘