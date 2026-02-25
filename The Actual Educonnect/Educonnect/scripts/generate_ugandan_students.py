#!/usr/bin/env python3
"""
Generate a CSV dataset of 1000+ Ugandan students for EduConnect.
Compatible with existing dataset loader and recommendation engine.
"""
import csv
import random
from pathlib import Path

# Ugandan first names (male and female)
MALE_FIRST_NAMES = [
    "John", "Joseph", "Moses", "Robert", "Charles", "James", "David", "Richard",
    "Patrick", "Peter", "Emmanuel", "Francis", "Godfrey", "Fred", "Stephen", "Ronald",
    "Alex", "Paul", "Julius", "Samuel", "George", "Simon", "Denis", "Edward", "Isaac",
    "Michael", "William", "Christopher", "Daniel", "Vincent", "Bosco", "Ivan", "Brian",
    "Martin", "Henry", "Kenneth", "Andrew", "Mark", "Thomas", "Phillip", "Lawrence",
    "Eric", "Brian", "Tony", "Frank", "Raymond", "Nathan", "Solomon", "Isaac", "Abel"
]
FEMALE_FIRST_NAMES = [
    "Rose", "Grace", "Mary", "Sarah", "Christine", "Florence", "Annet", "Betty",
    "Margaret", "Jane", "Agnes", "Harriet", "Joyce", "Justine", "Beatrice", "Alice",
    "Juliet", "Esther", "Helen", "Irene", "Maria", "Ruth", "Stella", "Jackline", "Anna",
    "Josephine", "Janet", "Sylvia", "Susan", "Lydia", "Joan", "Dorothy", "Catherine",
    "Proscovia", "Nakato", "Nalwadda", "Scovia", "Jesca", "Violet", "Martha", "Rachel",
    "Patience", "Mercy", "Faith", "Hope", "Peace", "Prossy", "Doreen", "Sharon", "Pamela"
]

# Ugandan surnames / family names
SURNAMES = [
    "Mugisha", "Asiimwe", "Okello", "Odongo", "Ochieng", "Akena", "Kato", "Ssebagala",
    "Nakato", "Nalwadda", "Tumusiime", "Nabukenya", "Ssentongo", "Mukasa", "Lubega",
    "Nsubuga", "Wandera", "Kasozi", "Ssali", "Kiggundu", "Namyalo", "Nabunya", "Kayongo",
    "Opolot", "Otim", "Adong", "Aceng", "Among", "Amony", "Oryem", "Ocen", "Lakot",
    "Ojok", "Opiyo", "Owino", "Omondi", "Otieno", "Aol", "Aciro", "Laker", "Acan",
    "Ojara", "Komakech", "Okot", "Ojul", "Oloya", "Opio", "Obita", "Odoch", "King",
    "Moses", "Joseph", "Paul", "Official", "Bae"  # some common as surnames in census
]

# Ugandan universities (public and major private)
UNIVERSITIES = [
    "Makerere University",
    "Kyambogo University",
    "Mbarara University of Science and Technology",
    "Gulu University",
    "Busitema University",
    "Lira University",
    "Kabale University",
    "Muni University",
    "Soroti University",
    "Mountains of the Moon University",
    "Makerere University Business School",
    "Uganda Martyrs University",
    "Uganda Christian University",
    "Kampala International University",
    "Islamic University in Uganda",
    "Ndejje University",
    "Cavendish University Uganda",
    "Victoria University Uganda",
    "Bishop Stuart University",
    "Nkumba University",
    "Bugema University",
    "Kampala University",
    "St. Lawrence University",
    "Uganda Pentecostal University",
    "Busoga University",
    "Clarke International University",
    "International University of East Africa",
    "All Saints University",
    "Ankole Western University",
    "Great Lakes Regional University",
    "Nsaka University",
    "King Ceasor University",
    "ISBAT University",
    "African Rural University",
    "Uganda Management Institute",
]

