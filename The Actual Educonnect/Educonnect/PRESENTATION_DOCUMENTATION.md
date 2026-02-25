# EduConnect — Technical & Presentation Documentation

This document is for **presenting** EduConnect: technical overview, architecture, and talking points you can use in a demo or report.

---

## 1. Project Summary (Elevator Pitch)

**EduConnect** is a **study partner platform** that helps students (especially in Uganda and similar contexts) find compatible study partners, track study progress, access curated learning resources, and get support through feedback—with **accessibility** (including audio) for blind and low-vision users.

**In one sentence:**  
*“EduConnect connects students with study partners based on interests and skills, tracks study sessions, and delivers learning content—including via text-to-speech for accessibility.”*

**Target users:**  
Students (and educators) who want to find study partners, track progress, and use structured learning resources; admins who manage users and feedback.

---

## 2. Technical Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, React Router v6 |
| **UI / UX** | Framer Motion, Recharts, CSS (Samsung ONE UI–inspired) |
| **State** | React Context (Auth, Study, NLP) |
| **Backend** | Node.js, Express |
| **Database** | SQLite (via sql.js in Node; file: `educonnect.db`) |
| **Auth** | bcrypt (password hashing), session via API + frontend state |
| **Email** | Nodemailer (feedback response), optional EmailJS (confirmation) |
| **Data** | CSV (Ugandan dataset), API for users and dataset when server runs |

**Why this stack:**  
React + Vite for a fast, maintainable UI; Node + Express for a simple API; SQLite for a file-based DB with no separate server; Web Speech API for in-browser text-to-speech.

---

## 3. System Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                           │
│  Browser → Vite dev server (e.g. localhost:5173)                 │
│  • Pages: Dashboard, Login, SignUp, Profile, Recommendations,   │
│    Learning Resources, Study Groups, Feedback, Quiz, Analytics   │
│  • Contexts: Auth, Study, NLP                                    │
│  • Audio: Listen button (TTS), Skip to main content              │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP (REST)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (Node.js + Express)               │
│  API server (e.g. localhost:5000)                                │
│  • Auth: signup, login                                           │
│  • Users: PATCH profile / study stats                            │
│  • Admin: list users (role = admin only)                         │
│  • Feedback: submit, list, admin respond (+ email to user)       │
│  • Dataset: GET dataset students (for recommendations)           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  • SQLite (educonnect.db): users, dataset_students, feedback     │
│  • Seed: Ugandan CSV → dataset_students                         │
│  • ensureAdmin: default admin@educonnect.com / 1234              │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow (Simplified)

- **Sign up / Sign in:** Frontend → POST `/api/auth/signup` or `/api/auth/login` → Backend validates, reads/writes `users` → Returns user (including `role`).
- **Recommendations:** Frontend loads users from GET `/api/dataset-students` (and registered users); recommendation engine computes similarity; UI shows ranked partners.
- **Feedback:** User submits → POST `/api/feedback`; Admin lists GET `/api/feedback/admin/all`, responds POST `/api/feedback/admin/:id/respond` → Backend sends email to user’s sign-in address.
- **Audio:** Frontend only; “Listen” uses Web Speech API to read `main#main-content` (or fallback) in reading order.

---

## 4. Database Schema (Technical)

**File:** `server/educonnect.db` (SQLite).

### Tables

| Table | Purpose |
|-------|--------|
| **users** | Registered accounts. Includes `role` (`'user'` \| `'admin'`), hashed password, profile and study stats. |
| **dataset_students** | Seeded from Ugandan CSV; used for recommendation pool. |
| **feedback** | User feedback; admin response and `responded_at`; link to user via `user_id`. |

### users (main columns)

- `id` (TEXT PK), `email` (UNIQUE), `password_hash`
- `first_name`, `last_name`, `phone_number`, `date_of_birth`, `gender`, `nationality`, `country_of_residence`
- `city`, `state`, `zip_code`, `university`, `current_gpa`, `credits_completed`, `credits_remaining`
- `courses_enrolled`, `course_codes`, `course_units`
- `technical_skills`, `soft_skills`, `research_interests`, `professional_interests`, `hobbies`
- `cs_interests`, `strong_topics`, `weak_topics`
- `preferred_learning_style`, `study_partners_preferences`, `preferred_study_hours`
- `bio`, `profile_picture`, `study_stats` (JSON), `last_week_reset`
- `created_at`, `last_login_time`
- **`role`** TEXT NOT NULL DEFAULT `'user'` CHECK(role IN ('user', 'admin'))

### dataset_students (main columns)

- `id`, `source` (e.g. `'ug'`), `registration_number`
- Same profile-style fields as users (name, email, university, skills, interests, etc.)
- `strong_computing_fields`, `weak_computing_fields`, `study_stats`

### feedback

- `id`, `user_id` (FK to users), `type`, `subject`, `message`, `rating`
- `status` (e.g. `'pending'`, `'resolved'`), `admin_response`, `responded_at`
- `sentiment_label`, `sentiment_score`, `created_at`

**Constraints:**  
`role` enforces admin vs user. Admin-only routes check `role = 'admin'` in DB. Default admin is created/updated on server start via `ensureAdmin.js`.

---

## 5. API Reference (Quick)

