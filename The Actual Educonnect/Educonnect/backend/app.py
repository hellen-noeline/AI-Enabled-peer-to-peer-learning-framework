"""
BERTopic API + User database for EduConnect.
Run: python app.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from bertopic import BERTopic
from sentence_transformers import SentenceTransformer

from database import init_db, get_user_by_email, get_all_users, create_user, update_user, get_user_by_id, merge_user_profile

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

# Emails that have admin role
ADMIN_EMAILS = ['admin@educonnect.com']

##
def is_admin_email(email):
    if not email:
        return False
    return any(e.lower().strip() == str(email).lower().strip() for e in ADMIN_EMAILS)


def require_admin():
    """Check X-User-Email header is an admin. Returns (ok, error_response)."""
    email = request.headers.get('X-User-Email', '').strip()
    if not email:
        return False, (jsonify({"error": "Missing X-User-Email header"}), 401)
    if not is_admin_email(email):
        return False, (jsonify({"error": "Unauthorized: admin only"}), 403)
    return True, None

# Lazy-load model (DistilBERT embeddings for BERTopic)
_model = None
_topic_model = None


def get_topic_model():
    global _model, _topic_model
    if _topic_model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        _topic_model = BERTopic(embedding_model=_model, min_topic_size=2, nr_topics="auto")
    return _topic_model


@app.route("/api/topics", methods=["POST"])
def get_topics():
    """Extract topics from documents using BERTopic."""
    data = request.get_json()
    documents = data.get("documents", [])

    if not documents or len(documents) < 2:
        return jsonify({"topics": [], "topic_info": [], "error": "Need at least 2 documents"}), 400

    try:
        topic_model = get_topic_model()
        topics, probs = topic_model.fit_transform(documents)

        topic_info = topic_model.get_topic_info()
        result_topics = []
        for _, row in topic_info.iterrows():
            if row["Topic"] != -1:
                topic_words = topic_model.get_topic(int(row["Topic"]))
                words = [w[0] for w in (topic_words or [])]
                result_topics.append({
                    "topic_id": int(row["Topic"]),
                    "count": int(row["Count"]),
                    "name": row.get("Name", ""),
                    "keywords": words[:10],
                })

        doc_topics = [
            {"document": doc[:100], "topic_id": int(t) if t is not None else -1}
            for doc, t in zip(documents, topics)
        ]

        return jsonify({
            "topics": result_topics,
            "document_topics": doc_topics,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


# --- Auth & Users ---
init_db()


@app.route("/api/auth/signup", methods=["POST"])
def api_signup():
    """Register a new user. Body: { firstName, lastName, email, password, ...profile }"""
    data = request.get_json() or {}
    email = (data.get("email") or "").strip()
    password = data.get("password")
    first_name = data.get("firstName", "").strip()
    last_name = data.get("lastName", "").strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    if not first_name or not last_name:
        return jsonify({"error": "First name and last name are required"}), 400

    existing = get_user_by_email(email)
    if existing:
        return jsonify({"error": "An account with this email already exists. Please sign in instead."}), 409

    import time
    user_id = str(int(time.time() * 1000))
    role = "admin" if is_admin_email(email) else "user"
    from datetime import datetime
    created_at = datetime.utcnow().isoformat() + "Z"

    study_stats = {
        "totalHours": 0,
        "weeklyHours": [0, 0, 0, 0, 0, 0, 0],
        "sessionsCompleted": 0,
        "studyProgress": 0,
        "quizCompletions": {},
        "quizzesPassed": 0,
        "fieldProgress": {}
    }

    user_data = {
        "id": user_id,
        "email": email,
        "password": password,
        "firstName": first_name,
        "lastName": last_name,
        "role": role,
        "createdAt": created_at,
        "studyStats": study_stats,
        **{k: v for k, v in data.items() if k not in ("email", "password", "firstName", "lastName", "confirmPassword")}
    }
    if "confirmPassword" in user_data:
        del user_data["confirmPassword"]

    create_user(user_data)

    # Return user without password for client (client stores password for now for login check - optional to remove)
    out = {**user_data}
    return jsonify({"user": out}), 201


@app.route("/api/auth/login", methods=["POST"])
def api_login():
    """Login. Body: { email, password }"""
    data = request.get_json() or {}
    email = (data.get("email") or "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = get_user_by_email(email)
    if not user:
        return jsonify({"error": "No account found with this email. Please sign up first."}), 404
    if user.get("password") != password:
        return jsonify({"error": "Incorrect password. Please try again."}), 401

    from datetime import datetime
    update_user(user["id"], last_login_time=datetime.utcnow().isoformat() + "Z")
    user["lastLoginTime"] = datetime.utcnow().isoformat() + "Z"

    return jsonify({"user": user})


@app.route("/api/admin/users", methods=["GET"])
def api_admin_users():
    """List all registered users. Requires X-User-Email header with admin email."""
    ok, err = require_admin()
    if not ok:
        return err

    users = get_all_users()
    # Remove passwords from response
    out = [{k: v for k, v in u.items() if k != "password"} for u in users]
    return jsonify({"users": out})


@app.route("/api/users/<user_id>", methods=["GET"])
def api_get_user(user_id):
    """Get a single user by id (for profile/sync)."""
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    out = {k: v for k, v in user.items() if k != "password"}
    return jsonify({"user": out})


@app.route("/api/users/<user_id>", methods=["PATCH"])
def api_patch_user(user_id):
    """Update user profile (studyStats, etc). Body: { studyStats: {...} }"""
    data = request.get_json() or {}
    if not data:
        return jsonify({"error": "No updates provided"}), 400
    try:
        merge_user_profile(user_id, data)
        user = get_user_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        out = {k: v for k, v in user.items() if k != "password"}
        return jsonify({"user": out})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

#

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
