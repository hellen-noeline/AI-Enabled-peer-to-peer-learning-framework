#!/usr/bin/env python3
"""
Expand the US students dataset with synthetic students enrolled in all
programmes found in public/university_curriculum.json.

This does NOT overwrite the original CSV. It creates a new file:

  public/us_students_dataset_1500_extended.csv

Approach
--------
- Load base US students from public/us_students_dataset_1500.csv
- Load programmes from public/university_curriculum.json
- For each programme, clone a sample of base students and:
  - Set University field to the programme's university
  - Add a new column 'Degree Program' with the programme's course name

This increases the number of courses EduConnect supports while keeping the
same schema (plus one extra descriptive column) so the app can treat
students from diverse programmes consistently.
"""

import csv
import random
from pathlib import Path
import json


BASE_DIR = Path(__file__).resolve().parents[1]
US_DATASET_PATH = BASE_DIR / "public" / "us_students_dataset_1500.csv"
PROGRAMMES_PATH = BASE_DIR / "public" / "university_curriculum.json"
OUTPUT_PATH = BASE_DIR / "public" / "us_students_dataset_1500_extended.csv"

# How many synthetic students to generate per programme
SYNTHETIC_PER_PROGRAMME = 40


def load_us_students():
  with US_DATASET_PATH.open("r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = list(reader)
  return rows, reader.fieldnames


def load_programmes():
  if not PROGRAMMES_PATH.exists():
    raise FileNotFoundError(f"{PROGRAMMES_PATH} not found. Run the scraper first.")
  with PROGRAMMES_PATH.open("r", encoding="utf-8") as f:
    programmes = json.load(f)
  # Filter out any entries without a course name
  return [p for p in programmes if p.get("course")]


def main():
  base_rows, base_fields = load_us_students()
  programmes = load_programmes()

  print(f"Loaded {len(base_rows)} base US students.")
  print(f"Loaded {len(programmes)} programmes from {PROGRAMMES_PATH.name}.")

  # Ensure 'Degree Program' column exists
  fieldnames = list(base_fields)
  if "Degree Program" not in fieldnames:
    fieldnames.append("Degree Program")

  synthetic_rows = []

  # Use all base rows as a pool to sample from
  pool = base_rows
  if not pool:
    raise RuntimeError("Base dataset is empty; cannot generate synthetic students.")

  for programme in programmes:
    university = programme.get("university", "").strip() or "Unknown University"
    degree_name = programme.get("course", "").strip()
    college = programme.get("college", "").strip()

    print(f"- Generating students for: {university} – {degree_name}")

    # Sample with replacement so we can support many programmes
    for i in range(SYNTHETIC_PER_PROGRAMME):
      base = random.choice(pool)
      row = dict(base)  # shallow copy

      # Override / extend fields
      row["University"] = university

      # Add degree program (and optionally include college in text)
      if college:
        row["Degree Program"] = f"{degree_name} ({college})"
      else:
        row["Degree Program"] = degree_name

      # Keep all other fields (skills, interests, etc.) as-is so
      # recommendations and resources continue to work cross-field.
      synthetic_rows.append(row)

  total_rows = base_rows + synthetic_rows

  OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
  with OUTPUT_PATH.open("w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for row in total_rows:
      writer.writerow(row)

  print(f"\nWrote {len(total_rows)} rows to {OUTPUT_PATH}")


if __name__ == "__main__":
  main()

