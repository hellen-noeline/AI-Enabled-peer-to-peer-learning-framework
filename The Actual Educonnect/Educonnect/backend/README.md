# EduConnect Backend

BERTopic API + SQLite database for users and auth.

## Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

API runs at http://localhost:5000

**Note:** The frontend expects the backend to be running for sign-up and login. Start the backend before using the app.

## Endpoints

### Auth & Users
- `POST /api/auth/signup` – Register a new user
  - Body: `{ "firstName", "lastName", "email", "password", ...profile }`
- `POST /api/auth/login` – Login
  - Body: `{ "email", "password" }`
- `GET /api/admin/users` – List all users (admin only)
  - Header: `X-User-Email: admin@educonnect.com`
- `GET /api/users/<id>` – Get user by id

### BERTopic
- `POST /api/topics` – Topic modelling
  - Body: `{ "documents": ["doc1", "doc2", ...] }`
- `GET /api/health` – Health check

## Database

- **SQLite**: `educonnect.db` (created automatically in the backend folder)
- **Users** are stored when they sign up. Admins can view all registered users at `/admin/users` in the app.
