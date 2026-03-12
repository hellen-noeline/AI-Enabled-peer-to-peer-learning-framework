# EduConnect documentation

This folder contains all project documentation. Use this as the main index.

---

## Where to start

| Document | Purpose |
|----------|---------|
| **[PROJECT_GUIDE.md](./PROJECT_GUIDE.md)** | Step-by-step guide to understand the codebase (phases 1–8). Start here to learn how the app works. |
| **[DOCUMENTATION.md](../DOCUMENTATION.md)** (project root) | Full system documentation: features, architecture, setup, user guide, troubleshooting. |
| **[PRESENTATION_DOCUMENTATION.md](../PRESENTATION_DOCUMENTATION.md)** (project root) | Presentation-ready overview: stack, architecture, API, demo steps. |

---

## Latest changes

| Document | Purpose |
|----------|---------|
| **[CHANGES_SINCE_LATEST.md](./CHANGES_SINCE_LATEST.md)** | **All changes since latest session**: AI quiz generation from resources, no-admin flow, QuizHub auto-generate, chat and quiz improvements. **Read this for recent work.** |
| **[RECENT_CHANGES.md](./RECENT_CHANGES.md)** | Earlier changes: cohort insights, ML model in study plan, next-topic prediction. |

---

## Technical deep-dives

| Document | Purpose |
|----------|---------|
| **[DATA_PIPELINE.md](./DATA_PIPELINE.md)** | ETL pipeline: raw → staging → final, canonical CSV, loading to PostgreSQL. |
| **[ML_MODEL.md](./ML_MODEL.md)** | Next-topic ML model: training, export, inference in the app. |
| **[INTENT_MODEL_SETUP.md](./INTENT_MODEL_SETUP.md)** | AtlasBot/EduBot intent model: training (Colab), upload, usage in chat. |
| **[STUDY_PLAN_AND_ML.md](./STUDY_PLAN_AND_ML.md)** | Study plan engine and ML integration. |
| **[UNIVERSITY_CURRICULUM_SCRAPING.md](./UNIVERSITY_CURRICULUM_SCRAPING.md)** | Scraping and using university curriculum data. |

---

## Other files

- **curriculum-schema.json** – JSON schema for curriculum data validation.

---

## Folder layout (quick reference)

```
Educonnect/
├── docs/                          ← YOU ARE HERE
│   ├── README.md                  ← This index
│   ├── CHANGES_SINCE_LATEST.md    ← Latest updates (since yesterday)
│   ├── RECENT_CHANGES.md          ← Cohort + ML study plan changes
│   ├── PROJECT_GUIDE.md           ← How to understand the project
│   ├── DATA_PIPELINE.md           ← ETL and Postgres load
│   ├── ML_MODEL.md                ← Next-topic model
│   ├── INTENT_MODEL_SETUP.md      ← Chat intent model
│   ├── STUDY_PLAN_AND_ML.md
│   ├── UNIVERSITY_CURRICULUM_SCRAPING.md
│   └── curriculum-schema.json
├── DOCUMENTATION.md               ← Full system doc (root)
├── PRESENTATION_DOCUMENTATION.md  ← Presentation overview (root)
├── README.md                     ← Project readme (root)
├── src/                          ← React frontend
├── server/                       ← Node/Express API + SQLite
└── backend/                      ← Python Flask (NLP)
```

---

**Last updated:** February 2025
