"""
Local Quiz Generator Pipeline
- Text input & preprocessing
- Keyword extraction (BERT-based via KeyBERT)
- AI-based question generation (T5 or template-based)
- Quiz output in EduConnect format

No external API required. Uses local transformer models (BERT/KeyBERT, T5).
Quizzes are generated from learning resources; resourceIds link to resource pages.
"""

import os
import re
import random
from typing import List, Dict, Optional, Tuple, Any

from qg_keyword_utils import keywords_for_context

# Lazy-loaded models
_t5_model = None
_t5_tokenizer = None
# Use Flan-T5 base (or fine-tuned from train_quiz_t5.py). Set QG_MODEL_PATH to load custom.
T5_MODEL_NAME = "google/flan-t5-base"
QG_MODEL_PATH = os.environ.get("QG_MODEL_PATH", "")  # Path to fine-tuned model from train_quiz_t5.py


def preprocess_text(text: str) -> str:
    """Clean and normalize input text."""
    if not text or not isinstance(text, str):
        return ""
    # Normalize whitespace
    text = re.sub(r"\s+", " ", text.strip())
    # Remove URLs
    text = re.sub(r"https?://\S+", "", text)
    # Remove extra punctuation runs
    text = re.sub(r"[.!?]+", ".", text)
    return text.strip()


def split_into_sentences(text: str) -> List[str]:
    """Split text into sentences."""
    if not text:
        return []
    # Simple sentence split on . ! ?
    parts = re.split(r"(?<=[.!?])\s+", text)
    return [p.strip() for p in parts if len(p.strip()) > 15]


def extract_keywords_keybert(text: str, top_n: int = 15) -> List[Tuple[str, float]]:
    """KeyBERT + MMR and junk filtering (shared with dataset builder)."""
    return keywords_for_context(text, top_n=top_n)


def extract_keywords_fallback(text: str, top_n: int = 15) -> List[Tuple[str, float]]:
    """Same pipeline as KeyBERT path (includes frequency fallback inside)."""
    return keywords_for_context(text, top_n=top_n)


def generate_question_t5(context: str, answer: str) -> Optional[str]:
    """Generate a question using T5/Flan-T5 model (context + answer span)."""
    try:
        from transformers import T5ForConditionalGeneration, AutoTokenizer
        global _t5_model, _t5_tokenizer
        model_name = QG_MODEL_PATH if QG_MODEL_PATH else T5_MODEL_NAME
        if _t5_model is None:
            _t5_tokenizer = AutoTokenizer.from_pretrained(model_name)
            _t5_model = T5ForConditionalGeneration.from_pretrained(model_name)
            _t5_model.eval()
        # Flan-T5 prompt: highlight answer in context for focused question
        highlighted = context.replace(answer, f"<hl> {answer} </hl>", 1) if answer in context else context
        input_text = f"generate question: {highlighted}"
        inputs = _t5_tokenizer(input_text, return_tensors="pt", max_length=512, truncation=True)
        outputs = _t5_model.generate(
            **inputs,
            max_length=64,
            num_beams=4,
            no_repeat_ngram_size=2,
            repetition_penalty=1.15,
        )
        q = _t5_tokenizer.decode(outputs[0], skip_special_tokens=True).strip()
        return q if q and len(q) > 10 else None
    except Exception as e:
        print(f"[QuizGenerator] T5 QG failed: {e}")
        return None


