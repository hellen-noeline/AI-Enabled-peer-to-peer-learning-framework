# EduConnect - Complete System Documentation

**For a technical overview and presentation-ready summary** (stack, architecture, API, database, accessibility, demo steps), see **[PRESENTATION_DOCUMENTATION.md](./PRESENTATION_DOCUMENTATION.md)**.

## Table of Contents
1. [System Overview](#system-overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Installation & Setup](#installation--setup)
5. [User Guide](#user-guide)
6. [Technical Documentation](#technical-documentation)
7. [Data Storage](#data-storage)
8. [Components Reference](#components-reference)
9. [Study Tracking System](#study-tracking-system)
10. [Learning Resources](#learning-resources)
11. [Study Groups](#study-groups)
12. [Authentication System](#authentication-system)
13. [Troubleshooting](#troubleshooting)

---

## System Overview

EduConnect is a comprehensive study partner platform designed to help students find compatible study partners, track their study progress, access learning resources, and join study groups based on shared interests. The system uses intelligent matching algorithms to connect students with similar academic interests, skills, and learning preferences.

### Key Objectives
- Connect students with compatible study partners
- Track and visualize study progress
- Provide curated learning resources
- Create study groups based on interests
- Enable feedback and communication

---

## Features

### 1. User Authentication
- **Sign Up**: Multi-step registration process collecting:
  - Personal information (name, email, password, contact details)
  - Academic information (university, GPA, courses)
  - Skills and interests (technical, soft skills, CS interests)
  - Study preferences (learning style, preferred hours)
- **Sign In**: Secure login with email and password
- **Session Management**: Automatic session tracking and user persistence
- **Profile Management**: Editable user profiles with comprehensive information

### 2. Smart Recommendation System
- **AI-Powered Matching**: Weighted algorithm considering:
  - CS and Data Science Interests (40%)
  - Technical Skills (15%)
  - Soft Skills (10%)
  - Research Interests (10%)
  - Professional Interests (10%)
  - Hobbies (5%)
  - Learning Style (5%)
  - Study Preferences (3%)
  - Preferred Study Hours (2%)
- **Match Scores**: Percentage-based compatibility scores
- **Search & Filter**: Advanced filtering options for finding partners

### 3. Study Tracking & Analytics
- **Automatic Tracking**: Records study sessions based on login activity
- **Real-time Statistics**:
  - Total study hours (all-time)
  - Weekly study hours (day-by-day breakdown)
  - Sessions completed
  - Study progress (percentage toward weekly goal)
- **Visual Analytics**: Interactive charts and graphs
- **Session Timer**: Active study session tracking
- **Weekly Goals**: 20-hour weekly goal with progress tracking

### 4. Learning Resources
- **Curated Materials**: Organized by technology/interest area:
  - Artificial Intelligence
  - Machine Learning
  - Data Science
  - Natural Language Processing
  - Computer Vision
  - Deep Learning
  - Cybersecurity
  - Web Development
  - Mobile Development
- **Resource Details**: Each resource includes:
  - Title and provider
  - Description
  - Difficulty level
  - Duration
  - Rating
  - Direct links
- **Category Filtering**: Easy navigation by interest area

### 5. Study Groups
- **Automatic Group Creation**: Groups generated based on user interests
- **Interest-Based Matching**: Groups created for each CS/Data Science interest
- **Member Profiles**: View group members with match scores
- **Group Statistics**: Group size, average match score, common interests
- **Smart Matching**: Minimum 30% compatibility threshold

### 6. Feedback System
- **Feedback Submission**: Users can submit feedback with:
  - Feedback type (General, Bug Report, Feature Request, etc.)
  - Subject and detailed message
  - Optional rating (1-5 stars)
- **Feedback History**: View previous submissions
- **Status Tracking**: Pending, Reviewed, Resolved statuses

### 7. Dashboard
- **Overview Statistics**: Quick access to key metrics
- **Interactive Charts**: Weekly hours and progress visualizations
- **Quick Access**: Direct links to Resources and Study Groups
- **Recommended Partners**: Top 3 study partner suggestions
- **Active Session Timer**: Real-time study session tracking

---

## Architecture

### Technology Stack
- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Context API
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Data Parsing**: PapaParse (CSV)
- **Storage**: LocalStorage (client-side); optional **SQLite** database via Node.js API server

### Project Structure
```
Educonnect/
├── public/
│   └── ugandan_students_dataset_1050.csv # Ugandan student dataset
├── server/                             # Optional API + SQLite database
│   ├── db.js                           # Database schema and connection
│   ├── index.js                        # Express app
│   ├── seed.js                         # Populate DB from CSVs (npm run seed)
│   └── routes/
│       ├── auth.js                     # POST /api/auth/signup, login
│       ├── users.js                    # PATCH /api/users/:id
│       ├── admin.js                    # GET /api/admin/users
│       └── dataset.js                  # GET /api/dataset-students
├── src/
│   ├── components/                     # Reusable components
│   │   ├── Navigation.jsx              # Main navigation bar
│   │   └── WelcomeMessage.jsx         # Welcome modal
│   ├── contexts/                       # React contexts
│   │   └── AuthContext.jsx            # Authentication & user state
│   ├── pages/                          # Page components
│   │   ├── Dashboard.jsx               # Main dashboard
│   │   ├── Login.jsx                  # Login page
│   │   ├── SignUp.jsx                 # Registration page
│   │   ├── Profile.jsx                # User profile page
│   │   ├── Recommendations.jsx       # Partner recommendations
│   │   ├── StudyAnalytics.jsx         # Detailed analytics
│   │   ├── LearningResources.jsx      # Learning materials
│   │   ├── StudyGroups.jsx           # Study groups
│   │   └── Feedback.jsx              # Feedback system
│   ├── styles/                         # CSS stylesheets
│   │   ├── Dashboard.css
│   │   ├── Login.css
│   │   ├── SignUp.css
│   │   ├── Profile.css
│   │   ├── Recommendations.css
│   │   ├── StudyAnalytics.css
│   │   ├── LearningResources.css
│   │   ├── StudyGroups.css
│   │   ├── Feedback.css
│   │   └── Navigation.css
│   ├── utils/                         # Utility functions
│   │   ├── datasetLoader.js          # CSV dataset loader
│   │   └── recommendationEngine.js  # Matching algorithm
│   ├── App.jsx                        # Main app component
│   ├── main.jsx                       # Entry point
│   └── index.css                      # Global styles
├── package.json
├── vite.config.js
└── README.md
```

---

## Installation & Setup

### Prerequisites
- Node.js 16 or higher
- npm or yarn package manager

### Installation Steps

1. **Clone or navigate to the project directory**
   ```bash
   cd "The Actual Educonnect/Educonnect"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open browser to `http://localhost:5173` (or the port shown in terminal)

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

### Database setup (optional backend)

To store registered users and the student dataset in a database:

1. **Install and run the API server**
   ```bash
   cd server
   npm install
   npm start
   ```
   Server runs at `http://localhost:5000`.

2. **Populate the database with the Ugandan dataset**
   ```bash
   cd server
   npm run seed
   ```
   This reads `public/ugandan_students_dataset_1050.csv` and inserts all rows into the `dataset_students` table. Re-run anytime to refresh dataset data.

3. **Point the frontend at the API**  
   The app uses `VITE_API_URL` (default `http://localhost:5000`). When the server is running:
   - **Sign up** and **sign in** save and validate users in the database.
   - **Dataset** for recommendations is loaded from the database when available; otherwise the app falls back to the Ugandan students CSV.

4. **Database file**  
   SQLite database: `server/educonnect.db`. Back it up by copying this file.

See `server/README.md` for API endpoints and details.

### Environment Setup

No environment variables are required. The application uses:
- LocalStorage for data persistence
- Public CSV file for dataset
- Client-side only (no backend required)

---

## User Guide

### Getting Started

1. **Sign Up**
   - Navigate to Sign Up page
   - Complete 4-step registration:
     - Step 1: Basic Information (name, email, password)
     - Step 2: Academic Information (university, GPA, courses)
     - Step 3: Interests & Skills (CS interests, technical/soft skills)
     - Step 4: Study Preferences (learning style, preferred hours)
   - Click "Create Account"

2. **Sign In**
   - Enter email and password
   - System validates credentials
   - Redirects to Dashboard on success

3. **Dashboard Overview**
   - View study statistics (Total Hours, Sessions, Progress, This Week)
   - Click stat cards to view detailed analytics
   - See recommended study partners
   - Access Learning Resources and Study Groups

### Using Study Tracking

- **Automatic Tracking**: Study time is automatically tracked when logged in
- **Session Timer**: Active timer appears on dashboard
- **Manual Recording**: Stop session button records time manually
- **Weekly Reset**: Hours reset every Monday
- **Progress Goal**: 20 hours per week target

### Finding Study Partners

1. **View Recommendations**
   - Dashboard shows top 3 recommendations
   - Click "View More" or navigate to Recommendations page
   - See match scores and compatibility details

2. **Search & Filter**
   - Use search bar to find specific users
   - Filter by interests, skills, or university
   - Sort by match score

3. **View Profiles**
   - Click on any user card to view full profile
   - See detailed information about potential partners

### Using Learning Resources

1. **Browse Resources**
   - Navigate to Resources page
   - Filter by category (AI, ML, Data Science, etc.)
   - View resource details (difficulty, duration, rating)

2. **Access Materials**
   - Click "View Resource →" to open external link
   - Resources open in new tab

### Joining Study Groups

1. **View Groups**
   - Navigate to Study Groups page
   - See automatically created groups based on your interests
   - Each group shows members and match scores

2. **Group Information**
   - View group members
   - See common interests
   - Check group match score

3. **Join Groups**
   - Click "Join Group" button
   - View group details

### Submitting Feedback

1. **Access Feedback Page**
   - Navigate to Feedback from menu
   - Fill out feedback form:
     - Select feedback type
     - Enter subject and message
     - Optionally rate (1-5 stars)

2. **View History**
   - See previous feedback submissions
   - Check status (Pending, Reviewed, Resolved)

---

## Technical Documentation

### Authentication System

#### AuthContext (`src/contexts/AuthContext.jsx`)

**State Management:**
- `user`: Current logged-in user object
- `showWelcome`: Boolean for welcome message display
- `loading`: Loading state
- `sessionStartTime`: Timestamp for session tracking

**Key Functions:**

1. **signup(userData)**
   - Validates email uniqueness
   - Creates new user with study stats
   - Stores in localStorage
   - Returns new user object

2. **login(email, password)**
   - Validates credentials (case-insensitive email)
   - Initializes session tracking
   - Records new session if new day
   - Returns user object or null

3. **logout()**
   - Clears user session
   - Removes from localStorage

4. **updateUser(updatedData)**
   - Updates user information
   - Syncs with localStorage

5. **updateStudyStats(stats)**
   - Updates study statistics
   - Maintains weekly hours array

6. **recordManualStudySession(hours)**
   - Records manual study session
   - Updates weekly hours for current day
   - Recalculates progress

**Session Tracking:**
- Automatically tracks login time
- Records new session each day
- Updates stats every 5 minutes of activity
- Resets weekly hours on Monday

### Recommendation Engine

#### Algorithm (`src/utils/recommendationEngine.js`)

**Similarity Calculation:**
```javascript
calculateSimilarity(user1, user2)
```

Uses weighted Jaccard similarity:
- Parses comma-separated values
- Calculates intersection/union for each category
- Applies weights and normalizes to 0-1 range

**Matching Process:**
1. Filter out current user
2. Calculate similarity for all other users
3. Sort by similarity score
4. Return top N recommendations with match scores

### Dataset Loader

#### CSV Parser (`src/utils/datasetLoader.js`)

**Functions:**
- `loadDataset()`: Loads and parses CSV file
- `getDatasetUsers()`: Returns cached dataset users

**Data Transformation:**
- Converts CSV rows to user objects
- Generates random study stats for dataset users
- Caches for performance

---

## Data Storage

The app can run in two modes:

1. **Frontend only**: All data is in the browser (LocalStorage). No server required.
2. **With API server**: Registered users and (optionally) the student dataset are stored in a **SQLite** database. Sign up and sign in hit the API; the dataset can be loaded from the API or from CSV.

### Database (when server is used)

- **`users`** table: one row per registered user (sign up). Passwords are hashed with bcrypt. Login updates `last_login_time`.
- **`dataset_students`** table: populated by `npm run seed` in the `server` folder from the US and Ugandan CSV files. Used for recommendations when the API is available.

### LocalStorage Keys

1. **EduConnect_user**
   - Current logged-in user object
   - Contains full user profile and study stats

2. **EduConnect_users**
   - Array of all registered users
   - Includes study statistics

3. **EduConnect_feedback**
   - Array of all feedback submissions
   - Includes user ID, type, message, rating, status

### User Object Structure

```javascript
{
  id: string,
  firstName: string,
  lastName: string,
  email: string,
  password: string, // In production, should be hashed
  university: string,
  currentGPA: string,
  technicalSkills: string,
  softSkills: string,
  csInterests: string,
  researchInterests: string,
  professionalInterests: string,
  hobbies: string,
  preferredLearningStyle: string,
  studyPartnersPreferences: string,
  preferredStudyHours: string,
  bio: string,
  createdAt: string, // ISO date string
  lastLoginTime: string, // ISO date string
  lastWeekReset: string, // ISO date string
  studyStats: {
    totalHours: number,
    weeklyHours: [number, number, number, number, number, number, number], // Mon-Sun
    sessionsCompleted: number,
    studyProgress: number // 0-100
  }
}
```

### Study Stats Structure

```javascript
studyStats: {
  totalHours: 0,           // Cumulative hours
  weeklyHours: [0,0,0,0,0,0,0], // Hours per day (Mon-Sun)
  sessionsCompleted: 0,     // Total sessions
  studyProgress: 0         // Percentage (0-100)
}
```

---

## Components Reference

### Navigation Component

**Location:** `src/components/Navigation.jsx`

**Features:**
- Responsive navigation bar
- Active route highlighting
- User profile display
- Logout functionality

**Navigation Items:**
- Dashboard
- Find Partners (Recommendations)
- Study Groups
- Resources
- Profile
- Feedback

### Welcome Message Component

**Location:** `src/components/WelcomeMessage.jsx`

**Features:**
- Animated welcome modal
- Displays on login/signup
- Dismissible

### Page Components

#### Dashboard (`src/pages/Dashboard.jsx`)
- Main landing page after login
- Study statistics cards
- Interactive charts
- Quick access to Resources and Groups
- Recommended partners preview
- Active session timer

#### Login (`src/pages/Login.jsx`)
- Email/password authentication
- Error handling
- Link to signup

#### SignUp (`src/pages/SignUp.jsx`)
- Multi-step registration form
- Form validation
- Progress indicator

#### Profile (`src/pages/Profile.jsx`)
- View/edit user profile
- Display all user information
- Editable sections

#### Recommendations (`src/pages/Recommendations.jsx`)
- Full list of recommended partners
- Search and filter functionality
- Match score display

#### StudyAnalytics (`src/pages/StudyAnalytics.jsx`)
- Detailed study statistics
- Advanced charts and visualizations
- Insights and projections

#### LearningResources (`src/pages/LearningResources.jsx`)
- Curated learning materials
- Category filtering
- Resource cards with details

#### StudyGroups (`src/pages/StudyGroups.jsx`)
- Automatically generated groups
- Group member lists
- Match scores and interests

#### Feedback (`src/pages/Feedback.jsx`)
- Feedback submission form
- Feedback history
- Status tracking

---

## Study Tracking System

### Active Study Intervals Only (Credible Analytics)

Analytics and engagement metrics are logged **only for active study intervals** so they remain credible for AI model training. No time is logged for simply having the app open or being logged in.

**How It Works:**
1. User **taps a resource** in Learning Resources (clicks "View Resource") → timer starts.
2. Timer **pauses automatically** after 5 minutes of inactivity (no mouse/keyboard/scroll/touch).
3. User clicks **Stop Session** on Dashboard (or leaves the app) → only the **elapsed active time** is recorded.
4. `totalHours`, `weeklyHours`, and `sessionsCompleted` are updated only via this manual session recording.

**Resource-based sessions (Cisco-style):**
- Session starts **only** when user taps a learning resource (course, tutorial, etc.).
- Progress is recorded **only if you've done actual studying** – minimum 5 minutes of active time.
- Short sessions (< 5 min) are not logged – no credit for opening a link and leaving.
- Dashboard shows "Tap a resource to start studying" until a resource is opened.
- After inactivity pause, user taps another resource to resume.
- **Stop Session** records the active interval only when ≥ 5 min of study.
- **Quizzes**: Each resource has a 5-question quiz. Passing (≥70%) proves engagement and logs 0.25h verified study credit. Quizzes are the primary way to track actual study progress.
- Sessions completed = study sessions + first-time quiz passes.

### Weekly Reset Logic

**Reset Conditions:**
- Checks if current week differs from last reset week
- Resets weeklyHours array to [0,0,0,0,0,0,0]
- Updates lastWeekReset timestamp

### Progress Calculation

```javascript
weeklyGoal = 20 hours
weeklyTotal = sum(weeklyHours)
studyProgress = min((weeklyTotal / weeklyGoal) * 100, 100)
```

---

## Learning Resources

### Resource Categories

1. **Artificial Intelligence (AI)**
2. **Machine Learning (ML)**
3. **Data Science (DS)**
4. **Natural Language Processing (NLP)**
5. **Computer Vision (CV)**
6. **Deep Learning (DL)**
7. **Cybersecurity**
8. **Web Development**
9. **Mobile Development**

### Resource Structure

Each resource includes:
- **Title**: Course/resource name
- **Category**: Technology area
- **Type**: Course, Tutorial, Bootcamp, etc.
- **Provider**: Platform name (Coursera, edX, etc.)
- **Description**: Brief overview
- **Link**: External URL
- **Difficulty**: Beginner, Intermediate, Advanced
- **Duration**: Time to complete
- **Rating**: 1-5 star rating

### Adding New Resources

Edit `src/pages/LearningResources.jsx`:
1. Add new object to `learningResources` array
2. Include all required fields
3. Use appropriate category ID

---

## Study Groups

### Group Creation Algorithm

**Process:**
1. Extract user's CS interests
2. For each interest:
   - Find users with matching interest
   - Calculate compatibility score
   - Filter by minimum 30% match
   - Sort by match score
   - Limit to 5-8 members
3. Create group object with:
   - Group name (interest name)
   - Members list
   - Common interests
   - Average match score

### Group Matching Factors

1. **Primary Interest Match** (40%)
   - Both users share the interest

2. **Technical Skills** (25%)
   - Jaccard similarity of skills

3. **Research Interests** (20%)
   - Overlap in research areas

4. **Learning Style** (10%)
   - Exact match

5. **Study Hours** (5%)
   - Preferred time match

### Group Display

- **Group Card**: Shows name, match score, size
- **Members List**: Current user + matched users
- **Common Interests**: Tags showing shared interests
- **Actions**: Join Group, View Details buttons

---

## Authentication System

### Sign Up Process

**Step 1: Basic Information**
- First Name, Last Name
- Email (validated for uniqueness)
- Password (with confirmation)
- Phone, DOB, Gender, Location

**Step 2: Academic Information**
- University
- Current GPA
- Credits (completed/remaining)
- Course codes
- Location details

**Step 3: Interests & Skills**
- CS and Data Science Interests (required)
- Technical Skills
- Soft Skills
- Research Interests
- Professional Interests
- Hobbies

**Step 4: Study Preferences**
- Preferred Learning Style
- Study Partners Preferences
- Preferred Study Hours
- Bio

### Login Process

1. User enters email and password
2. System checks if email exists
3. Validates password
4. If valid:
   - Loads user data
   - Initializes session tracking
   - Records new session if new day
   - Redirects to dashboard

### Security Considerations

**Current Implementation:**
- Passwords stored in plain text (localStorage)
- Email validation (case-insensitive)
- Session tracking

**Production Recommendations:**
- Hash passwords (bcrypt)
- Use secure authentication tokens
- Implement session expiration
- Add password reset functionality
- Use HTTPS for all connections

---

## Troubleshooting

### Common Issues

#### 1. User Not Found on Login
**Problem**: "No account found with this email"
**Solution**: 
- Check if user signed up successfully
- Verify email spelling (case-insensitive)
- Check localStorage for `EduConnect_users`

#### 2. Study Stats Not Updating
**Problem**: Hours not increasing
**Solution**:
- Ensure user is logged in
- Check browser console for errors
- Verify localStorage is enabled
- Refresh page to trigger session tracking

#### 3. Groups Not Showing
**Problem**: No groups displayed
**Solution**:
- Ensure user has CS interests in profile
- Check if other users exist in system
- Verify minimum match threshold (30%)
- Update profile with more interests

#### 4. Resources Not Loading
**Problem**: Resources page empty
**Solution**:
- Check `learningResources` array in component
- Verify category filter selection
- Check browser console for errors

#### 5. Charts Not Displaying
**Problem**: Charts appear blank
**Solution**:
- Verify Recharts library installed
- Check data structure matches chart requirements
- Ensure studyStats object exists

### Data Recovery

**If localStorage is cleared:**
- All user data will be lost
- Users need to sign up again
- Dataset users remain (loaded from CSV)

**Backup Recommendations:**
- Export user data periodically
- Implement cloud backup
- Use database instead of localStorage for production

### Performance Optimization

**Current Optimizations:**
- Dataset caching
- Component lazy loading
- Memoized calculations

**Further Optimizations:**
- Implement pagination for large lists
- Virtual scrolling for recommendations
- Debounce search inputs
- Cache API responses

---

## Future Enhancements

### Recommended Features

1. **Real-time Communication**
   - Chat functionality
   - Video calls for study sessions
   - Group messaging

2. **Advanced Analytics**
   - Study pattern analysis
   - Productivity insights
   - Goal setting and tracking

3. **Social Features**
   - User reviews and ratings
   - Study session scheduling
   - Achievement badges

4. **Backend Integration**
   - Server-side authentication
   - Database storage
   - API endpoints

5. **Mobile App**
   - React Native version
   - Push notifications
   - Offline support

---

## Support & Contact

For issues, questions, or contributions:
- Check this documentation first
- Review code comments
- Examine browser console for errors
- Check localStorage for data integrity

---

## License

This project is open source and available for educational purposes.

---

**Last Updated**: 2024
**Version**: 1.0.0
**Documentation Maintained By**: Development Team

