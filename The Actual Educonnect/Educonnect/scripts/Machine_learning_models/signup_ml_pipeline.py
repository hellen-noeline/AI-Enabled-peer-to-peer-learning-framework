#!/usr/bin/env python3
"""
Simple ML-ish pipeline to keep EduConnect updated with new information from:

- Registered users (users table in server/educonnect.db)
- Signup suggestions (signup_suggestions table we use to grow dropdown options)

What it does
------------
- Connects to the existing SQLite DB used by the Node.js server.
- Reads users + signup_suggestions.
- Parses key fields (degree_program, cs_interests, skills, topics, hobbies, etc.).
- Aggregates counts and simple trend summaries.
- Writes a JSON snapshot:

    public/signup_trends.json

You can then:
- Use this JSON in the frontend (admin dashboard, recommendations tuning).
- Extend this script into a full ML pipeline (e.g. train/update models periodically).

Run manually from the Educonnect root:

    cd The Actual Educonnect/Educonnect
    python scripts/signup_ml_pipeline.py
"""

import json
import sqlite3
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, List, Any


BASE_DIR = Path(__file__).resolve().parents[1]
DB_PATH = BASE_DIR / "server" / "educonnect.db"
OUTPUT_PATH = BASE_DIR / "public" / "signup_trends.json"


def split_multi_value(s: str) -> List[str]:
    if not s:
        return []
    parts = [p.strip() for p in s.split(",")]
    return [p for p in parts if p and p.lower() not in {"none", "n/a"}]


def fetch_rows(conn: sqlite3.Connection, query: str, params: tuple = ()) -> List[sqlite3.Row]:
    cur = conn.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    return rows


def build_trends() -> Dict[str, Any]:
    if not DB_PATH.exists():
        raise FileNotFoundError(f"{DB_PATH} not found. Make sure the server has been started at least once.")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    try:
        users = fetch_rows(conn, "SELECT * FROM users")
    except sqlite3.Error as e:
        conn.close()
        raise RuntimeError(f"Failed to read users from DB: {e}") from e

    # Try to read signup_suggestions table if present
    suggestions: List[sqlite3.Row] = []
    try:
        suggestions = fetch_rows(conn, "SELECT field_name, value, use_count FROM signup_suggestions")
    except sqlite3.Error:
        # Table might not exist yet; that's fine.
        suggestions = []

    conn.close()

    # Counters for key dimensions
    counts_single = {
        "university": Counter(),
        "degreeProgram": Counter(),
        "nationality": Counter(),
        "countryOfResidence": Counter(),
        "preferredLearningStyle": Counter(),
        "studyPartnersPreferences": Counter(),
        "preferredStudyHours": Counter(),
    }

    counts_multi = {
        "csInterests": Counter(),
        "technicalSkills": Counter(),
        "strongTopics": Counter(),
        "weakTopics": Counter(),
        "softSkills": Counter(),
        "researchInterests": Counter(),
        "professionalInterests": Counter(),
        "hobbies": Counter(),
    }

    # Aggregate from registered users
    for row in users:
        # Single-value fields
        for field, col in [
            ("university", "university"),
            ("degreeProgram", "degree_program"),
            ("nationality", "nationality"),
            ("countryOfResidence", "country_of_residence"),
            ("preferredLearningStyle", "preferred_learning_style"),
            ("studyPartnersPreferences", "study_partners_preferences"),
            ("preferredStudyHours", "preferred_study_hours"),
        ]:
            val = (row[col] or "").strip() if col in row.keys() and row[col] is not None else ""
            if val:
                counts_single[field][val] += 1

        # Multi-value (comma-separated) fields
        for field, col in [
            ("csInterests", "cs_interests"),
            ("technicalSkills", "technical_skills"),
            ("strongTopics", "strong_topics"),
            ("weakTopics", "weak_topics"),
            ("softSkills", "soft_skills"),
            ("researchInterests", "research_interests"),
            ("professionalInterests", "professional_interests"),
            ("hobbies", "hobbies"),
        ]:
            raw = row[col] if col in row.keys() else ""
            for item in split_multi_value(raw or ""):
                counts_multi[field][item] += 1

    # Aggregate from suggestions (these represent future / long tail interests)
    suggestion_totals: Dict[str, Counter] = defaultdict(Counter)
    for row in suggestions:
        field_name = (row["field_name"] or "").strip()
        value = (row["value"] or "").strip()
        use_count = int(row["use_count"] or 1)
        if not field_name or not value:
            continue
        suggestion_totals[field_name][value] += use_count

    # Build summary JSON
    def top_list(counter: Counter, n: int = 30) -> List[Dict[str, Any]]:
        return [{"value": v, "count": int(c)} for v, c in counter.most_common(n)]

    summary: Dict[str, Any] = {
        "meta": {
            "source": "educonnect.db",
            "users_count": len(users),
            "suggestions_count": sum(int(r["use_count"] or 1) for r in suggestions),
        },
        "single_value": {},
        "multi_value": {},
        "suggestions": {},
    }

    for field, counter in counts_single.items():
        summary["single_value"][field] = {
            "top": top_list(counter),
            "unique": len(counter),
        }

    for field, counter in counts_multi.items():
        summary["multi_value"][field] = {
            "top": top_list(counter),
            "unique": len(counter),
        }

    for field, counter in suggestion_totals.items():
        summary["suggestions"][field] = {
            "top": top_list(counter),
            "unique": len(counter),
        }

    return summary


def main() -> None:
    trends = build_trends()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(trends, f, indent=2, ensure_ascii=False)
    print(f"Wrote signup trends to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

