#!/usr/bin/env python3
"""
STAGING LAYER FOR EDUCONNECT PIPELINE

Reads the latest RAW snapshot and produces cleaned staging datasets.

Outputs:
- data/staging/<run_date>/students/students_clean.csv
- data/staging/<run_date>/curriculum/programmes_clean.csv
- data/staging/<run_date>/staging_manifest.json

Run from Educonnect root:
    python scripts/stage_data.py
"""
""" The staging layer cleaned and standardized the raw 
datasets before further processing. Extra spaces were 
removed, and text fields such as university names and student
 names were normalized to a consistent format. Gender values were
  standardized to uniform labels such as “Male” and “Female.” 
  The curriculum datasets were also merged, invalid records 
  without course names were removed, and duplicate programmes were 
  eliminated. The cleaned outputs were saved as structured staging 
  datasets to be used in the final transformation stage of the pipeline.
"""
import csv
import json
import logging
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
STAGING_DIR = DATA_DIR / "staging"
LOG_DIR = BASE_DIR / "logs"

LOG_DIR.mkdir(exist_ok=True)
STAGING_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    filename=LOG_DIR / "staging.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


def get_latest_raw_folder():
    if not RAW_DIR.exists():
        raise FileNotFoundError(f"Raw directory does not exist: {RAW_DIR}")

    run_folders = [p for p in RAW_DIR.iterdir() if p.is_dir()]
    if not run_folders:
        raise FileNotFoundError("No raw run folders found. Run ingest_raw_data.py first.")

    latest = sorted(run_folders)[-1]
    return latest


def make_staging_folder(run_name):
    run_folder = STAGING_DIR / run_name
    (run_folder / "students").mkdir(parents=True, exist_ok=True)
    (run_folder / "curriculum").mkdir(parents=True, exist_ok=True)
    return run_folder


def clean_text(value):
    if value is None:
        return ""
    value = str(value).strip()
    value = " ".join(value.split())
    return value


def normalize_title_case(value):
    value = clean_text(value)
    return value.title() if value else ""


def safe_lower_key(*parts):
    cleaned = [clean_text(p).lower() for p in parts]
    return tuple(cleaned)


def read_csv_rows(file_path):
    with file_path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = list(reader.fieldnames or [])
    return rows, fieldnames


def write_csv_rows(file_path, fieldnames, rows):
    with file_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def read_json(file_path):
    with file_path.open("r", encoding="utf-8") as f:
        return json.load(f)


def stage_students(raw_students_csv, output_csv):
    rows, fieldnames = read_csv_rows(raw_students_csv)

    if not rows:
        raise RuntimeError("Raw student dataset is empty.")

    cleaned_rows = []

    for row in rows:
        cleaned = {}

        for col in fieldnames:
            cleaned[col] = clean_text(row.get(col, ""))

        if "University" in cleaned:
            cleaned["University"] = normalize_title_case(cleaned["University"])

        if "Gender" in cleaned:
            gender = clean_text(cleaned["Gender"]).lower()
            if gender in {"m", "male"}:
                cleaned["Gender"] = "Male"
            elif gender in {"f", "female"}:
                cleaned["Gender"] = "Female"
            else:
                cleaned["Gender"] = clean_text(cleaned["Gender"])

        if "Year" in cleaned:
            cleaned["Year"] = clean_text(cleaned["Year"])

        if "Name" in cleaned:
            cleaned["Name"] = normalize_title_case(cleaned["Name"])

        cleaned_rows.append(cleaned)

    write_csv_rows(output_csv, fieldnames, cleaned_rows)

    return {
        "input_rows": len(rows),
        "output_rows": len(cleaned_rows),
        "dropped_rows": len(rows) - len(cleaned_rows),
        "output_file": str(output_csv)
    }


def extract_programmes_from_json(data, source_name):
    programmes = []

    if not isinstance(data, list):
        logger.warning(f"{source_name} did not contain a list; skipping.")
        return programmes

    for entry in data:
        if not isinstance(entry, dict):
            continue

        course = clean_text(entry.get("course"))
        university = clean_text(entry.get("university")) or "Makerere University"
        college = clean_text(entry.get("college"))

        if not course:
            continue

        programmes.append({
            "university": normalize_title_case(university),
            "college": normalize_title_case(college),
            "course": normalize_title_case(course),
            "source_file": source_name
        })

    return programmes


def stage_programmes(raw_curriculum_files, output_csv):
    all_programmes = []

    for file_path in raw_curriculum_files:
        if not file_path.exists():
            logger.warning(f"Curriculum file missing in raw layer: {file_path}")
            continue

        data = read_json(file_path)
        programmes = extract_programmes_from_json(data, file_path.name)
        all_programmes.extend(programmes)

    if not all_programmes:
        raise RuntimeError("No curriculum programmes found in raw staging input.")

    seen = set()
    unique_programmes = []

    for p in all_programmes:
        key = safe_lower_key(p["university"], p["course"])
        if key not in seen:
            seen.add(key)
            unique_programmes.append(p)

    fieldnames = ["university", "college", "course", "source_file"]
    write_csv_rows(output_csv, fieldnames, unique_programmes)

    return {
        "input_rows": len(all_programmes),
        "output_rows": len(unique_programmes),
        "dropped_rows": len(all_programmes) - len(unique_programmes),
        "output_file": str(output_csv)
    }


def main():
    logger.info("Starting staging layer")

    latest_raw = get_latest_raw_folder()
    run_name = latest_raw.name
    staging_run = make_staging_folder(run_name)

    raw_students_csv = latest_raw / "students" / "ugandan_students_dataset_1050.csv"
    raw_curriculum_json = latest_raw / "curriculum" / "university_curriculum.json"
    raw_fallback_json = latest_raw / "curriculum" / "curriculum_fallback.json"

    if not raw_students_csv.exists():
        raise FileNotFoundError(f"Missing raw student CSV: {raw_students_csv}")

    students_output = staging_run / "students" / "students_clean.csv"
    programmes_output = staging_run / "curriculum" / "programmes_clean.csv"

    student_stats = stage_students(raw_students_csv, students_output)
    programme_stats = stage_programmes(
        [raw_curriculum_json, raw_fallback_json],
        programmes_output
    )

    manifest = {
        "run_name": run_name,
        "staged_at": datetime.now().isoformat(),
        "inputs": {
            "raw_folder": str(latest_raw),
            "students_file": str(raw_students_csv),
            "curriculum_files": [
                str(raw_curriculum_json),
                str(raw_fallback_json)
            ]
        },
        "outputs": {
            "students": student_stats,
            "programmes": programme_stats
        }
    }

    manifest_path = staging_run / "staging_manifest.json"
    with manifest_path.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=4)

    logger.info("Staging layer completed successfully")

    print("STAGING COMPLETE")
    print(f"Read raw data from: {latest_raw}")
    print(f"Students staged to: {students_output}")
    print(f"Programmes staged to: {programmes_output}")
    print(f"Manifest created: {manifest_path}")


if __name__ == "__main__":
    main()