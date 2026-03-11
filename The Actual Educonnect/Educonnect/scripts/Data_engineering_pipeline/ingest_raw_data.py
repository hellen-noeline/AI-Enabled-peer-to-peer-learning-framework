#!/usr/bin/env python3
"""
RAW DATA INGESTION LAYER

This script performs the RAW layer of the EduConnect data pipeline.

Responsibilities:
1. Locate source data files
2. Validate they exist
3. Copy them unchanged into a dated raw folder
4. Record metadata about the files
5. Produce a manifest.json for auditing

Raw data must NEVER be modified.
Cleaning happens later in the staging layer.

Run from Educonnect root:
    python scripts/ingest_raw_data.py
"""

import shutil
import json
import csv
import logging
from pathlib import Path
from datetime import datetime

# --------------------------------------------------
# Project Paths
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[1]

PUBLIC_DIR = BASE_DIR / "public"
RAW_DIR = BASE_DIR / "data" / "raw"
LOG_DIR = BASE_DIR / "logs"

LOG_DIR.mkdir(exist_ok=True)

# --------------------------------------------------
# Logging Configuration
# --------------------------------------------------

logging.basicConfig(
    filename=LOG_DIR / "raw_ingestion.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# --------------------------------------------------
# Source Files
# --------------------------------------------------

SOURCE_FILES = {
    "students": [
        PUBLIC_DIR / "ugandan_students_dataset_1050.csv"
    ],
    "curriculum": [
        PUBLIC_DIR / "university_curriculum.json",
        PUBLIC_DIR / "curriculum_fallback.json"
    ]
}


# --------------------------------------------------
# Helper Functions
# --------------------------------------------------

def get_run_folder():
    """Create a dated run folder for raw ingestion."""
    today = datetime.now().strftime("%Y-%m-%d")
    run_folder = RAW_DIR / today
    run_folder.mkdir(parents=True, exist_ok=True)
    return run_folder


def count_csv_rows(file_path):
    """Count rows in CSV file."""
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        return sum(1 for _ in reader) - 1  # subtract header


def count_json_records(file_path):
    """Count records in JSON file."""
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        if isinstance(data, list):
            return len(data)
        return 1


def copy_file(src, dst):
    """Copy file preserving metadata."""
    shutil.copy2(src, dst)
    logger.info(f"Copied {src} -> {dst}")


# --------------------------------------------------
# Main Raw Ingestion Logic
# --------------------------------------------------

def ingest_raw_data():

    logger.info("Starting RAW data ingestion")

    run_folder = get_run_folder()

    manifest = []

    for category, files in SOURCE_FILES.items():

        category_folder = run_folder / category
        category_folder.mkdir(parents=True, exist_ok=True)

        for src in files:

            if not src.exists():
                logger.error(f"Missing source file: {src}")
                raise FileNotFoundError(f"Missing source file: {src}")

            dst = category_folder / src.name

            copy_file(src, dst)

            file_size = dst.stat().st_size

            record_count = None

            if dst.suffix == ".csv":
                record_count = count_csv_rows(dst)

            if dst.suffix == ".json":
                record_count = count_json_records(dst)

            manifest_entry = {
                "file_name": dst.name,
                "category": category,
                "source_path": str(src),
                "raw_path": str(dst),
                "ingested_at": datetime.now().isoformat(),
                "file_size_bytes": file_size,
                "record_count": record_count
            }

            manifest.append(manifest_entry)

    manifest_path = run_folder / "manifest.json"

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=4)

    logger.info("Raw ingestion complete")

    print("RAW INGESTION COMPLETE")
    print(f"Files stored in: {run_folder}")
    print(f"Manifest created: {manifest_path}")


# --------------------------------------------------
# Run Pipeline
# --------------------------------------------------

if __name__ == "__main__":
    ingest_raw_data()