# Ugandan cities and districts (city, state/district)
CITIES_STATES = [
    ("Kampala", "Kampala"), ("Kampala", "Wakiso"), ("Entebbe", "Wakiso"),
    ("Jinja", "Jinja"), ("Mbarara", "Mbarara"), ("Gulu", "Gulu"),
    ("Lira", "Lira"), ("Mbale", "Mbale"), ("Fort Portal", "Kabarole"),
    ("Masaka", "Masaka"), ("Soroti", "Soroti"), ("Arua", "Arua"),
    ("Kabale", "Kabale"), ("Mukono", "Mukono"), ("Kasese", "Kasese"),
    ("Hoima", "Hoima"), ("Iganga", "Iganga"), ("Njeru", "Buikwe"),
    ("Nkozi", "Mpigi"), ("Ndejje", "Luwero"), ("Nkumba", "Wakiso"),
    ("Busitema", "Busia"), ("Kumi", "Kumi"), ("Lira", "Lira"),
    ("Budaka", "Budaka"), ("Kabwohe", "Sheema"), ("Ibanda", "Ibanda"),
    ("Kisoro", "Kisoro"), ("Lugazi", "Buikwe"), ("Masaka", "Masaka"),
]

# Course codes (computing / general - same style as US dataset)
COURSE_CODES_POOL = [
    "CS101", "CS201", "DATA201", "DS401", "AI501", "ML502", "CYBER301",
    "EE301", "MATH101", "PHYS101", "BIO202", "PSY101", "ECON101"
]

# Technical skills
TECH_SKILLS_POOL = [
    "Python", "Java", "JavaScript", "C++", "R", "SQL", "Git", "Docker",
    "Machine Learning", "TensorFlow", "PyTorch", "Deep Learning", "Pandas",
    "AWS", "Cybersecurity", "Machine Learning"
]

# Soft skills
SOFT_SKILLS_POOL = [
    "Communication", "Teamwork", "Problem-solving", "Critical Thinking",
    "Time Management", "Leadership"
]

# Research interests
RESEARCH_POOL = [
    "Machine Learning", "NLP", "Data Science", "Artificial Intelligence",
    "Computer Vision", "Cybersecurity", "None"
]

# Professional interests
PROFESSIONAL_POOL = [
    "Software Engineer", "ML Engineer", "Data Scientist", "AI Researcher",
    "Cybersecurity Analyst"
]

# Hobbies
HOBBIES_POOL = [
    "Reading", "Gaming", "Music", "Sports", "Photography", "Hiking",
    "Cooking", "Watching films", "Dancing", "Farming", "Football"
]

# Learning styles
LEARNING_STYLES = ["Visual", "Auditory", "Reading/Writing", "Kinesthetic"]

# Partner preferences
PARTNER_PREFS = ["One-on-one", "Small group", "Online", "Alone"]

# Study hours
STUDY_HOURS = ["Morning", "Afternoon", "Evening", "Late night"]

# CS and Data Science interests (comma-separated in output)
CS_INTERESTS_POOL = [
    "AI", "Machine Learning", "Data Science", "NLP", "Computer Vision",
    "Cybersecurity", "None"
]

# Strong / weak computing fields (user-requested)
STRONG_FIELDS_POOL = [
    "Programming", "Data Structures", "Machine Learning", "Web Development",
    "Databases", "Algorithms", "Networking", "Software Engineering"
]
WEAK_FIELDS_POOL = [
    "Statistics", "Linear Algebra", "Security", "Cloud Computing",
    "Mobile Development", "DevOps", "Research Methods"
]


def random_date_of_birth():
    """Generate DOB between 1998 and 2006."""
    y = random.randint(1998, 2006)
    m = random.randint(1, 12)
    d = random.randint(1, 28)
    return f"{y}-{m:02d}-{d:02d}"


def random_phone():
    """Ugandan mobile: +256 7XX XXX XXX (9 digits after 7)."""
    prefix = random.choice(["70", "71", "72", "74", "75", "76", "77", "78", "79"])
    rest = "".join(str(random.randint(0, 9)) for _ in range(7))
    return f"+256 {prefix} {rest[:3]} {rest[3:6]} {rest[6:]}"


def random_email(first_name, last_name, i):
    """Generate email."""
    domains = ["gmail.com", "yahoo.com", "outlook.com", "co.ug", "mail.com"]
    d = random.choice(domains)
    sep = random.choice([".", "_", ""])
    return f"{first_name.lower()}{sep}{last_name.lower()}{i}@{d}".replace(" ", "")


