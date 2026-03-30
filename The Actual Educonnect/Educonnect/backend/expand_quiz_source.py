"""
Expand existing resource fields into longer, focused quiz_source_text.

Uses title, description, type, provider, difficulty, category to generate
richer content for quiz generation. No external API required.
"""

import re
from typing import Dict, Any, List

# Category -> additional concept phrases (expands content for better QG)
CATEGORY_CONCEPTS = {
    "ai": "Topics include search algorithms, heuristics, problem-solving, and intelligent systems.",
    "ml": "Key concepts: supervised learning, neural networks, optimization, and model evaluation.",
    "dl": "Covers deep learning, backpropagation, CNNs, RNNs, and neural network architectures.",
    "ds": "Includes data analysis, visualization, statistics, and machine learning with Python.",
    "nlp": "Natural language processing, tokenization, embeddings, transformers, and text analysis.",
    "cv": "Computer vision, image processing, object detection, and convolutional neural networks.",
    "cyber": "Network security, cryptography, ethical hacking, and security fundamentals.",
    "web": "Frontend and backend development, APIs, databases, and full-stack technologies.",
    "mobile": "Mobile app development, UI frameworks, and cross-platform development.",
    "law": "Legal principles, sources of law, and key concepts in the field.",
    "business": "Strategy, operations, marketing, finance, and business fundamentals.",
    "education": "Teaching methods, curriculum design, assessment, and learning theory.",
    "humanities": "Critical thinking, literature, philosophy, and cultural studies.",
    "health": "Healthcare fundamentals, patient care, ethics, and health systems.",
    "agriculture": "Sustainable farming, crop science, soil management, and agribusiness.",
}

TYPE_PHRASES = {
    "Course": "This course provides structured learning",
    "Tutorial": "This tutorial offers hands-on instruction",
    "Bootcamp": "This bootcamp delivers intensive training",
    "Specialization": "This specialization offers in-depth study",
    "Resource": "This resource provides educational content",
}

DIFFICULTY_PHRASES = {
    "Beginner": "Suitable for beginners with no prior experience.",
    "Intermediate": "Designed for learners with some foundational knowledge.",
    "Advanced": "For advanced learners seeking deeper expertise.",
}


def _extract_phrases(desc: str) -> List[str]:
    """Split description into meaningful phrases (by comma, period, 'and')."""
    if not desc:
        return []
    text = desc.replace(" and ", ", ").replace(". ", ", ")
    parts = re.split(r"[,.]", text)
    return [p.strip() for p in parts if len(p.strip()) > 10]


def _expand_phrases(phrases: List[str]) -> List[str]:
    """Turn phrases into fuller sentences for richer context."""
    out = []
    for i, p in enumerate(phrases[:5]):  # Use up to 5 phrases
        if i == 0:
            out.append(f"The content covers {p.lower()}.")
        else:
            out.append(f"You will learn about {p.lower()}.")
    return out


def expand_to_quiz_source_text(resource: Dict[str, Any]) -> str:
    """
    Generate quiz_source_text from existing resource fields.

    Combines: title, description, type, provider, difficulty, category concepts,
    and expanded phrases. Returns longer, more focused text for quiz generation.
    """
    title = (resource.get("title") or "").strip()
    desc = (resource.get("description") or "").strip()
    rtype = resource.get("type") or "Course"
    provider = resource.get("provider") or ""
    difficulty = resource.get("difficulty") or "Beginner"
    category = resource.get("category") or "general"

    parts = []

    # Intro sentence
    type_phrase = TYPE_PHRASES.get(rtype, TYPE_PHRASES["Course"])
    topic_name = category.replace("-", " ").replace("_", " ").title()
    parts.append(f"{title}. {type_phrase} on {topic_name}.")
    if provider:
        parts.append(f"Offered by {provider}.")

    # Main description
    if desc:
        parts.append(desc)

    # Difficulty
    diff_phrase = DIFFICULTY_PHRASES.get(difficulty)
    if diff_phrase:
        parts.append(diff_phrase)

    # Category-specific concepts
    cat_concepts = CATEGORY_CONCEPTS.get(category.lower())
    if cat_concepts:
        parts.append(cat_concepts)

    # Expanded phrases from description
    phrases = _extract_phrases(desc)
    expanded = _expand_phrases(phrases)
    for s in expanded:
        if s not in " ".join(parts):
            parts.append(s)

    return " ".join(parts).strip()


def add_quiz_source_to_resources(resources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Add quiz_source_text to each resource. Mutates in place and returns."""
    for r in resources:
        r["quiz_source_text"] = expand_to_quiz_source_text(r)
    return resources
