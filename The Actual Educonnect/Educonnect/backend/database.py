"""
SQLite database for EduConnect users.
Run backend from project root: python -m backend.app  OR  cd backend && python app.py
"""
import sqlite3
import json
import os
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), 'educonnect.db')


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create users table if it doesn't exist."""
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                created_at TEXT NOT NULL,
                last_login_time TEXT,
                last_week_reset TEXT,
                profile_json TEXT
            )
        """)
        conn.commit()


def user_to_dict(row):
    """Convert DB row to user dict matching frontend format."""
    d = dict(row)
    profile = json.loads(d['profile_json'] or '{}')
    study_stats = profile.get('studyStats', {
        'totalHours': 0,
        'weeklyHours': [0, 0, 0, 0, 0, 0, 0],
        'sessionsCompleted': 0,
        'studyProgress': 0,
        'quizCompletions': {},
        'quizzesPassed': 0,
        'fieldProgress': {}
    })
    return {
        'id': d['id'],
        'email': d['email'],
        'password': d['password'],
        'firstName': d['first_name'],
        'lastName': d['last_name'],
        'role': d['role'],
        'createdAt': d['created_at'],
        'lastLoginTime': d['last_login_time'],
        'lastWeekReset': d['last_week_reset'],
        'studyStats': study_stats,
        **{k: v for k, v in profile.items() if k != 'studyStats'}
    }


def get_user_by_email(email):
    """Get user by email (case-insensitive)."""
    if not email:
        return None
    with get_connection() as conn:
        cur = conn.execute(
            "SELECT * FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))",
            (email.strip(),)
        )
        row = cur.fetchone()
        return user_to_dict(row) if row else None


def get_user_by_id(user_id):
    """Get user by id."""
    with get_connection() as conn:
        cur = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        return user_to_dict(row) if row else None


def create_user(user_data):
    """Insert new user. user_data must have: id, email, password, firstName, lastName, role, createdAt, studyStats."""
    profile = {k: v for k, v in user_data.items()
               if k not in ('id', 'email', 'password', 'firstName', 'lastName', 'role', 'createdAt', 'lastLoginTime', 'lastWeekReset', 'studyStats')}
    profile['studyStats'] = user_data.get('studyStats', {
        'totalHours': 0,
        'weeklyHours': [0, 0, 0, 0, 0, 0, 0],
        'sessionsCompleted': 0,
        'studyProgress': 0,
        'quizCompletions': {},
        'quizzesPassed': 0,
        'fieldProgress': {}
    })
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO users (id, email, password, first_name, last_name, role, created_at, profile_json)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                user_data['id'],
                user_data.get('email', '').strip(),
                user_data['password'],
                user_data.get('firstName', ''),
                user_data.get('lastName', ''),
                user_data.get('role', 'user'),
                user_data['createdAt'],
                json.dumps(profile)
            )
        )
        conn.commit()


def update_user(user_id, last_login_time=None, last_week_reset=None, profile_json=None):
    """Update user fields."""
    with get_connection() as conn:
        updates = []
        params = []
        if last_login_time is not None:
            updates.append("last_login_time = ?")
            params.append(last_login_time)
        if last_week_reset is not None:
            updates.append("last_week_reset = ?")
            params.append(last_week_reset)
        if profile_json is not None:
            updates.append("profile_json = ?")
            params.append(json.dumps(profile_json) if isinstance(profile_json, dict) else profile_json)
        if not updates:
            return
        params.append(user_id)
        conn.execute(
            f"UPDATE users SET {', '.join(updates)} WHERE id = ?",
            params
        )
        conn.commit()


def merge_user_profile(user_id, updates):
    """Merge updates into user's profile_json (e.g. studyStats)."""
    with get_connection() as conn:
        row = conn.execute("SELECT profile_json FROM users WHERE id = ?", (user_id,)).fetchone()
        if not row:
            return
        profile = json.loads(row[0] or '{}')
        for k, v in updates.items():
            if k == 'studyStats' and isinstance(v, dict):
                existing = profile.get('studyStats', {})
                for sk, sv in v.items():
                    if sk == 'fieldProgress' and isinstance(sv, dict):
                        fp = existing.get('fieldProgress', {})
                        fp.update(sv)
                        existing['fieldProgress'] = fp
                    else:
                        existing[sk] = sv
                profile['studyStats'] = existing
            else:
                profile[k] = v
        conn.execute(
            "UPDATE users SET profile_json = ? WHERE id = ?",
            (json.dumps(profile), user_id)
        )
        conn.commit()


def get_all_users():
    """Return all users (for admin)."""
    with get_connection() as conn:
        cur = conn.execute(
            "SELECT * FROM users ORDER BY created_at DESC"
        )
        return [user_to_dict(r) for r in cur.fetchall()]