def pick_multiple(pool, min_n=1, max_n=4, sep=", "):
    return sep.join(random.sample(pool, k=random.randint(min_n, min(max_n, len(pool)))))


def pick_one(pool):
    return random.choice(pool)


def main():
    out_dir = Path(__file__).resolve().parent.parent / "public"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "ugandan_students_dataset_1050.csv"

    columns = [
        "Registration Number", "First Name", "Middle Name", "Last Name", "Gender",
        "Date of Birth", "Nationality", "Country of Residence", "Phone Number",
        "Email Address", "Home Address", "City", "State", "Zip Code", "University",
        "Current GPA / CGPA", "Previous GPA (historic tracking)", "Credits Completed",
        "Credits Remaining", "Courses Enrolled Per Semester", "Course Codes",
        "Course Units", "Technical Skills", "Soft Skills", "Research Interests",
        "Professional Interests", "Hobbies", "Preferred Learning Style",
        "Study Partners Preferences", "Preferred Study Hours",
        "CS and Data Science Interests", "Strong Computing Fields", "Weak Computing Fields"
    ]

    n = 1050
    used_emails = set()
    used_reg = set()

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(columns)

        for i in range(1, n + 1):
            gender = pick_one(["Male", "Female"])
            first_name = pick_one(MALE_FIRST_NAMES if gender == "Male" else FEMALE_FIRST_NAMES)
            last_name = pick_one(SURNAMES)
            middle_name = pick_one(MALE_FIRST_NAMES + FEMALE_FIRST_NAMES) if random.random() > 0.4 else ""

            # Unique registration number (e.g. 22XXXXXX style)
            while True:
                reg = f"22{random.randint(100000, 999999)}"
                if reg not in used_reg:
                    used_reg.add(reg)
                    break

            dob = random_date_of_birth()
            city, state = pick_one(CITIES_STATES)
            university = pick_one(UNIVERSITIES)
            email = random_email(first_name, last_name, i)
            while email in used_emails:
                email = random_email(first_name, last_name, i + n + random.randint(1, 999))
            used_emails.add(email)

            credits_done = random.randint(15, 130)
            credits_remain = random.randint(0, 110)
            n_courses = random.randint(3, 6)
            course_codes = pick_multiple(COURSE_CODES_POOL, n_courses, n_courses)
            course_units = random.randint(9, 22)

            gpa = round(random.uniform(2.2, 4.0), 2)
            prev_gpa = round(random.uniform(2.0, 4.0), 2) if random.random() > 0.3 else "None"

            tech_skills = pick_multiple(TECH_SKILLS_POOL, 2, 8)
            soft_skills = pick_multiple(SOFT_SKILLS_POOL, 2, 6)
            research = pick_multiple(RESEARCH_POOL, 1, 4)
            professional = pick_multiple(PROFESSIONAL_POOL, 1, 4)
            hobbies = pick_multiple(HOBBIES_POOL, 1, 6)
            learning = pick_one(LEARNING_STYLES)
            partner_pref = pick_one(PARTNER_PREFS)
            study_hrs = pick_one(STUDY_HOURS)
            cs_interests = pick_multiple(CS_INTERESTS_POOL, 1, 5)
            strong_fields = pick_multiple(STRONG_FIELDS_POOL, 1, 4)
            weak_fields = pick_multiple(WEAK_FIELDS_POOL, 1, 3)

            # Address and zip (use district code as zip for Uganda)
            zip_code = str(random.randint(10000, 99999))
            address = f"{random.randint(1, 999)} {pick_one(['Plot', 'Road', 'Street', 'Avenue'])} {pick_one(['Central', 'Upper', 'Lower', ''])} {city}"

            row = [
                reg, first_name, middle_name, last_name, gender, dob,
                "Uganda", "Uganda", random_phone(), email, address, city, state, zip_code,
                university, gpa, prev_gpa, credits_done, credits_remain, n_courses,
                course_codes, course_units, tech_skills, soft_skills, research,
                professional, hobbies, learning, partner_pref, study_hrs, cs_interests,
                strong_fields, weak_fields
            ]
            writer.writerow(row)

    print(f"Generated {n} Ugandan students -> {out_path}")
    return out_path


if __name__ == "__main__":
    main()
