"""Load learning resources from server or local JSON. Used by train/eval scripts."""
import json
import re
from pathlib import Path

BASE = Path(__file__).resolve().parent
LOCAL_JSON = BASE / "data" / "learning_resources.json"
SERVER_JS = BASE.parent / "server" / "data" / "learningResources.js"


def _parse_js_object(s: str) -> dict:
    """Simple parser for { id: 1, title: 'x', description: 'y' } style."""
    out = {}
    # Match key: value pairs
    for m in re.finditer(r"(\w+):\s*'([^']*)'", s):
        out[m.group(1)] = m.group(2)
    for m in re.finditer(r"(\w+):\s*(\d+\.?\d*)", s):
        k, v = m.group(1), m.group(2)
        if k == "id":
            out[k] = int(float(v))
        elif v.isdigit():
            out[k] = int(v)
        else:
            out[k] = float(v)
    return out


def load_from_server_js() -> list:
    """Parse learningResources.js and extract id, title, category, description, type, provider, difficulty."""
    if not SERVER_JS.exists():
        return []
    text = SERVER_JS.read_text(encoding="utf-8")
    out = []
    # Match each object - extract key fields
    for m in re.finditer(
        r"\{\s*id:\s*(\d+).*?title:\s*'([^']*)'.*?category:\s*'([^']*)'.*?type:\s*'([^']*)'.*?provider:\s*'([^']*)'.*?description:\s*'([^']*)'.*?difficulty:\s*'([^']*)'",
        text, re.DOTALL
    ):
        out.append({
            "id": int(m.group(1)),
            "title": m.group(2),
            "category": m.group(3),
            "type": m.group(4),
            "provider": m.group(5),
            "description": m.group(6),
            "difficulty": m.group(7),
        })
    if not out:
        # Fallback: minimal fields only
        for m in re.finditer(r"\{\s*id:\s*(\d+)[^}]*title:\s*'([^']*)'[^}]*category:\s*'([^']*)'[^}]*description:\s*'([^']*)'", text):
            out.append({
                "id": int(m.group(1)), "title": m.group(2), "category": m.group(3),
                "description": m.group(4), "type": "Course", "provider": "", "difficulty": "Beginner"
            })
    return out


def load_from_json() -> list:
    """Load from backend/data/learning_resources.json."""
    if not LOCAL_JSON.exists():
        return []
    return json.loads(LOCAL_JSON.read_text(encoding="utf-8"))


def get_learning_resources(enrich_quiz_source: bool = True) -> list:
    """Return learning resources, preferring server JS then local JSON.
    When enrich_quiz_source=True, adds quiz_source_text (expanded from existing fields)."""
    data = load_from_server_js()
    if not data:
        data = load_from_json()
    if enrich_quiz_source and data:
        from expand_quiz_source import add_quiz_source_to_resources
        data = add_quiz_source_to_resources(data)
    return data
