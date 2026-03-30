"""
Evaluate Question Generation model with metrics and visualizations.

Supports: --source squad | learning_resources
Outputs: data/eval_results.png (bar chart), data/eval_metrics.json

Optional: --compare to plot base vs fine-tuned model side by side.
"""

import argparse
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
MODEL_NAME = "google/flan-t5-base"
DEFAULT_MODEL = BASE_DIR / "models" / "quiz_qg_flant5"
OUTPUT_DIR = BASE_DIR / "data"


def compute_bleu(preds, refs):
    from nltk.translate.bleu_score import corpus_bleu
    refs_tokenized = [[r.lower().split()] for r in refs]
    preds_tokenized = [p.lower().split() for p in preds]
    return corpus_bleu(refs_tokenized, preds_tokenized)


def compute_rouge(preds, refs):
    try:
        from rouge_score import rouge_scorer
    except ImportError:
        return {"rougeL_fmeasure": 0.0}
    scorer = rouge_scorer.RougeScorer(["rougeL"], use_stemmer=True)
    scores = [scorer.score(r, p)["rougeL"].fmeasure for r, p in zip(refs, preds)]
    return {"rougeL_fmeasure": sum(scores) / len(scores) if scores else 0.0}


def compute_meteor(preds, refs):
    try:
        from nltk.translate.meteor_score import meteor_score
        import nltk
        try:
            nltk.data.find("corpora/wordnet")
        except LookupError:
            nltk.download("wordnet", quiet=True)
        scores = [meteor_score([r.lower().split()], p.lower().split()) for r, p in zip(refs, preds)]
        return sum(scores) / len(scores) if scores else 0.0
    except Exception:
        return 0.0


def load_squad_val(max_samples=500):
    from datasets import load_dataset
    ds = load_dataset("squad_v2", split="validation")
    contexts, answers, questions = [], [], []
    seen = set()
    for ex in ds:
        context = ex["context"]
        for qa in ex["qas"]:
            ans = qa["answers"]
            if not ans or ans[0]["text"] is None:
                continue
            answer = ans[0]["text"].strip()
            if answer not in context or len(answer) < 2:
                continue
            key = (context[:80], answer)
            if key in seen:
                continue
            seen.add(key)
            contexts.append(context)
            answers.append(answer)
            questions.append(qa["question"])
            if len(questions) >= max_samples:
                return contexts, answers, questions
    return contexts, answers, questions


def load_learning_resources_qg(max_samples=None):
    """Load QG test data from learning resources."""
    qg_path = BASE_DIR / "data" / "learning_resources_qg.json"
    if not qg_path.exists():
        from build_learning_resources_qg import build_qg_pairs
        from load_learning_resources import get_learning_resources
        resources = get_learning_resources(enrich_quiz_source=True)
        pairs = build_qg_pairs(resources, max_per_resource=5)
        data = [{"context": c, "answer": a, "question": q, "category": cat} for c, a, q, cat in pairs]
        qg_path.parent.mkdir(parents=True, exist_ok=True)
        qg_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    else:
        data = json.loads(qg_path.read_text(encoding="utf-8"))

    contexts, answers, questions = [], [], []
    for item in data:
        ctx, ans, q = item["context"], item["answer"], item["question"]
        if ans not in ctx:
            continue
        contexts.append(ctx)
        answers.append(ans)
        questions.append(q)
        if max_samples and len(contexts) >= max_samples:
            break
    return contexts, answers, questions


def plot_metrics(metrics: dict, output_path: Path, title: str = "Question Generation Evaluation Metrics"):
    """Create bar chart of evaluation metrics."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    names = list(metrics.keys())
    values = [round(metrics[k], 4) for k in names]
    colors = ["#4ECDC4", "#FF6B35", "#10B981", "#FFD93D"][: len(names)]

    fig, ax = plt.subplots(figsize=(8, 5))
    bars = ax.bar(names, values, color=colors, edgecolor="white", linewidth=1.2)
    ax.set_ylabel("Score", fontsize=12)
    ax.set_title(title, fontsize=14)
    ax.set_ylim(0, 1)
    for bar, v in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.02,
                f"{v:.3f}", ha="center", fontsize=11)
    plt.tight_layout()
    plt.savefig(output_path, dpi=150)
    plt.close()
    print(f"Saved chart to {output_path}")


def plot_compare(base_metrics: dict, ft_metrics: dict, output_path: Path):
    """Create grouped bar chart comparing base vs fine-tuned model."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    metrics = list(base_metrics.keys())
    base_vals = [round(base_metrics.get(m, 0), 4) for m in metrics]
    ft_vals = [round(ft_metrics.get(m, 0), 4) for m in metrics]
    x = range(len(metrics))
    w = 0.35
    fig, ax = plt.subplots(figsize=(9, 5))
    ax.bar([i - w/2 for i in x], base_vals, w, label="Flan-T5 Base", color="#94A3B8")
    ax.bar([i + w/2 for i in x], ft_vals, w, label="Fine-tuned (Learning Resources)", color="#4ECDC4")
    ax.set_xticks(x)
    ax.set_xticklabels(metrics)
    ax.set_ylabel("Score", fontsize=12)
    ax.set_title("Base vs Fine-tuned Model on Learning Resources", fontsize=14)
    ax.set_ylim(0, 1)
    ax.legend()
    plt.tight_layout()
    plt.savefig(output_path, dpi=150)
    plt.close()
    print(f"Saved comparison chart to {output_path}")