| Method | Path | Description | Auth / Role |
|--------|------|-------------|-------------|
| POST | `/api/auth/signup` | Register | — |
| POST | `/api/auth/login` | Login | — |
| PATCH | `/api/users/:id` | Update user / study stats | User (self) |
| GET | `/api/admin/users` | List all users | Admin (`X-User-Email`, role checked) |
| GET | `/api/dataset-students` | Dataset for recommendations | — |
| POST | `/api/feedback` | Submit feedback | — (body includes `userId`) |
| GET | `/api/feedback` | My feedback | `X-User-Email` |
| GET | `/api/feedback/admin/all` | All feedback | Admin |
| POST | `/api/feedback/admin/:id/respond` | Respond to feedback (emails user) | Admin |
| GET | `/api/health` | Health check | — |

**Auth:**  
- Login/signup return user object (including `role`).  
- Admin endpoints require header `X-User-Email` and DB `role = 'admin'`.  
- No JWT; frontend stores user in context/localStorage and sends email where needed.

---

## 6. Core Features (Technical Angle)

### Authentication & roles

- **Sign up:** POST to API; password hashed with bcrypt; `role` set from email (e.g. `admin@educonnect.com` → `admin`).
- **Sign in:** Validates credentials, returns user with `role`; frontend uses `user.role === 'admin'` for admin UI and routes.
- **Admin-only:** Backend checks `role` in DB for `/api/admin/*` and `/api/feedback/admin/*`; frontend uses `AdminRoute` and “Sign in as Admin” (restricted to admin email).

### Recommendation engine

- **Inputs:** Current user profile + pool (dataset students + registered users from API/localStorage).
- **Logic:** Weighted similarity (e.g. CS interests, technical/soft skills, research, hobbies, learning style, study preferences).
- **Output:** Sorted list with match scores; displayed on Dashboard and Recommendations page.

### Study tracking

- **Session timer:** Starts when user engages with a learning resource; pauses after inactivity; “Stop session” records time.
- **Stats:** `totalHours`, `weeklyHours` (Mon–Sun), `sessionsCompleted`, `studyProgress` (e.g. toward 20 h/week); stored in user profile and synced via PATCH when API is used.

### Feedback system

- **Submit:** POST `/api/feedback` with `userId`, type, subject, message, etc.; stored in DB.
- **Admin:** Lists all feedback; responds via POST `/api/feedback/admin/:id/respond`; backend looks up user’s email and sends response via Nodemailer (SMTP).

### Accessibility (audio and a11y)

- **Listen button:** Uses Web Speech API to read main content (`main#main-content` or `[data-audio-main]`) in paragraph order for structured listening.
- **Skip link:** “Skip to main content” for keyboard/screen reader users.
- **Semantics:** `role="main"`, `aria-label`, `aria-live` for status; button has “Listen to this page” / “Stop reading”.

---

## 7. Security & Admin (Talking Points)

- **Passwords:** Hashed with bcrypt (no plain text in DB).
- **Admin:** Single default admin account (`admin@educonnect.com` / `1234`); only users with `role = 'admin'` in DB can access admin APIs and dashboard.
- **Feedback:** Response emails sent to the sign-in email stored in DB (no arbitrary addresses from client).

---

## 8. How to Run (Demo / Presentation)

1. **Backend**  
   `cd server` → `npm install` → `npm start`  
   (Creates/updates admin user; server at `http://localhost:5000`.)

2. **Optional: seed dataset**  
   `cd server` → `npm run seed`  
   (Populates `dataset_students` from Ugandan CSV.)

3. **Frontend**  
   From project root: `npm install` → `npm run dev`  
   (App at e.g. `http://localhost:5173`.)

4. **Demo flow**  
   - Sign up as a normal user → explore Dashboard, Recommendations, Resources, Feedback.  
   - Sign in as Admin (`admin@educonnect.com` / `1234`) → show admin dashboard, user list, feedback list and respond (email if SMTP configured).  
   - Show **Listen** button (bottom-right) for TTS and **Skip to main content** (Tab) for accessibility.

---

## 9. What You Can Present (Slides / Sections)

You can structure a presentation as follows:

1. **Intro** — Problem (finding study partners, structured learning, accessibility); solution (EduConnect).
2. **Features** — Matching, study tracking, resources, feedback, admin; mention accessibility (audio, skip link).
3. **Tech stack** — Table above (React, Node, SQLite, etc.).
4. **Architecture** — Diagram (frontend ↔ API ↔ DB) and short data-flow description.
5. **Database** — Tables (users with `role`, dataset_students, feedback); constraints and admin role.
6. **APIs** — Table of main endpoints and who can call them (public vs admin).
7. **Security & roles** — Passwords, admin-only access, feedback email to sign-in address.
8. **Accessibility** — Listen (TTS), skip link, semantic HTML/ARIA.
9. **Live demo** — Sign up, login, recommendations, resources, feedback; admin login and feedback response; Listen button.
10. **Future work** — Optional: real-time chat, mobile app, more datasets, etc.

---

## 10. File / Doc Reference

| Document | Use |
|----------|-----|
| **PRESENTATION_DOCUMENTATION.md** (this file) | Technical summary and presentation structure |
| **DOCUMENTATION.md** | Full system docs, user guide, components, data structures |
| **README.md** | Quick start, features, high-level setup |
| **server/README.md** | API endpoints, DB, admin credentials, SMTP |

Use this document for the **technical bit** and **more** when presenting EduConnect (reports, slides, or live demos).
