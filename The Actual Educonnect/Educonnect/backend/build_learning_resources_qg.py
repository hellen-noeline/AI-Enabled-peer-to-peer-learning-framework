"""
Build QG training data from learning resources.

Context is quiz_source_text when available (expanded in expand_quiz_source.py);
otherwise Title + description. Format: context + <hl> answer </hl> -> question.

Uses KeyBERT (when available) with MMR for diverse keyphrases; see qg_keyword_utils.py.
All templates take two slots: (answer_span, category_label).

Re-run after changing resources to refresh data/learning_resources_qg.json.
"""

import json
import random
from pathlib import Path
from typing import List, Tuple

from load_learning_resources import get_learning_resources
from qg_keyword_utils import pick_keyword_strings

# Every template must contain exactly two "{}" — (answer span, category title).
TEMPLATES = [
    "What does the term {} refer to when studying {}?",
    "Which concept is best captured by {} when studying {}?",
    "According to this material, what does {} refer to within {}?",
    "How does {} connect to the subject of {}?",
    "What should a learner take away about {} in {}?",
]


def build_qg_pairs(resources: List[dict], max_per_resource: int = 5) -> List[Tuple[str, str, str, str]]:
    """Build (context, answer, question, category) rows for QG training.
    Prefers quiz_source_text when present; otherwise Title + description."""
    pairs = []
    max_context_len = 2000
    rng = random.Random(42)

    for r in resources:
        category = r.get("category", "general")
        quiz_src = (r.get("quiz_source_text") or "").strip()
        if quiz_src:
            context = quiz_src
        else:
            title = r.get("title", "")
            desc = r.get("description", "")
            context = f"Title: {title}. {desc}".strip()
        if len(context) < 30:
            continue

        cat_title = category.replace("-", " ").title()
        keywords = pick_keyword_strings(context, pool=max_per_resource + 8)
        used = set()
        for kw in keywords:
            if kw.lower() in used:
                continue
            used.add(kw.lower())
            tpl = rng.choice(TEMPLATES)
            question = tpl.format(kw, cat_title)
            pairs.append((context[:max_context_len], kw, question, category))
            if len(used) >= max_per_resource:
                break
    return pairs


def main():
    resources = get_learning_resources(enrich_quiz_source=True)
    pairs = build_qg_pairs(resources, max_per_resource=5)
    print(f"Built {len(pairs)} QG pairs from {len(resources)} resources")
    out_dir = Path(__file__).resolve().parent / "data"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "learning_resources_qg.json"
    data = [{"context": c, "answer": a, "question": q, "category": cat} for c, a, q, cat in pairs]
    out_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"Saved to {out_path}")


if __name__ == "__main__":
    main()