def eval_model(model_path: str, contexts, answers, refs, args) -> tuple:
    """Run evaluation and return (preds, metrics)."""
    import torch
    from transformers import T5ForConditionalGeneration, AutoTokenizer

    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = T5ForConditionalGeneration.from_pretrained(model_path)
    model.eval()
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = model.to(device)

    preds = []
    batch_size = args.batch_size
    for i in range(0, len(contexts), batch_size):
        batch_ctx = contexts[i:i + batch_size]
        batch_ans = answers[i:i + batch_size]
        inputs = [ctx.replace(ans, f"<hl> {ans} </hl>", 1) for ctx, ans in zip(batch_ctx, batch_ans)]
        inputs = [f"generate question: {inp}" for inp in inputs]
        encoded = tokenizer(inputs, return_tensors="pt", padding=True, truncation=True, max_length=512)
        encoded = {k: v.to(device) for k, v in encoded.items()}
        with torch.no_grad():
            out = model.generate(**encoded, max_length=64, num_beams=4)
        preds.extend(tokenizer.batch_decode(out, skip_special_tokens=True))

    preds = [p.strip() for p in preds]
    metrics = {
        "BLEU": compute_bleu(preds, refs),
        "ROUGE-L": compute_rouge(preds, refs)["rougeL_fmeasure"],
        "METEOR": compute_meteor(preds, refs),
    }
    return preds, metrics


def run_eval(args):
    print(f"Loading test data (source={args.source})...")
    if args.source == "learning_resources":
        contexts, answers, questions = load_learning_resources_qg(max_samples=args.max_samples)
    else:
        contexts, answers, questions = load_squad_val(max_samples=args.max_samples)
    refs = questions
    print(f"  Test samples: {len(contexts)}")

    model_path = args.model or (str(DEFAULT_MODEL) if DEFAULT_MODEL.exists() else MODEL_NAME)
    print(f"\nEvaluating model: {model_path}")
    preds, metrics = eval_model(model_path, contexts, answers, refs, args)

    print("\n--- Evaluation Metrics ---")
    for k, v in metrics.items():
        print(f"{k:12} {v:.4f}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_json = OUTPUT_DIR / "eval_metrics.json"
    out_json.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"\nSaved metrics to {out_json}")

    out_png = OUTPUT_DIR / "eval_results.png"
    plot_metrics(metrics, out_png)
    return metrics


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", type=str, default=None)
    ap.add_argument("--source", choices=["squad", "learning_resources"], default="learning_resources")
    ap.add_argument("--max_samples", type=int, default=200)
    ap.add_argument("--batch_size", type=int, default=16)
    ap.add_argument("--bertscore", action="store_true")
    ap.add_argument("--compare", action="store_true", help="Compare base vs fine-tuned (generates extra chart)")
    args = ap.parse_args()

    if args.compare and DEFAULT_MODEL.exists():
        if args.source == "learning_resources":
            contexts, answers, questions = load_learning_resources_qg(max_samples=args.max_samples)
        else:
            contexts, answers, questions = load_squad_val(max_samples=args.max_samples)
        refs = questions
        print("Evaluating Base model...")
        _, base_m = eval_model(MODEL_NAME, contexts, answers, refs, args)
        print("Evaluating Fine-tuned model...")
        _, ft_m = eval_model(str(DEFAULT_MODEL), contexts, answers, refs, args)
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        plot_compare(base_m, ft_m, OUTPUT_DIR / "eval_compare.png")
        metrics = ft_m
        out_json = OUTPUT_DIR / "eval_metrics.json"
        out_json.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
        plot_metrics(metrics, OUTPUT_DIR / "eval_results.png")
    else:
        run_eval(args)


if __name__ == "__main__":
    main()
