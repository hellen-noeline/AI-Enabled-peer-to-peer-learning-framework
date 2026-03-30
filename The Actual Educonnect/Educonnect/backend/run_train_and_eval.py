"""
Run full pipeline: build data -> train -> evaluate -> show visuals.

Usage: python run_train_and_eval.py
"""

import subprocess
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent


def run(cmd: list) -> bool:
    r = subprocess.run([sys.executable] + cmd, cwd=str(BASE))
    return r.returncode == 0


def main():
    print("=== 1. Building QG dataset from learning resources ===")
    if not run(["build_learning_resources_qg.py"]):
        print("Failed to build dataset")
        return 1

    print("\n=== 2. Training Flan-T5 on learning resources ===")
    if not run(["train_quiz_t5.py", "--source", "learning_resources", "--epochs", "2", "--max_samples", "300"]):
        print("Training failed")
        return 1

    print("\n=== 3. Evaluating fine-tuned model ===")
    if not run(["eval_quiz_t5.py", "--source", "learning_resources", "--model", "models/quiz_qg_flant5", "--max_samples", "150"]):
        print("Evaluation failed")
        return 1

    png = BASE / "data" / "eval_results.png"
    if png.exists():
        print(f"\n=== Done! View the evaluation chart: {png}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
