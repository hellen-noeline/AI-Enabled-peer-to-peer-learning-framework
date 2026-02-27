# EduConnect - Study Partner Platform

A modern React-based platform that helps students find study partners based on similar interests, skills, and preferences. Built with a Samsung ONE UI 6.0 inspired design, with optional Node.js API and Python BERTopic backend.

## Features

- 🔐 **User Authentication**: Secure sign up and login (local storage or API when server is running)
- 🎯 **Smart Recommendation System**: AI-powered matching based on:
  - CS and Data Science Interests (primary factor)
  - Technical Skills, Soft Skills, Research/Professional Interests, Hobbies
  - Preferred Learning Style, Study Partner Preferences, Preferred Study Hours
- 📊 **Interactive Dashboard**: Visualizations for study hours, weekly progress, sessions completed
- 👤 **User Profiles**: Bio, skills, interests, study preferences; editable profile sections
- 👥 **Study Partner Discovery**: Top recommendations on dashboard; full page with search and filtering; match scores
- 📚 **Learning Resources**: Curated resources by field
- 📝 **Quiz Hub & Quizzes**: Field-based quizzes for self-assessment
- 👥 **Study Groups & Chat**: Create/join study groups; group chat and direct (DM) chat
- 📈 **Study Analytics**: Track and visualize study activity
- 🤖 **AtlasBot**: In-app AI assistant
- 🔊 **Audio Reader**: Text-to-speech / accessibility
- 🎨 **Theme Support**: Light/dark theme (ThemeContext)
- 📧 **Feedback**: User feedback with optional EmailJS confirmation; admin can respond (server sends to user’s sign-in email)
- 👑 **Admin**: Admin dashboard, user management, quiz assessments (default admin: `admin@educonnect.com` / `1234`)
- 🎉 **Welcome Message**: Animated welcome on login

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

## Project Structure

```
Educonnect/
├── public/                    # Static assets and datasets
│   ├── ugandan_students_dataset_1050.csv
│   └── us_students_dataset_1500.csv
├── scripts/
│   └── generate_ugandan_students.py   # Regenerate Ugandan dataset
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

- **Ugandan students** (`public/ugandan_students_dataset_1050.csv`) – 1050+ students (names, universities, emails, phone, gender, DOB, credits, course codes, computing interests/skills, technical/soft skills, research/professional interests, hobbies, learning style, partner preferences, study hours).
- **US students** (`public/us_students_dataset_1500.csv`) – optional second dataset.

To regenerate the Ugandan dataset:

```bash
python scripts/generate_ugandan_students.py
```

Run from the `Educonnect` folder.

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

- CS and Data Science Interests: 40%
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
