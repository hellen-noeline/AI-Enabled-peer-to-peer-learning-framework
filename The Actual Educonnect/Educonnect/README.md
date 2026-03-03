# EduConnect - Study Partner Platform

A modern React-based platform that helps students find study partners based on similar interests, skills, and preferences. Built with a Samsung ONE UI 6.0 inspired design, with optional Node.js API and Python BERTopic backend.

## Features

- **User Authentication**: Secure sign up and login (local storage or API when server is running)
- **Smart Recommendation System**: AI-powered matching based on:
  - Interests (ordered + additional, any field; primary factor)
  - Technical Skills, Soft Skills, Research/Professional Interests, Hobbies
  - Preferred Learning Style, Study Partner Preferences, Preferred Study Hours
- **Interactive Dashboard**: Visualizations for study hours, weekly progress, sessions completed
- **User Profiles**: Bio, skills, interests, study preferences; editable profile sections
- **Study Partner Discovery**: Top recommendations on dashboard; full page with search and filtering; match scores
- **Learning Resources**: Curated resources by field
- **Quiz Hub & Quizzes**: Field-based quizzes for self-assessment
- **Study Groups & Chat**: Create/join study groups; group chat and direct (DM) chat
- **Study Analytics**: Track and visualize study activity
- **ML next-topic recommender**: Trained model suggests which field to study next (see [docs/ML_MODEL.md](docs/ML_MODEL.md)); run `python scripts/train_next_topic_model.py` to train/update
- **EduBot**: In-app AI assistant
- **Audio Reader**: Text-to-speech / accessibility
- **Theme Support**: Light/dark theme (ThemeContext)
- **Feedback**: User feedback with optional EmailJS confirmation; admin can respond (server sends to user’s sign-in email)
- **Admin**: Admin dashboard, user management, quiz assessments (default admin: `admin@educonnect.com` / `1234`)
- **Welcome Message**: Animated welcome on login

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Build for Production

```bash
npm run build
```

### Deploy to GitHub Pages

1. Build: `npm run build`
2. Configure GitHub Pages to serve from the `dist` folder.
3. CSV datasets in `public/` are included in the build.

### Training the ML next-topic model

To train or update the model that suggests which field to study next (shown on the Dashboard study plan):

```bash
cd Educonnect
pip install -r scripts/requirements-ml.txt
python scripts/train_next_topic_model.py
```

Ensure the server has been run at least once so `server/educonnect.db` exists and (optionally) has some users. The script writes `server/model_export.json`; the Node server uses it for inference. See [docs/ML_MODEL.md](docs/ML_MODEL.md) for details.

## Project Structure

```
Educonnect/
├── public/                    # Static assets and datasets
│   ├── ugandan_students_dataset_1050.csv
│   ├── educonnect_students_unified.csv   # Single dataset, all courses equally represented
│   ├── curriculum_fallback.json         # Static programmes (MAK, UCU, etc.)
│   └── us_students_dataset_1500.csv
├── scripts/
│   ├── build_unified_student_dataset.py # Build single CSV with all courses equally represented
│   ├── scrape_university_curriculum.py  # Scrape MAK/UCU programmes (merged with curriculum_fallback.json)
│   └── generate_ugandan_students.py     # Regenerate Ugandan dataset
├── server/                    # Node.js API (auth, users, dataset, feedback, chat, admin)
│   ├── routes/               # auth, users, dataset, feedback, admin, chat
│   ├── index.js
│   ├── db.js
│   ├── seed.js
│   └── README.md
├── backend/                   # Optional Python BERTopic API
│   ├── app.py
│   ├── database.py
│   ├── requirements.txt
│   └── README.md
├── src/
│   ├── api/                  # API clients
│   │   ├── authApi.js
│   │   ├── feedbackApi.js
│   │   └── chatApi.js
│   ├── components/
│   │   ├── Navigation.jsx
│   │   ├── AdminNavigation.jsx
│   │   ├── WelcomeMessage.jsx
│   │   ├── AtlasBot.jsx
│   │   └── AudioReader.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   ├── ThemeContext.jsx
│   │   ├── StudyContext.jsx
│   │   └── NLPContext.jsx
│   ├── data/
│   │   ├── quizData.js
│   │   └── learningResources.js
│   ├── hooks/
│   │   └── useTextToSpeech.js
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── SignUp.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Profile.jsx
│   │   ├── Recommendations.jsx
│   │   ├── Feedback.jsx
│   │   ├── LearningResources.jsx
│   │   ├── QuizHub.jsx
│   │   ├── Quiz.jsx
│   │   ├── StudyGroups.jsx
│   │   ├── GroupChat.jsx
│   │   ├── PersonalChat.jsx
│   │   ├── StudyAnalytics.jsx
│   │   ├── NLPInsights.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminUsers.jsx
│   │   └── AdminQuizAssessments.jsx
│   ├── styles/               # Per-page/component CSS
│   │   ├── Dashboard.css
│   │   ├── Login.css
│   │   ├── SignUp.css
│   │   ├── Profile.css
│   │   ├── Recommendations.css
│   │   ├── Feedback.css
│   │   ├── LearningResources.css
│   │   ├── Quiz.css
│   │   ├── StudyGroups.css
│   │   ├── GroupChat.css
│   │   ├── PersonalChat.css
│   │   ├── StudyAnalytics.css
│   │   ├── NLPInsights.css
│   │   ├── Navigation.css
│   │   ├── WelcomeMessage.css
│   │   ├── AtlasBot.css
│   │   ├── AudioReader.css
│   │   ├── AdminDashboard.css
│   │   ├── AdminUsers.css
│   │   └── AdminQuizAssessments.css
│   ├── utils/
│   │   ├── datasetLoader.js
│   │   ├── recommendationEngine.js
│   │   ├── emailService.js
│   │   ├── sentimentAnalysis.js
│   │   ├── nlpBackgroundService.js
│   │   ├── groupChat.js
│   │   └── chatResourceRecommender.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
└── README.md
```

