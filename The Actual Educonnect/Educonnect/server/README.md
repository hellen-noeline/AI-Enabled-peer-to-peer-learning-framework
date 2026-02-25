# EduConnect API Server

Node.js + Express backend with SQLite. Stores **registered users** (sign up / sign in) and can serve the **US + Ugandan student dataset** from the database.

## Setup

```bash
cd server
npm install
```

## Run the server

```bash
npm start
# or with auto-reload: npm run dev
```

Server runs at **http://localhost:5000**. The frontend uses `VITE_API_URL` (default `http://localhost:5000`).

## Populate the database (seed dataset)

From the `server` folder, run:

```bash
npm run seed
```

This will:

1. Read `../public/ugandan_students_dataset_1050.csv`
2. Insert all rows into the `dataset_students` table

Re-running `npm run seed` replaces existing dataset rows (idempotent). **Registered users** in the `users` table are never deleted by seed.

## Default admin (admin-only access)

On startup the server ensures a default admin user exists. **Only this account can sign in as Admin and access admin routes.**

- **Email:** `admin@educonnect.com`
- **Password:** `1234`

Sign in on the app with "Sign in as **Admin**", then use the above credentials. All admin API routes require the requesting user to have `role = 'admin'` in the database; only this account has that role by default.

## When users are stored

- **Sign up**: User details are saved to the `users` table (password is hashed). The API returns the created user to the frontend.
- **Sign in**: Credentials are validated against the database; `last_login_time` is updated. The API returns the user profile.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Register a new user (body: signup form data) |
| POST | `/api/auth/login` | Login (body: `{ email, password }`) |
| PATCH | `/api/users/:id` | Update user (e.g. study stats) |
| GET | `/api/admin/users` | List all users (header: `X-User-Email`) |
| GET | `/api/dataset-students` | All dataset students (for recommendations) |
| POST | `/api/feedback` | Submit feedback (body: userId, type, subject, message, etc.) |
| GET | `/api/feedback` | List my feedback (header: `X-User-Email`) |
| GET | `/api/feedback/admin/all` | List all feedback – admin (header: `X-User-Email`) |
| POST | `/api/feedback/admin/:id/respond` | Respond to feedback; sends response to user's **sign-in email** (header: `X-User-Email`, body: `{ adminResponse }`) |
| GET | `/api/health` | Health check |

## Feedback response emails

When an admin responds to feedback, the response is sent **to the email address the user used to sign in** (from the database). Configure SMTP in the server environment:

- `SMTP_USER` – e.g. your Gmail address  
- `SMTP_PASS` – app password or account password  
- Optional: `SMTP_HOST` (default `smtp.gmail.com`), `SMTP_PORT` (default `587`), `SMTP_FROM`

Without SMTP, the response is still saved; only the email is skipped.

## Database file

SQLite database file: `server/educonnect.db`. Create a backup by copying this file.
