#!/usr/bin/env python3
"""
Scrape Makerere University (MAK) and Uganda Christian University (UCU)
programmes and curricula into a unified JSON file for EduConnect.

This script focuses on:
- Makerere: programmes and full year/semester/unit breakdown from courses.mak.ac.ug
- UCU: programme catalog (names and basic metadata) from official school sites

Output JSON structure matches docs/curriculum-schema.json and the examples used
in public/university_curriculum*.json:

[
  {
    "university": "Makerere University",
    "universityLocation": "Kampala, Uganda",
    "universityMotto": "We Build for the Future",
    "college": "College of Computing and Information Sciences",
    "course": "Bachelor Of Information Technology",
    "duration": "3 Years",
    "curriculum": [
      {
        "year": 1,
        "semester": 1,
        "units": [
          {"code": "BIT 1104", "name": "Information Technology I", "type": "Core", "credits": 3}
        ]
      },
      ...
    ]
  },
  ...
]

NOTE: This is a best-effort scraper. The university websites can change; if they
do, you may need to adjust the selectors below.
"""

import json
import re
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List, Dict, Any, Optional

import requests
from bs4 import BeautifulSoup


BASE_DIR = Path(__file__).resolve().parents[1]
OUTPUT_PATH = BASE_DIR / "public" / "university_curriculum.json"

MAK_PROGRAMS_URL = "https://courses.mak.ac.ug/programs"
MAK_BASE = "https://courses.mak.ac.ug"

# Simple UCU catalog endpoints (programme-level only; units need custom work
# per faculty site and may not be consistently exposed).
UCU_SITES = {
    "School of Business and Administration": "https://business.ucu.ac.ug/undergraduate/",
    "School of Law": "https://law.ucu.ac.ug/programes/undergraduate/",
    # School of Education site exposes curriculum via a theme-specific URL;
    # it is not stable enough to parse generically, so we only record programmes.
    "School of Education": "https://educ.ucu.ac.ug/",
}


@dataclass
class Unit:
    code: str
    name: str
    type: str = "Core"
    credits: Optional[float] = None

    def to_json(self) -> Dict[str, Any]:
        data: Dict[str, Any] = {
            "code": self.code.strip(),
            "name": self.name.strip(),
            "type": self.type,
        }
        if self.credits is not None:
            data["credits"] = self.credits
        return data


@dataclass
class SemesterBlock:
    year: int
    semester: int
    units: List[Unit]

    def to_json(self) -> Dict[str, Any]:
        return {
            "year": self.year,
            "semester": self.semester,
            "units": [u.to_json() for u in self.units],
        }


def fetch(url: str) -> BeautifulSoup:
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    return BeautifulSoup(resp.text, "html.parser")


# -------- Makerere scraping --------

def scrape_mak_program_list() -> List[Dict[str, str]]:
    """
    Scrape the All Programs page and return a list of programme dicts:
    {"college": "College of Computing and Information Sciences",
     "name": "Bachelor Of Information Technology",
     "url": "https://courses.mak.ac.ug/programmes/bachelor-information-technology",
     "duration": "3 Years"}
    """
    soup = fetch(MAK_PROGRAMS_URL)
    programmes: List[Dict[str, str]] = []

    # The page is structured as headings with following tables, grouped by college.
    current_college = None
    for node in soup.find_all(["h2", "h3", "table"]):
        if node.name in ("h2", "h3"):
            text = node.get_text(strip=True)
            # Skip the generic "All Programs" header
            if "College" in text or "School of" in text:
                current_college = text
        elif node.name == "table" and current_college:
            # Each table row: Program Name link + duration
            tbody = node.find("tbody") or node
            for tr in tbody.find_all("tr"):
                cols = tr.find_all("td")
                if not cols:
                    continue
                link = cols[0].find("a")
                if not link or not link.get("href"):
                    continue
                name = link.get_text(strip=True)
                href = link["href"]
                if href.startswith("/"):
                    href = MAK_BASE + href
                duration = cols[1].get_text(strip=True) if len(cols) > 1 else ""
                programmes.append(
                    {
                        "college": current_college,
                        "name": name,
                        "url": href,
                        "duration": duration,
                    }
                )
    return programmes


def parse_credit(value: str) -> Optional[float]:
    value = value.strip()
    if not value:
        return None
    # Many rows use integers; keep it simple.
    try:
        return float(value)
    except ValueError:
        return None


