import pandas as pd
import numpy as np
import random
import os

# File paths
ucu_file = r"c:\Users\RONALD TUSIIME KIGAM\Desktop\The Actual Educonnect (2)\students_expanded_UCU.xlsx"
us_file = r"c:\Users\RONALD TUSIIME KIGAM\Desktop\The Actual Educonnect (2)\The Actual Educonnect\Educonnect\public\educonnect_students_unified.csv"
output_file = r"c:\Users\RONALD TUSIIME KIGAM\Desktop\The Actual Educonnect (2)\The Actual Educonnect\Educonnect\public\educonnect_students_unified.csv"

# Load datasets
try:
    df_ucu = pd.read_excel(ucu_file)
    print(f"Loaded UCU dataset: {df_ucu.shape[0]} rows")
except Exception as e:
    print(f"Error loading UCU dataset: {e}")
    exit(1)

try:
    df_us = pd.read_csv(us_file)
    print(f"Loaded US dataset: {df_us.shape[0]} rows")
except Exception as e:
    print(f"Error loading US dataset: {e}")
    exit(1)

# Schema mapping
uc_columns = df_us.columns.tolist()
df_transformed = pd.DataFrame(columns=uc_columns)

# Useful random lists for mock data (aligned with Educonnect expected schema)
tech_skills = ["Java", "Python", "C++", "JavaScript", "React", "Node.js", "SQL", "MongoDB", "AWS", "Git", "Docker", "Machine Learning", "Data Analysis", "Flutter"]
soft_skills = ["Communication", "Teamwork", "Problem-solving", "Time Management", "Critical Thinking", "Leadership", "Adaptability"]
hobbies = ["Reading", "Sports", "Music", "Photography", "Gaming", "Cooking", "Hiking", "Traveling", "Volunteering"]
learning_styles = ["Visual", "Auditory", "Reading/Writing", "Kinesthetic"]
study_prefs = ["Alone", "One-on-one", "Small group", "Online"]
study_hours = ["Morning", "Afternoon", "Evening", "Late night"]
interests = ["Artificial Intelligence", "Cybersecurity", "Data Science", "Software Engineering", "Web Development", "Mobile App Development", "Cloud Computing"]

def get_random_sample(lst, min_val=1, max_val=4):
    return ", ".join(random.sample(lst, random.randint(min_val, min_val)))

transformed_rows = []

for idx, row in df_ucu.iterrows():
    name_parts = str(row.get('NAME', '')).strip().split(' ', 1)
    first_name = name_parts[0] if len(name_parts) > 0 else "Unknown"
    last_name = name_parts[1] if len(name_parts) > 1 else ""
    
    # Generate random GPA between 2.0 and 4.0 matching their Fees/Scholarship somehow, or just random
    gpa = round(random.uniform(2.5, 4.0), 2)
    
    # Generate phone
    phone = f"+256 7{random.randint(10,99)} {random.randint(100,999)} {random.randint(100,999)}"
    
    # Registration number mapping
    reg_no = str(row.get('REG. NO.', f"UCU{random.randint(1000, 9999)}"))
    
    new_row = {
        'Registration Number': reg_no,
        'First Name': first_name,
        'Middle Name': "",
        'Last Name': last_name,
        'Gender': random.choice(['Male', 'Female']),
        'Date of Birth': f"{random.randint(1998, 2005)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
        'Nationality': row.get('NATIONALITY', 'Ugandan'),
        'Country of Residence': 'Uganda',
        'Phone Number': phone,
        'Email Address': f"{first_name.lower()}.{last_name.lower().replace(' ', '')}@students.ucu.ac.ug",
        'Home Address': f"{row.get('DISTRICT', 'Kampala')} District",
        'City': str(row.get('DISTRICT', 'Kampala')),
        'State': 'Central',
        'Zip Code': '00000',
        'University': 'Uganda Christian University',
        'Current GPA / CGPA': gpa,
        'Previous GPA (historic tracking)': f"{round(gpa - random.uniform(-0.3, 0.3), 2)}; {round(gpa - random.uniform(-0.3, 0.3), 2)}",
        'Credits Completed': random.randint(30, 120),
        'Credits Remaining': random.randint(10, 60),
        'Courses Enrolled Per Semester': random.randint(4, 7),
        'Course Codes': str(row.get('RETAKE COURSES', 'CS101, MATH201')),
        'Course Units': random.randint(12, 21),
        'Technical Skills': get_random_sample(tech_skills, 2, 5),
        'Soft Skills': get_random_sample(soft_skills, 3, 5),
        'Research Interests': get_random_sample(interests, 1, 3),
        'Professional Interests': get_random_sample(interests, 1, 3),
        'Hobbies': get_random_sample(hobbies, 2, 4),
        'Preferred Learning Style': random.choice(learning_styles),
        'Study Partners Preferences': random.choice(study_prefs),
        'Preferred Study Hours': random.choice(study_hours),
        'CS and Data Science Interests': get_random_sample(interests, 1, 3)
    }
    transformed_rows.append(new_row)

df_transformed = pd.DataFrame(transformed_rows)
print(f"Transformed UCU dataset into {len(df_transformed)} rows.")

# Merge datasets
df_unified = pd.concat([df_us, df_transformed], ignore_index=True)

# Save to CSV
df_unified.to_csv(output_file, index=False)
print(f"Successfully saved unified dataset to {output_file} with {len(df_unified)} total rows.")
