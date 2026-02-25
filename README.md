# Peer-to-Peer Learning Project

An AI-enabled peer-to-peer learning framework centered around **EduConnect**, a study partner platform that helps students find compatible study partners, track progress, and access learning resources.

---

## What's Inside

| Folder / Item | Description |
|---------------|-------------|
| **AI-Enabled-peer-to-peer-learning-framework** | Main project: framework, app, and presentation assets |
| **The Actual Educonnect / Educonnect** | EduConnect web app (React + Node API) |
| **pptx_extract** | Presentation/slide content (extracted) |

---

## EduConnect – Quick Start

The main application lives here:

```
AI-Enabled-peer-to-peer-learning-framework/The Actual Educonnect/Educonnect/
```

### Prerequisites

- **Node.js** 16 or higher  
- **npm**

### Run the app

1. **Frontend only (no backend):**
   ```bash
   cd "AI-Enabled-peer-to-peer-learning-framework/The Actual Educonnect/Educonnect"
   npm install
   npm run dev
   ```
   Open **http://localhost:5173** (or the port shown in the terminal).

2. **With backend (users + dataset in database):**
   ```bash
   cd "AI-Enabled-peer-to-peer-learning-framework/The Actual Educonnect/Educonnect/server"
   npm install
   npm start
   ```
   Then in another terminal, from the `Educonnect` folder:
   ```bash
   npm run dev
   ```
   Optionally seed the dataset: `cd server && npm run seed`.

### Build for production

From the `Educonnect` folder:

```bash
npm run build
```

Output is in the `dist/` folder.

---

## Features

- **Authentication** – Sign up, sign in (optional SQLite backend with bcrypt)
- **Recommendations** – Weighted matching by CS interests, skills, learning style, study hours
- **Study tracking** – Active study intervals, quiz-based credit, weekly goals
- **Learning resources** – Curated materials by topic (AI, ML, data science, etc.)
- **Study groups** – Interest-based groups and match scores
- **Quizzes** – Per-topic quizzes with verified study credit
- **Feedback** – User feedback and optional admin response emails
- **Admin** – User list and quiz assessments (when using the backend)

---

## Documentation

- **[EduConnect README](AI-Enabled-peer-to-peer-learning-framework/The%20Actual%20Educonnect/Educonnect/README.md)** – Setup, features, dataset, recommendation algorithm  
- **[Full documentation](AI-Enabled-peer-to-peer-learning-framework/The%20Actual%20Educonnect/Educonnect/DOCUMENTATION.md)** – Architecture, components, study tracking, auth  
- **[Server README](AI-Enabled-peer-to-peer-learning-framework/The%20Actual%20Educonnect/Educonnect/server/README.md)** – API endpoints, database, seed, admin

---

## Tech Stack

- **Frontend:** React 18, Vite, React Router, Framer Motion, Recharts  
- **Backend:** Node.js, Express, SQLite (sql.js)  
- **Data:** CSV dataset (e.g. Ugandan students), optional DB seed

---

## License

This project is open source and available for educational purposes.
