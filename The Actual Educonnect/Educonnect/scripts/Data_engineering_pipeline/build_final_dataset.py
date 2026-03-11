#!/usr/bin/env python3
"""
FINAL TRANSFORMATION LAYER

Builds the unified EduConnect student dataset using the cleaned staging data.

Outputs:
- data/final/<run_date>/educonnect_students_unified.csv (dated copy)
- public/educonnect_students_unified.csv (single canonical CSV for app + Postgres)
"""

import csv
import json
import random
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
PUBLIC_DIR = BASE_DIR / "public"

STAGING_DIR = DATA_DIR / "staging"
FINAL_DIR = DATA_DIR / "final"

# Single CSV path used by Node seed, frontend, and Load_final_postgres
CANONICAL_CSV = PUBLIC_DIR / "educonnect_students_unified.csv"

STUDENTS_PER_PROGRAMME = 50

FINAL_DIR.mkdir(parents=True, exist_ok=True)


def get_latest_staging_folder():
    folders = [p for p in STAGING_DIR.iterdir() if p.is_dir()]
    if not folders:
        raise RuntimeError("No staging data found. Run stage_data.py first.")
    return sorted(folders)[-1]


def read_csv(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fields = reader.fieldnames
    return rows, fields


def write_csv(file_path, fieldnames, rows):
    with open(file_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main():

    staging_run = get_latest_staging_folder()
    run_name = staging_run.name

    students_file = staging_run / "students" / "students_clean.csv"
    programmes_file = staging_run / "curriculum" / "programmes_clean.csv"

    students, student_fields = read_csv(students_file)
    programmes, _ = read_csv(programmes_file)

    random.seed(42)

    output_rows = []

    if "Degree Program" not in student_fields:
        student_fields.append("Degree Program")

    for programme in programmes:

        university = programme["university"]
        college = programme["college"]
        course = programme["course"]

        degree_label = f"{course} ({college})" if college else course

        for _ in range(STUDENTS_PER_PROGRAMME):

            base_student = dict(random.choice(students))

            base_student["University"] = university
            base_student["Degree Program"] = degree_label

            output_rows.append(base_student)

    final_run = FINAL_DIR / run_name
    final_run.mkdir(parents=True, exist_ok=True)

    output_file = final_run / "educonnect_students_unified.csv"

    write_csv(output_file, student_fields, output_rows)

    # One CSV for everyone: app (Node seed, frontend) and Load_final_postgres use this path
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copy2(output_file, CANONICAL_CSV)

    manifest = {
        "run_date": run_name,
        "students_per_programme": STUDENTS_PER_PROGRAMME,
        "programmes": len(programmes),
        "total_students_generated": len(output_rows),
        "output_file": str(output_file),
        "canonical_csv": str(CANONICAL_CSV)
    }

    manifest_file = final_run / "final_manifest.json"

    with open(manifest_file, "w") as f:
        json.dump(manifest, f, indent=4)

    print("FINAL DATASET CREATED")
    print(f"Programs: {len(programmes)}")
    print(f"Students generated: {len(output_rows)}")
    print(f"Saved to: {output_file}")
    print(f"Canonical CSV (app + Postgres): {CANONICAL_CSV}")


if __name__ == "__main__":
    main()