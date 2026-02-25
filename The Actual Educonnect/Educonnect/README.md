# EduConnect - Study Partner Platform

A modern React-based platform that helps students find study partners based on similar interests, skills, and preferences. Built with a beautiful Samsung ONE UI 6.0 inspired design.

## Features

- 🔐 **User Authentication**: Secure sign up and login with local storage
- 🎯 **Smart Recommendation System**: AI-powered matching based on:
  - CS and Data Science Interests (primary factor)
  - Technical Skills
  - Soft Skills
  - Research Interests
  - Professional Interests
  - Hobbies
  - Preferred Learning Style
  - Study Partner Preferences
  - Preferred Study Hours
- 📊 **Interactive Dashboard**: Beautiful visualizations showing:
  - Total study hours
  - Weekly study hours (bar chart)
  - Study progress (pie chart)
  - Sessions completed
- 👤 **User Profiles**: Comprehensive profiles with:
  - Bio and personal information
  - Skills and interests
  - Study preferences
  - Editable profile sections
- 👥 **Study Partner Discovery**: 
  - Preview of top 3 recommendations on dashboard
  - Full recommendations page with search and filtering
  - Match score indicators
- 🎨 **Modern UI/UX**: 
  - Samsung ONE UI 6.0 inspired design
  - Smooth animations with Framer Motion
  - Summer color palette
  - Fully responsive design
- 🎉 **Welcome Message**: Animated welcome message on login

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

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Deploy to GitHub Pages

1. Build the project: `npm run build`
2. Configure GitHub Pages to serve from the `dist` folder
3. The dataset CSV file is already in the `public` folder and will be included in the build

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Navigation.jsx
│   └── WelcomeMessage.jsx
├── contexts/            # React contexts
│   └── AuthContext.jsx
├── pages/               # Page components
│   ├── Dashboard.jsx
│   ├── Login.jsx
│   ├── Profile.jsx
│   ├── Recommendations.jsx
│   └── SignUp.jsx
├── styles/              # CSS files
│   ├── Dashboard.css
│   ├── Login.css
│   ├── Navigation.css
│   ├── Profile.css
│   ├── Recommendations.css
│   ├── SignUp.css
│   └── WelcomeMessage.css
├── utils/               # Utility functions
│   ├── datasetLoader.js
│   └── recommendationEngine.js
├── App.jsx
├── index.css
└── main.jsx
```

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Framer Motion** - Animation library
- **Recharts** - Chart library for visualizations
- **PapaParse** - CSV parsing for dataset

## Dataset

The platform uses the Ugandan students dataset, combined with registered users for recommendations:

1. **Ugandan students** (`public/ugandan_students_dataset_1050.csv`) – 1050+ students with:
   - Ugandan first/last names, universities, cities and districts
   - Emails, Uganda phone numbers (+256 7XX XXX XXX), gender, date of birth
   - Credits completed/remaining, course codes, city and state
   - Computing interests and skills, **strong computing fields**, **weak computing fields**
   - Technical skills, soft skills, research/professional interests, hobbies
   - Preferred learning style, partner preferences, preferred study hours

To regenerate the Ugandan dataset: `python scripts/generate_ugandan_students.py` (from the `Educonnect` folder).

## Database (optional)

To store **registered users** and **the student dataset** in a database:

1. From the project root: `cd server && npm install && npm start` — API runs at `http://localhost:5000`.
2. Populate the database: `cd server && npm run seed` — loads the US and Ugandan CSVs into the DB.
3. When the API is running, sign up and login save/validate users in SQLite; the app loads the dataset from the API when available.

See `server/README.md` for API details.

## Recommendation Algorithm

The recommendation system uses a weighted similarity algorithm:

- **CS and Data Science Interests**: 40% weight
- **Technical Skills**: 15% weight
- **Soft Skills**: 10% weight
- **Research Interests**: 10% weight
- **Professional Interests**: 10% weight
- **Hobbies**: 5% weight
- **Preferred Learning Style**: 5% weight
- **Study Partners Preferences**: 3% weight
- **Preferred Study Hours**: 2% weight

Similarity is calculated using Jaccard similarity for categorical data.

## Feedback Email (Optional)

When users submit feedback, a confirmation email is sent to their address. To enable this:

1. Sign up at [EmailJS](https://www.emailjs.com/)
2. Add an email service (Gmail, Outlook, etc.) and connect your account
3. Create an email template with these variables:
   - `{{to_email}}` – recipient (user's email) – use this in the **To** field
   - `{{user_name}}` – user's name
   - `{{subject}}` – feedback subject
   - `{{message}}` – feedback message
   - `{{feedback_type}}` – e.g. General Feedback, Bug Report
4. Copy `.env.example` to `.env` and add your EmailJS Service ID, Template ID, and Public Key
5. Run `npm install` (includes `@emailjs/browser`)

Without this setup, feedback is still saved; the confirmation email is simply skipped.

**When an admin responds to feedback**, the response is sent to the user's **sign-in email** (the address in their account). The server sends this email; configure SMTP in the server environment (`SMTP_USER`, `SMTP_PASS`; see `server/README.md`).

## License

This project is open source and available for educational purposes.