## Tech Stack

- **React 18** – UI library
- **Vite** – Build tool and dev server
- **React Router** – Client-side routing
- **Framer Motion** – Animations
- **Recharts** – Charts
- **PapaParse** – CSV parsing
- **@emailjs/browser** – Optional feedback confirmation emails
- **@xenova/transformers** – Optional client-side NLP

## Dataset

The platform uses the Ugandan (and US) student datasets, combined with registered users for recommendations:

- **Unified students** (`public/educonnect_students_unified.csv`) – single dataset with all courses equally represented (Computing, Law, Business, Education, etc.); generated by `scripts/build_unified_student_dataset.py` from base Ugandan data and curriculum (scraped + `public/curriculum_fallback.json`). Used by seed and CSV fallback.
- **Ugandan students** (`public/ugandan_students_dataset_1050.csv`) – base pool for generating the unified dataset.
- **US students** (`public/us_students_dataset_1500.csv`) – optional; used only by expand script and notebooks.

To regenerate the Ugandan dataset:

```bash
python scripts/generate_ugandan_students.py
```

To (re)build the **unified student dataset** (all courses equally represented):

```bash
python scripts/build_unified_student_dataset.py
```

Then run `npm run seed` from the server folder to load it. See [docs/DATA_PIPELINE.md](docs/DATA_PIPELINE.md).

Run from the `Educonnect` folder.

### University curriculum (MAK & UCU)

For **reactive** filtering by university, faculty, and course (and for progress-by-semester), the app uses a structured curriculum dataset built by scraping Makerere and UCU:

- **Dataset:** `public/university_curriculum.json` — scraped data: full curriculum for MAK BIT, BBA, and LLB; UCU catalog placeholders (Business, Engineering, Law). Structure: University → College → Course → Year → Semester → Unit.
- **Schema:** `docs/curriculum-schema.json` — JSON schema for validating or merging more data.
- **Scraping guide:** `docs/UNIVERSITY_CURRICULUM_SCRAPING.md` — two-step strategy, Casa AI prompts, target URLs, and how to add more programs or UCU units.

## Database & API (optional)

To store **registered users** and **the student dataset** and use auth/feedback/chat/admin via API:

1. **Start the server** (from project root):
   ```bash
   cd server && npm install && npm start
   ```
   API runs at `http://localhost:5000`. Use `VITE_API_URL=http://localhost:5000` if your frontend points to it.

2. **Seed the database**:
   ```bash
   cd server && npm run seed
   ```
   Loads the CSV(s) into the DB. Registered users are kept.

3. With the server running, sign up and login use the API; the app can load the dataset from the API when available.

See `server/README.md` for API endpoints, default admin, and SMTP for feedback response emails.

## Recommendation Algorithm

Weighted similarity (Jaccard for categorical data):

- Interests (ordered + additional): 50%
- Technical Skills: 15%
- Soft Skills: 10%
- Research Interests: 10%
- Professional Interests: 10%
- Hobbies: 5%
- Preferred Learning Style: 5%
- Study Partner Preferences: 3%
- Preferred Study Hours: 2%

## Feedback Email (Optional)

For user feedback confirmation emails:

1. Sign up at [EmailJS](https://www.emailjs.com/).
2. Add an email service and create a template with: `{{to_email}}`, `{{user_name}}`, `{{subject}}`, `{{message}}`, `{{feedback_type}}`.
3. Copy `.env.example` to `.env` and add Service ID, Template ID, and Public Key.
4. `npm install` (includes `@emailjs/browser`).

Without this, feedback is still saved; only the confirmation email is skipped.

**Admin response emails** are sent by the server to the user’s sign-in email. Configure SMTP in the server env (`SMTP_USER`, `SMTP_PASS`; see `server/README.md`).

## License

This project is open source and available for educational purposes.
