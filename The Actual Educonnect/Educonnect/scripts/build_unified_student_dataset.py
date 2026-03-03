#!/usr/bin/env python3
"""
Build a single unified student dataset with all courses equally represented.

- Loads base Ugandan students from public/ugandan_students_dataset_1050.csv
- Loads programmes from public/university_curriculum.json (scraped) and
  public/curriculum_fallback.json (static list of MAK, UCU, Kyambogo, etc.)
- Generates the same number of synthetic students per programme so Computing,
  Law, Business, Education, etc. are all equally represented
- Writes one file: public/educonnect_students_unified.csv

The app and seed then use this single file for dataset_students and CSV fallback.

Run from Educonnect root:
  python scripts/build_unified_student_dataset.py
"""

import csv
import json
import random
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
PUBLIC = BASE_DIR / "public"
BASE_CSV = PUBLIC / "ugandan_students_dataset_1050.csv"
CURRICULUM_JSON = PUBLIC / "university_curriculum.json"
FALLBACK_JSON = PUBLIC / "curriculum_fallback.json"
OUTPUT_CSV = PUBLIC / "educonnect_students_unified.csv"

# Equal representation: same number of students per programme
STUDENTS_PER_PROGRAMME = 50


def load_base_students():
    if not BASE_CSV.exists():
        raise FileNotFoundError(f"Base dataset not found: {BASE_CSV}")
    with BASE_CSV.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = list(reader.fieldnames)
    return rows, fieldnames


def load_programmes():
    programmes = []
    if CURRICULUM_JSON.exists():
        with CURRICULUM_JSON.open("r", encoding="utf-8") as f:
            data = json.load(f)
            for entry in data:
                if isinstance(entry, dict) and entry.get("course"):
                    programmes.append({
                        "university": (entry.get("university") or "").strip() or "Makerere University",
                        "college": (entry.get("college") or "").strip(),
                        "course": (entry.get("course") or "").strip(),
                    })
    if FALLBACK_JSON.exists():
        with FALLBACK_JSON.open("r", encoding="utf-8") as f:
            fallback = json.load(f)
            for entry in fallback:
                if isinstance(entry, dict) and entry.get("course"):
                    programmes.append({
                        "university": (entry.get("university") or "").strip() or "Makerere University",
                        "college": (entry.get("college") or "").strip(),
                        "course": (entry.get("course") or "").strip(),
                    })
    # Deduplicate by (university, course)
    seen = set()
    unique = []
    for p in programmes:
        key = (p["university"].lower(), p["course"].lower().strip())
        if key not in seen:
            seen.add(key)
            unique.append(p)
    return unique


def main():
    base_rows, base_fieldnames = load_base_students()
    programmes = load_programmes()

    if not base_rows:
        raise RuntimeError("Base student dataset is empty.")
    if not programmes:
        raise RuntimeError("No programmes found. Ensure curriculum JSON or fallback exists.")

    fieldnames = list(base_fieldnames)
    if "Degree Program" not in fieldnames:
        fieldnames.append("Degree Program")

    pool = base_rows
    random.seed(42)
    out_rows = []

    for prog in programmes:
        university = prog["university"]
        college = prog["college"]
        course = prog["course"]
        degree_label = f"{course} ({college})" if college else course

        for _ in range(STUDENTS_PER_PROGRAMME):
            base = dict(random.choice(pool))
            base["University"] = university
            base["Degree Program"] = degree_label
            out_rows.append(base)

    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_CSV.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for row in out_rows:
            writer.writerow(row)

    print(f"Programmes: {len(programmes)}")
    print(f"Students per programme: {STUDENTS_PER_PROGRAMME}")
    print(f"Total students: {len(out_rows)}")
    print(f"Written to {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
