#!/usr/bin/env python3
"""
Load the final unified student dataset (CSV) into PostgreSQL.

Reads the single canonical CSV: public/educonnect_students_unified.csv
(Same file used by Node seed and frontend; produced by build_final_dataset.py)

Requires: pip install pandas sqlalchemy psycopg2-binary
          PostgreSQL must be installed and running (default: localhost:5433).

Run from Educonnect root:
  python scripts/Load_final_postgres.py

Set env vars to override defaults: DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME
"""

import os
import re
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

BASE_DIR = Path(__file__).resolve().parents[1]
# One CSV for app and Postgres
CANONICAL_CSV = BASE_DIR / "public" / "educonnect_students_unified.csv"

# PostgreSQL connection (env vars override defaults)
DB_USER = os.environ.get("DB_USER", "ucu_student")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "ucu_password")
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "5433")
DB_NAME = os.environ.get("DB_NAME", "engineering_db")

TABLE_SCHEMA = "mart"
TABLE_NAME = "educonnect_students_unified"


def _pg_column_name(name: str) -> str:
    """Convert CSV header to PostgreSQL-friendly identifier (lowercase, underscores, no parens)."""
    s = name.strip().lower()
    s = s.replace(" ", "_").replace("/", "_").replace("-", "_")
    s = s.replace("(", "_").replace(")", "_")
    s = re.sub(r"_+", "_", s).strip("_")  # collapse and trim underscores
    return s or "col"


def _dedupe_columns(names: list) -> list:
    """Ensure unique column names; append _1, _2, ... for duplicates."""
    seen = {}
    out = []
    for n in names:
        if n not in seen:
            seen[n] = 0
            out.append(n)
        else:
            seen[n] += 1
            out.append(f"{n}_{seen[n]}")
    return out


def main():
    if not CANONICAL_CSV.exists():
        raise FileNotFoundError(
            f"Canonical CSV not found: {CANONICAL_CSV}. "
            "Run: ingest_raw_data.py → stage_data.py → build_final_dataset.py"
        )
    csv_file = CANONICAL_CSV

    try:
        df = pd.read_csv(csv_file, encoding="utf-8")
    except Exception as e:
        print(f"Failed to read CSV: {e}", file=sys.stderr)
        raise

    # PostgreSQL-friendly column names (lowercase, underscores, no parens) and unique
    raw_names = [_pg_column_name(c) for c in df.columns]
    df.columns = _dedupe_columns(raw_names)

    connection_url = (
        f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}"
        f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )

    try:
        engine = create_engine(connection_url)
    except Exception as e:
        print(f"Failed to create DB engine: {e}", file=sys.stderr)
        print("Check DB_HOST, DB_PORT, DB_NAME and that PostgreSQL is running.", file=sys.stderr)
        raise

    try:
        with engine.connect() as conn:
            conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {TABLE_SCHEMA}"))
            conn.commit()
    except OperationalError as e:
        orig = e.orig if hasattr(e, "orig") else e
        if "Connection refused" in str(orig) or "could not connect" in str(orig).lower():
            print("PostgreSQL is not running or not reachable.", file=sys.stderr)
            print(f"  Host: {DB_HOST}  Port: {DB_PORT}", file=sys.stderr)
            print("  Start PostgreSQL, then run this script again.", file=sys.stderr)
            print("  Windows: Services → start 'postgresql-x64-*', or run pg_ctl start.", file=sys.stderr)
        raise
    except Exception as e:
        print(f"Failed to create schema: {e}", file=sys.stderr)
        print("Check DB_USER, DB_PASSWORD and that the database exists.", file=sys.stderr)
        raise

    try:
        df.to_sql(
            name=TABLE_NAME,
            con=engine,
            schema=TABLE_SCHEMA,
            if_exists="replace",
            index=False,
            chunksize=1000,
        )
    except Exception as e:
        print(f"Failed to load table: {e}", file=sys.stderr)
        raise

    print("LOAD COMPLETE")
    print(f"Loaded file: {csv_file}")
    print(f"Rows loaded: {len(df)}")
    print(f"Destination: {TABLE_SCHEMA}.{TABLE_NAME}")


if __name__ == "__main__":
    main()