def generate_questions_template(
    text: str,
    keywords: List[Tuple[str, float]],
    num_questions: int = 20,
    field_name: str = ""
) -> List[Dict]:
    """Generate multiple-choice questions using templates and keywords."""
    sentences = split_into_sentences(text)
    if not keywords and not sentences:
        return []
    kw_list = [k[0] for k in keywords[:30]] if keywords else []
    # Build term->context mapping from sentences
    term_context = {}
    for s in sentences:
        for kw in kw_list:
            if kw.lower() in s.lower():
                term_context[kw] = s[:150]
                break
    questions = []
    used_terms = set()
    # Two placeholders each: (term or phrase, field / subject name)
    label = field_name or "this subject"
    templates = [
        ("What does the term {} refer to when studying {}?", "concept"),
        ("Which concept is best captured by {} when studying {}?", "concept"),
        ("According to this material, what does {} refer to within {}?", "concept"),
        ("How does {} connect to the subject of {}?", "concept"),
        ("What should a learner take away about {} in {}?", "concept"),
    ]
    for i in range(num_questions):
        if not kw_list:
            break
        term = None
        for k in kw_list:
            if k not in used_terms and len(k) > 2:
                term = k
                used_terms.add(term)
                break
        if not term:
            term = random.choice(kw_list)
        tpl, _ = random.choice(templates)
        question_text = tpl.format(term, label).replace("  ", " ")
        # Correct option: use sentence containing term or term itself
        correct = term_context.get(term, term)
        if len(correct) > 80:
            correct = correct[:77] + "..."
        # Distractors: other keywords or generic wrong answers
        others = [k for k in kw_list if k != term][:5]
        distractors = [k for k in others if len(k) > 2][:3]
        if len(distractors) < 3:
            distractors.extend(["None of the above", "All of the above", "Not applicable"][:3 - len(distractors)])
        options = [correct] + distractors[:3]
        random.shuffle(options)
        correct_idx = options.index(correct)
        questions.append({
            "id": f"q{i + 1}",
            "question": question_text,
            "options": options[:4],
            "correct": correct_idx
        })
    return questions


def generate_questions_hybrid(
    text: str,
    num_questions: int = 20,
    field_name: str = "",
    use_t5: bool = True
) -> List[Dict]:
    """
    Full pipeline: preprocess -> keyword extraction -> question generation.
    use_t5: try T5 for each question (slower, needs model download).
    """
    text = preprocess_text(text)
    if len(text) < 50:
        return []
    keywords = keywords_for_context(text, top_n=30)
    if not keywords:
        return []
    sentences = split_into_sentences(text)
    questions = []
    if use_t5 and sentences and keywords:
        for i, (kw, _) in enumerate(keywords[:num_questions]):
            if i >= num_questions:
                break
            ctx = next((s for s in sentences if kw.lower() in s.lower()), sentences[0] if sentences else "")
            if len(ctx) < 20:
                continue
            q_text = generate_question_t5(ctx[:400], kw)
            if q_text:
                correct = kw
                others = [k for k, _ in keywords if k != kw][:3]
                options = [correct] + others[:3]
                while len(options) < 4:
                    options.append(f"Option {len(options) + 1}")
                random.shuffle(options)
                correct_idx = options.index(correct)
                questions.append({
                    "id": f"q{i + 1}",
                    "question": q_text,
                    "options": options[:4],
                    "correct": correct_idx
                })
    if len(questions) < num_questions:
        template_qs = generate_questions_template(text, keywords, num_questions - len(questions), field_name)
        for j, tq in enumerate(template_qs):
            tq["id"] = f"q{len(questions) + j + 1}"
            questions.append(tq)
    return questions[:num_questions]


def build_text_from_resources(resources: List[Dict[str, Any]]) -> str:
    """Build content text from learning resources.
    Uses quiz_source_text when available (longer, focused), else title + description."""
    if not resources:
        return ""
    parts = []
    for r in resources:
        quiz_src = r.get("quiz_source_text")
        if quiz_src:
            parts.append(quiz_src.strip())
        else:
            title = r.get("title") or ""
            desc = r.get("description") or ""
            if title or desc:
                parts.append(f"Title: {title}. {desc}".strip())
    return "\n\n".join(parts)


def _normalize_question(q: Dict, prefix: str, idx: int) -> Dict:
    """Ensure question has id, 4 options, correct index 0-3."""
    return {
        "id": q.get("id") or f"{prefix}{idx + 1}",
        "question": str(q.get("question") or "").strip() or f"Question {idx + 1}",
        "options": (q.get("options") or [])[:4] if isinstance(q.get("options"), list) else ["A", "B", "C", "D"],
        "correct": max(0, min(3, int(q.get("correct", 0)) if isinstance(q.get("correct"), (int, float)) else 0))
    }


