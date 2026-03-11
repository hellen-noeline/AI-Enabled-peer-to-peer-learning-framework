# Data pipeline: unified student dataset

##EduConnect uses a batch ETL data pipeline that gathers programme data, combines it with a base student dataset, generates a balanced unified CSV of students per programme, seeds it into the backend database and serves it to the application with CSV fallback support.

### Data Pipeline: Ingestion → Transformation → Generation → Storage → Serving

EduConnect uses a **single unified student dataset** so that Computing, Law, Business, Education, and other courses are **equally represented**.

## Steps

### 1. Curriculum (programmes)

- **Scrape** (optional):  
  `python scripts/scrape_university_curriculum.py`  
  Fetches Makerere and UCU programmes; output is merged with the static fallback.

- **Static fallback**:  
  `public/curriculum_fallback.json` lists 40+ programmes (Makerere, UCU, Kyambogo, Mbarara, Gulu, Busitema) across Computing, Law, Business, Education, etc. The scraper merges these into `public/university_curriculum.json` so we always have many courses.

### 2. Build unified dataset

From the **Educonnect** root:

```bash
python scripts/build_unified_student_dataset.py
```

- Reads base students from `public/ugandan_students_dataset_1050.csv`.
- Reads all programmes from `university_curriculum.json` + `curriculum_fallback.json` (deduplicated).
- Generates **50 students per programme** (configurable in the script).
- Writes **one file**: `public/educonnect_students_unified.csv`.

Result: one CSV with columns matching the app (including **Degree Program**); every course area is equally represented.

### 3. Ingestion

- **Server seed**:  
  `npm run seed` (from `server/`) loads `educonnect_students_unified.csv` into `dataset_students`. If that file is missing, it falls back to extended then base Ugandan CSV.

- **Frontend**:  
  When the API is unavailable, the app fetches `/educonnect_students_unified.csv`, then falls back to extended/base Ugandan CSV.

## File roles

| File | Role |
|------|------|
| `public/curriculum_fallback.json` | Static list of programmes (MAK, UCU, others) so all course areas are represented. |
| `public/university_curriculum.json` | Scraped + merged fallback programmes (output of scraper). |
| `public/ugandan_students_dataset_1050.csv` | Base pool of Ugandan student rows (names, contacts, skills). |
| `public/educonnect_students_unified.csv` | **Single dataset** used by seed and CSV fallback; 50 students per programme. |

## Changing student count per course

Edit `STUDENTS_PER_PROGRAMME` in `scripts/build_unified_student_dataset.py`, then re-run the script and re-seed.