def scrape_mak_program_curriculum(program: Dict[str, str]) -> Dict[str, Any]:
    """
    Given a programme dict from scrape_mak_program_list, fetch its page and
    parse the year/semester/course tables into curriculum blocks.
    """
    url = program["url"]
    soup = fetch(url)

    # Duration sometimes appears as "Duration of Program : 3 Years"
    duration = program.get("duration") or ""
    for p in soup.find_all("p"):
        txt = p.get_text(" ", strip=True)
        if "Duration of Program" in txt and ":" in txt:
            duration = txt.split(":", 1)[-1].strip()
            break

    # Parse courses: the HTML uses tables with a header row containing 'Semester'
    curriculum: List[SemesterBlock] = []
    year = None

    # Identify "Year X" headings before tables
    for element in soup.find_all(["h2", "h3", "h4", "table"]):
        if element.name in ("h2", "h3", "h4"):
            m = re.search(r"Year\\s*(\\d+)", element.get_text(strip=True), re.I)
            if m:
                year = int(m.group(1))
        elif element.name == "table" and year is not None:
            # Check if this table looks like a course table (has 'Semester' in first header cell)
            headers = [th.get_text(strip=True) for th in element.find_all("th")]
            if not headers:
                continue
            if "Semester" not in headers[0]:
                continue

            tbody = element.find("tbody") or element
            # Determine semester from each row's first cell
            for tr in tbody.find_all("tr"):
                cols = [td.get_text(" ", strip=True) for td in tr.find_all("td")]
                if len(cols) < 4:
                    continue
                sem_label, title, code, credits = cols[:4]

                # Skip header-ish rows that repeat labels
                if sem_label.lower().startswith("semester") and title.lower() == "course title":
                    continue

                sem_match = re.search(r"(1|2)", sem_label)
                if not sem_match:
                    # Sometimes they put 'Semester 1' / 'Semester 2' only once per block;
                    # ignore rows that don't specify semester clearly.
                    continue
                semester = int(sem_match.group(1))

                unit = Unit(
                    code=code,
                    name=title,
                    type="Core",
                    credits=parse_credit(credits),
                )

                # Find or create semester block
                block = next(
                    (b for b in curriculum if b.year == year and b.semester == semester),
                    None,
                )
                if block is None:
                    block = SemesterBlock(year=year, semester=semester, units=[])
                    curriculum.append(block)
                # Avoid duplicates (some pages repeat rows)
                if not any(u.code == unit.code and u.name == unit.name for u in block.units):
                    block.units.append(unit)

    # Sort curriculum by (year, semester)
    curriculum.sort(key=lambda b: (b.year, b.semester))

    return {
        "university": "Makerere University",
        "universityLocation": "Kampala, Uganda",
        "universityMotto": "We Build for the Future",
        "college": program["college"],
        "course": program["name"],
        "duration": duration or None,
        "curriculum": [b.to_json() for b in curriculum],
    }


def scrape_all_mak_programmes() -> List[Dict[str, Any]]:
    programmes = scrape_mak_program_list()
    result: List[Dict[str, Any]] = []
    for idx, p in enumerate(programmes, start=1):
        print(f"[MAK] ({idx}/{len(programmes)}) {p['college']} – {p['name']}")
        try:
            entry = scrape_mak_program_curriculum(p)
            result.append(entry)
        except Exception as e:  # noqa: BLE001
            # Log and keep going; some programmes may have unusual pages.
            print(f"  ! Failed to scrape {p['url']}: {e}", file=sys.stderr)
    return result


# -------- UCU scraping (catalog-level) --------

def scrape_ucu_programmes() -> List[Dict[str, Any]]:
    """
    Scrape UCU programme NAMES for key schools/faculties.

    Many UCU sites use custom WordPress themes where unit-by-unit curricula
    are embedded in arbitrary markup. Here we only return programme metadata
    (no curriculum) so you can later merge AI-scraped curricula into the
    same JSON shape.
    """
    programmes: List[Dict[str, Any]] = []
    for college_name, url in UCU_SITES.items():
        print(f"[UCU] Scraping programmes from {college_name} – {url}")
        try:
            soup = fetch(url)
        except Exception as e:  # noqa: BLE001
            print(f"  ! Failed to fetch {url}: {e}", file=sys.stderr)
            continue

        # Very generic heuristic: look for headings followed by "View Program Details" links.
        for section in soup.find_all(["h2", "h3", "h4"]):
            title = section.get_text(strip=True)
            if not title:
                continue

            # Ignore obvious non-program headings
            if any(bad in title.lower() for bad in ("welcome", "dean", "message", "news", "research")):
                continue

            # Accept things that look like a programme name (start with Diploma/Bachelor/Master)
            if not re.search(r"^(Diploma|Bachelor|Master|PhD)", title, re.I):
                continue

            programmes.append(
                {
                    "university": "Uganda Christian University",
                    "universityLocation": "Mukono, Uganda",
                    "universityMotto": "In the Beginning was the Word",
                    "college": college_name,
                    "course": title,
                    "duration": None,
                    "curriculum": [],
                }
            )

    return programmes


def main() -> None:
    print("Scraping Makerere programmes and curricula...")
    mak_entries = scrape_all_mak_programmes()

    print("Scraping UCU programme catalog (names only)...")
    ucu_entries = scrape_ucu_programmes()

    all_entries: List[Dict[str, Any]] = mak_entries + ucu_entries

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(all_entries, f, ensure_ascii=False, indent=2)

    print(f"\nWrote {len(all_entries)} programmes to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

