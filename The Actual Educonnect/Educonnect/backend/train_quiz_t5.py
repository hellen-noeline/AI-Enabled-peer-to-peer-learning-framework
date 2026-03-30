"""
Fine-tune Flan-T5 base for Question Generation.

Supports: --source squad | learning_resources
- squad: SQuAD 2.0 (downloads from HuggingFace)
- learning_resources: Our EduConnect learning resources (title + description)

Format: context with <hl> answer </hl> -> generated question
Output: backend/models/quiz_qg_flant5/
Set QG_MODEL_PATH to use the trained model.
"""

import os
import json
import argparse
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "models" / "quiz_qg_flant5"
DATA_DIR = BASE_DIR / "data"
MODEL_NAME = "google/flan-t5-base"


def build_squad_qg_dataset(split="train", max_samples=None):
    """Load SQuAD 2.0 and convert to QG format."""
    from datasets import load_dataset
    ds = load_dataset("squad_v2", split=split)
    inputs, targets = [], []
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
            key = (context[:100], answer)
            if key in seen:
                continue
            seen.add(key)
            highlighted = context.replace(answer, f"<hl> {answer} </hl>", 1)
            inp = f"generate question: {highlighted}"
            inputs.append(inp)
            targets.append(qa["question"])
            if max_samples and len(inputs) >= max_samples:
                return inputs, targets
    return inputs, targets


def build_learning_resources_qg_dataset(max_samples=None):
    """Build QG pairs from EduConnect learning resources."""
    from build_learning_resources_qg import build_qg_pairs
    from load_learning_resources import get_learning_resources

    qg_path = DATA_DIR / "learning_resources_qg.json"
    if qg_path.exists():
        data = json.loads(qg_path.read_text(encoding="utf-8"))
    else:
        resources = get_learning_resources(enrich_quiz_source=True)
        pairs = build_qg_pairs(resources, max_per_resource=5)
        data = [{"context": c, "answer": a, "question": q, "category": cat} for c, a, q, cat in pairs]
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        qg_path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    inputs, targets = [], []
    for item in data:
        ctx = item["context"]
        ans = item["answer"]
        q = item["question"]
        if ans not in ctx:
            continue
        highlighted = ctx.replace(ans, f"<hl> {ans} </hl>", 1)
        inputs.append(f"generate question: {highlighted}")
        targets.append(q)
        if max_samples and len(inputs) >= max_samples:
            break
    return inputs, targets


def train(args):
    import torch
    from transformers import T5ForConditionalGeneration, AutoTokenizer, Trainer, TrainingArguments
    from datasets import Dataset

    print(f"Loading QG dataset (source={args.source})...")
    if args.source == "learning_resources":
        inputs, targets = build_learning_resources_qg_dataset(max_samples=args.max_samples)
    else:
        inputs, targets = build_squad_qg_dataset(split="train", max_samples=args.max_samples)

    print(f"  Train samples: {len(inputs)}")

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = T5ForConditionalGeneration.from_pretrained(MODEL_NAME)
    pad_id = tokenizer.pad_token_id or 0

    def tokenize_fn(examples):
        model_inputs = tokenizer(
            examples["input"],
            max_length=512,
            truncation=True,
            padding="max_length"
        )
        labels = tokenizer(
            examples["target"],
            max_length=64,
            truncation=True,
            padding="max_length"
        )
        model_inputs["labels"] = [
            [(l if l != pad_id else -100) for l in label]
            for label in labels["input_ids"]
        ]
        return model_inputs

    dataset = Dataset.from_dict({"input": inputs, "target": targets})
    tokenized = dataset.map(
        tokenize_fn,
        batched=True,
        remove_columns=dataset.column_names
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    training_args = TrainingArguments(
        output_dir=str(OUTPUT_DIR),
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        warmup_steps=min(500, len(inputs) // 10),
        weight_decay=0.01,
        logging_steps=50,
        save_strategy="epoch",
        fp16=torch.cuda.is_available(),
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized,
    )
    trainer.train()
    trainer.save_model(str(OUTPUT_DIR))
    tokenizer.save_pretrained(str(OUTPUT_DIR))
    print(f"Model saved to {OUTPUT_DIR}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", choices=["squad", "learning_resources"], default="learning_resources",
                    help="Training data: squad or learning_resources")
    ap.add_argument("--epochs", type=int, default=3)
    ap.add_argument("--batch_size", type=int, default=8)
    ap.add_argument("--max_samples", type=int, default=None, help="Max samples (default: all)")
    args = ap.parse_args()
    train(args)


if __name__ == "__main__":
    main()
