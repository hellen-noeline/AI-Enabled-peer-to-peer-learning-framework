# Flan-T5 Question Generation: Train & Evaluate on Learning Resources

## Overview

- **Model:** `google/flan-t5-base`
- **Task:** Question Generation (context + answer → question)
- **Training data:** EduConnect learning resources (title + description) or SQuAD 2.0
- **Format:** `generate question: <hl> answer </hl> rest of context` → question
- **Outputs:** `data/eval_results.png` (bar chart), `data/eval_compare.png` (base vs fine-tuned)

## 1. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

For BERTScore (optional): `pip install bert-score`

## 2. Full pipeline (recommended)

```bash
python run_train_and_eval.py
```

This will: build QG data from learning resources → train → evaluate → save charts.

## 3. Train on learning resources

```bash
# Build QG dataset first (uses server/data/learningResources.js)
python build_learning_resources_qg.py

# Train
python train_quiz_t5.py --source learning_resources --epochs 3 --max_samples 300
```

Options:
- `--source` learning_resources | squad
- `--epochs` (default 3)
- `--batch_size` (default 8)
- `--max_samples` – limit samples (default: all)

Output: `backend/models/quiz_qg_flant5/`

## 4. Evaluate with visuals

```bash
# Evaluate fine-tuned model on learning resources
python eval_quiz_t5.py --source learning_resources --model models/quiz_qg_flant5 --max_samples 200

# Compare base vs fine-tuned (generates eval_compare.png)
python eval_quiz_t5.py --source learning_resources --compare
```

Outputs:
- `data/eval_results.png` – Bar chart of BLEU, ROUGE-L, METEOR
- `data/eval_metrics.json` – Numeric scores
- `data/eval_compare.png` – Base vs fine-tuned (with --compare)

## 5. Use the fine-tuned model

```bash
export QG_MODEL_PATH=./models/quiz_qg_flant5
python app.py
```

## Metrics & Visuals

| Metric | Description |
|--------|-------------|
| **BLEU** | n-gram overlap with reference questions |
| **ROUGE-L** | Longest common subsequence F1 |
| **METEOR** | Word alignment + synonyms |
