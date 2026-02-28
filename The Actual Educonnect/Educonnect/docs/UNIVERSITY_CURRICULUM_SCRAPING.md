# University Curriculum Scraping Strategy (MAK & UCU)

This document describes the **two-step extraction** approach and prompts for building a comprehensive, structured dataset of academic programs and course units from **Makerere University (MAK)** and **Uganda Christian University (UCU)** for use in EduConnect.

---

## 1. The Strategy: Two-Step Extraction

University websites are deep; you cannot get all data in one click. Use two steps:

| Step | What to scrape | Purpose |
|------|----------------|---------|
| **Step A** | **Course catalog** — the list of degrees/programs | Get all faculties and degree names |
| **Step B** | **Course structure** for each degree — units/modules | Get year, semester, and unit details (codes, names, credits) |

---

## 2. Target URLs

| University | Catalog / Programs URL | Notes |
|------------|------------------------|--------|
| **Makerere (MAK)** | https://courses.mak.ac.ug/programs | Official course catalog |
| **UCU** | https://ucu.ac.ug/academics/ | Academics section for faculties & programs |

**Note:** "Mercury University" in some contexts refers to **Makerere University**; the URLs above use the correct official domains.

---

## 3. Data Scraper Prompt (For Casa AI) — Full Structure

Copy and paste this to instruct the AI to scrape and structure the data:

> I need a comprehensive dataset for my application. Act as a Web Scraper and Data Engineer.
>
> **Task:** Scrape and structure academic data from Makerere University (mak.ac.ug) and Uganda Christian University (ucu.ac.ug).
>
> **Data Requirements:**
> - **University level:** Name, Location, and Motto.
> - **Course level:** Full degree name (e.g., Bachelor of Science in Computer Science), Duration, and College/Faculty.
> - **Unit level:** All course units (modules) categorized by Year (Year 1, 2, 3) and Semester (I, II). Include course codes if available (e.g., BIT 1101).
>
> **Output format:** Provide the data in JSON so it can be used directly in a database. Ensure the relationship is nested:
>
> **University → College → Course → Year → Semester → Unit**
>
> **Target URLs:**
> - Makerere: https://courses.mak.ac.ug/programs  
> - UCU: https://ucu.ac.ug/academics/

---

## 4. “Smart” Scrape Prompt — Exclude Medical, Focus on Key Faculties

Use this prompt when you want to **skip medical/health** and focus on the faculties listed below. It reduces volume and keeps the dataset aligned with non-medical programs.

> Task: Generate a complete JSON dataset for Makerere University and Uganda Christian University.
>
> **Exclusion filter:** Skip all courses under the "College of Health Sciences" or "Faculty of Public Health/Medicine."
>
> **Instructions:** For every other Faculty (Computing, Business, Law, Engineering, Social Sciences, etc.):
> - List the Faculty Name.
> - List all Degree Programs under that Faculty.
> - For each Degree, list the Course Units categorized by Year 1, Year 2, and Year 3, including their Semester (I or II) and Credit Units (CU).
>
> **Example structure for the AI:**
> - Makerere → CoCIS → BSc Computer Science  
>   - Year 1, Sem I: [CSK1101 Communication Skills (4 CU), MTH1101 Calculus I (4 CU)...]  
>   - Year 1, Sem II: [CSC1200 Operating Systems (4 CU), CSC1207 Data Structures (4 CU)...]
>
> **Output:** Provide the data in raw code format (JSON) so I can integrate it into my application's database.

---

## 5. Faculty & Course Directory (Non-Medical Focus)

| University | Key non-medical faculties/colleges | Example courses |
|------------|-----------------------------------|------------------|
| **Makerere (MAK)** | Computing (CoCIS), Business (CoBAMS), Engineering (CEDAT), Law, Social Sciences (CHUSS), Agriculture (CAES) | B. Information Tech, BBA, Civil Engineering, LLB, Journalism |
| **UCU** | Engineering & Tech, Business, Law, Social Sciences, Education & Arts, Agricultural Sciences | BSc Computer Science, B. Procurement, LLB, BA Education |

---

## 6. “Smart” JSON Structure (Target Schema)

Your UI is **reactive** when data follows this nested shape. When a student selects “Computer Science,” only the relevant units appear; progress can unlock by year/semester; search can match across universities.

### Single program example

```json
{
  "university": "Makerere University",
  "universityLocation": "Kampala, Uganda",
  "universityMotto": "We Build for the Future",
  "college": "College of Computing and Information Sciences",
  "course": "Bachelor of Information Technology",
  "duration": "3 years",
  "curriculum": [
    {
      "year": 1,
      "semester": 1,
      "units": [
        { "code": "BIT 1101", "name": "Introduction to IT", "type": "Core", "credits": 4 },
        { "code": "BIT 1102", "name": "Programming Principles", "type": "Core", "credits": 4 }
      ]
    },
    {
      "year": 1,
      "semester": 2,
      "units": [
        { "code": "CSC 1200", "name": "Operating Systems", "type": "Core", "credits": 4 },
        { "code": "CSC 1207", "name": "Data Structures", "type": "Core", "credits": 4 }
      ]
    }
  ]
}
```

### Sample data preview (what the AI may produce)

**Makerere University: Bachelor of Business Administration (BBA)**  
- Year 1, Semester I: COE 1101 Fundamentals of Accounting (4 CU), COX 1108 Intro to Business Administration (3 CU), ECO 1107 Introductory Microeconomics (3 CU)  
- Year 2, Semester I: COE 2101 Managerial Finance (4 CU), BHR 2101 Human Resource Management (3 CU)

**UCU: Bachelor of Laws (LLB)**  
- Year 1, Semester I: LLB 1101 Introducing Law (5 CU), LLB 1103 Criminal Law I (5 CU), LLB 1105 Constitutional Law I (5 CU)

---

## 7. Why This Makes the UI “Reactive”

| Feature | How the structure supports it |
|--------|-------------------------------|
| **Smart filtering** | Student selects “UCU” → app shows only UCU faculties and courses. |
| **Progress tracking** | When the student completes “Criminal Law I,” the UI can unlock the next semester’s units because year/semester/units are welded in sequence. |
| **Search** | Users search for “Programming” and see every course across both universities that includes that unit. |

---

## 8. Scraped Dataset in This Repo

The file **`public/university_curriculum.json`** contains real scraped data:

- **Makerere University:** Full curriculum (year/semester/units) for:
  - **Bachelor of Information Technology** (CoCIS) — 3 years, all 6 semesters
  - **Bachelor of Business Administration** (CoBAMS) — 3 years, all 6 semesters
  - **Bachelor of Laws** (School of Law) — 4 years, all 8 semesters
- **Uganda Christian University:** Catalog-only entries (School of Business, Faculty of Engineering, School of Law) with empty `curriculum`; you can add units by scraping UCU school pages or using the prompts above in another tool.

The structure is **University → College → Course → Year → Semester → Unit**. Use it for smart filtering, progress tracking, and search. A **schema** for validation is in `docs/curriculum-schema.json`.

## 9. Next Steps (Optional)

1. **Add more MAK programs:** Fetch more program pages from `https://courses.mak.ac.ug/programmes/<slug>` and append to `university_curriculum.json`.
2. **Add UCU curricula:** Scrape UCU school pages (e.g. `https://business.ucu.ac.ug/undergraduate/`, `https://fedt.ucu.ac.ug/`) for program and unit lists, or use the Casa AI prompts (Sections 3–4) and merge the output.
3. **Wire the app:** Load `public/university_curriculum.json` in your frontend or backend for filters, progress-by-semester, and cross-university search.
