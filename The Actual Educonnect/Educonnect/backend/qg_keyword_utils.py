"""
Shared keyword / keyphrase extraction for QG and live quiz generation.

KeyBERT + MMR, junk filtering, preference for multi-word phrases — used by
build_learning_resources_qg.py and quiz_generator.py.
"""

import re
from typing import List, Tuple

MIN_TOKEN_LEN = 4

_BAD_ANSWER_WORDS = frozenset({
    "the", "and", "for", "are", "was", "were", "been", "being", "have", "has", "had",
    "but", "not", "you", "all", "can", "her", "his", "our", "out", "its", "may", "new",
    "now", "old", "see", "way", "who", "boy", "did", "get", "use", "man", "day", "two",
    "how", "also", "each", "which", "their", "time", "will", "said", "made",
    "many", "some", "most", "more", "such", "very", "just", "like", "into", "than",
    "then", "them", "well", "only", "come", "over", "back", "after", "first",
    "both", "year", "work", "even", "here", "where", "much", "before", "through",
    "between", "under", "while", "those", "these", "other", "another", "several",
    "course", "covering", "cover", "learn", "learning", "introduction", "comprehensive",
    "popular", "master", "complete", "advanced", "basic", "fundamentals",
    "build", "building", "using", "making", "solving", "given", "based",
})

_keybert_model = None


def _stopwords() -> set:
    return {
        "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "will", "would", "could",
        "should", "may", "might", "must", "can", "to", "of", "in", "for",
        "on", "with", "at", "by", "from", "as", "into", "through", "during",
    } | _BAD_ANSWER_WORDS


def _simple_tokenize(text: str) -> List[str]:
    return re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())


def is_good_answer_span(answer: str, context: str) -> bool:
    """Reject junk spans; require verbatim occurrence in context (case-insensitive)."""
    a = answer.strip()
    if len(a) < 3:
        return False
    if a.lower() not in context.lower():
        return False
    parts = a.lower().split()
    if len(parts) == 1:
        w = parts[0]
        if len(w) < MIN_TOKEN_LEN:
            return False
        if w in _BAD_ANSWER_WORDS:
            return False
    else:
        for w in parts:
            if len(w) >= MIN_TOKEN_LEN and w in _BAD_ANSWER_WORDS:
                return False
    return True


def filter_scored_keywords(
    keywords: List[Tuple[str, float]], context: str
) -> List[Tuple[str, float]]:
    """Deduplicate, filter junk, rank: multi-word phrases first, then longer, then score."""
    seen = set()
    out: List[Tuple[str, float]] = []
    for kw, score in keywords:
        k = kw.strip()
        if not k or k.lower() in seen:
            continue
        if not is_good_answer_span(k, context):
            continue
        seen.add(k.lower())
        out.append((k, score))
    out.sort(key=lambda x: (0 if " " in x[0] else 1, -len(x[0]), -x[1]))
    return out


def extract_keyphrases_keybert_mmr(text: str, top_n: int = 30) -> List[Tuple[str, float]]:
    """KeyBERT with MMR; returns (phrase, score). Empty on failure."""
    global _keybert_model
    if not text or len(text.strip()) < 10:
        return []
    try:
        from keybert import KeyBERT
        if _keybert_model is None:
            _keybert_model = KeyBERT()
        raw = _keybert_model.extract_keywords(
            text,
            keyphrase_ngram_range=(1, 2),
            stop_words="english",
            use_mmr=True,
            diversity=0.45,
            top_n=max(top_n, 15),
        )
        return [(p[0].strip(), float(p[1])) for p in raw] if raw else []
    except Exception:
        return []


def extract_keywords_fallback_scored(text: str, top_n: int = 30) -> List[Tuple[str, float]]:
    """Frequency-based keywords with strict filtering."""
    words = _simple_tokenize(text)
    stop = _stopwords()
    freq = {}
    for w in words:
        if w in stop or len(w) < MIN_TOKEN_LEN:
            continue
        freq[w] = freq.get(w, 0) + 1
    ranked = sorted(freq.items(), key=lambda x: -x[1])[:top_n]
    if not ranked:
        return []
    mx = max(c for _, c in ranked)
    return [(w, c / mx) for w, c in ranked]


def keywords_for_context(text: str, top_n: int = 30) -> List[Tuple[str, float]]:
    """KeyBERT + MMR, else fallback; then filter and rank. Main entry for quiz_generator."""
    pool = max(top_n * 2, 40)
    pairs = extract_keyphrases_keybert_mmr(text, top_n=pool)
    if not pairs:
        pairs = extract_keywords_fallback_scored(text, top_n=pool)
    filtered = filter_scored_keywords(pairs, text)
    if not filtered and pairs:
        # Last resort: use top scored phrases that appear in text (avoid empty quizzes)
        for k, s in pairs:
            k = k.strip()
            if len(k) >= 3 and k.lower() in text.lower():
                filtered.append((k, s))
            if len(filtered) >= top_n:
                break
    return filtered[:top_n]


def pick_keyword_strings(context: str, pool: int) -> List[str]:
    """Ordered keyword strings for dataset builder (max pool items)."""
    scored = keywords_for_context(context, top_n=max(pool, 20))
    return [k for k, _ in scored[:pool]]