def _ensure_four_options(questions: List[Dict], keywords: List[Tuple[str, float]]) -> None:
    """Ensure each question has exactly 4 options."""
    kw_list = [k[0] for k in keywords] if keywords else []
    for q in questions:
        opts = q.get("options") or []
        if len(opts) < 4:
            while len(opts) < 4:
                opts.append(f"Option {len(opts) + 1}")
            q["options"] = opts[:4]
        correct_idx = q.get("correct", 0)
        if correct_idx >= len(q["options"]):
            q["correct"] = 0


def generate_quiz_from_text(
    text: str,
    field_id: str,
    field_name: str,
    num_quizzes: int = 3,
    questions_per_quiz: int = 20,
    num_final_questions: int = 30,
    resource_ids: Optional[List[int]] = None,
    use_t5: bool = True
) -> Dict:
    """
    Generate full learning field: multiple quizzes + final test.
    Returns format compatible with generatedQuizzes.json.
    resource_ids: IDs of learning resources (for linking to resource pages).
    """
    text = preprocess_text(text)
    if not text:
        return {"error": "No valid text content to generate from."}
    resource_ids = resource_ids or []
    chunks = []
    sentences = split_into_sentences(text)
    chunk_size = max(3, len(sentences) // num_quizzes)
    for i in range(0, len(sentences), chunk_size):
        chunks.append(" ".join(sentences[i:i + chunk_size]))
    while len(chunks) < num_quizzes:
        chunks.append(text[:1500])
    quizzes = []
    for order, chunk in enumerate(chunks[:num_quizzes], 1):
        qs = generate_questions_hybrid(chunk, num_questions=questions_per_quiz, field_name=field_name, use_t5=use_t5)
        if qs:
            keywords = extract_keywords_keybert(chunk, top_n=30) or extract_keywords_fallback(chunk, top_n=30)
            _ensure_four_options(qs, keywords)
            normalized = [_normalize_question(q, "q", i) for i, q in enumerate(qs)]
            quizzes.append({
                "id": f"{field_id}-{order}",
                "order": order,
                "title": f"{field_name} Quiz {order}: Key concepts",
                "isFinal": False,
                "questions": normalized
            })
    final_chunk = text if len(text) > 500 else " ".join(sentences[-10:]) if sentences else text
    final_qs = generate_questions_hybrid(final_chunk, num_questions=num_final_questions, field_name=field_name, use_t5=use_t5)
    final_test = None
    if final_qs:
        keywords = keywords_for_context(final_chunk, top_n=30)
        _ensure_four_options(final_qs, keywords)
        normalized = [_normalize_question(q, "f", i) for i, q in enumerate(final_qs)]
        final_test = {
            "id": f"{field_id}-final",
            "title": f"{field_name} Final Assessment",
            "isFinal": True,
            "questions": normalized
        }
    return {
        "id": field_id,
        "name": field_name,
        "description": f"Quizzes generated from learning resources (local AI: KeyBERT + T5, no API).",
        "resourceIds": resource_ids,
        "quizzes": quizzes,
        "finalTest": final_test
    }


def generate_from_resources(
    resources: List[Dict[str, Any]],
    field_id: str,
    field_name: str,
    num_quizzes: int = 3,
    questions_per_quiz: int = 20,
    num_final_questions: int = 30,
    use_t5: bool = True
) -> Dict:
    """
    Generate quizzes from learning resources. Resources include links to external pages.
    Returns field object compatible with generatedQuizzes.json.
    """
    text = build_text_from_resources(resources)
    resource_ids = [r.get("id") for r in resources if r.get("id") is not None]
    return generate_quiz_from_text(
        text=text,
        field_id=field_id,
        field_name=field_name,
        num_quizzes=num_quizzes,
        questions_per_quiz=questions_per_quiz,
        num_final_questions=num_final_questions,
        resource_ids=resource_ids,
        use_t5=use_t5
    )
