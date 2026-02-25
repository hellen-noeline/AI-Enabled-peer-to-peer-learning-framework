/**
 * Populate the database with the Ugandan student dataset.
 * Run from server folder: npm run seed
 * Expects ../public/ugandan_students_dataset_1050.csv
 */
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parse } from 'csv-parse/sync'
import { init, getDb } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public')

function randomStudyStats() {
  return JSON.stringify({
    totalHours: Math.floor(Math.random() * 200) + 50,
    weeklyHours: Array.from({ length: 7 }, () => Math.floor(Math.random() * 8) + 2),
    sessionsCompleted: Math.floor(Math.random() * 100) + 20,
    studyProgress: Math.floor(Math.random() * 80) + 10
  })
}

function loadCSV(filename) {
  const filePath = path.join(publicDir, filename)
  const text = readFileSync(filePath, 'utf-8')
  return parse(text, { columns: true, skip_empty_lines: true, relax_column_count: true })
}

function rowToDatasetStudent(row, index, source) {
  const id = `dataset_${source}_${index}`
  return {
    id,
    source,
    registration_number: row['Registration Number'] ?? '',
    first_name: row['First Name'] ?? '',
    middle_name: row['Middle Name'] ?? '',
    last_name: row['Last Name'] ?? '',
    gender: row['Gender'] ?? '',
    date_of_birth: row['Date of Birth'] ?? '',
    nationality: row['Nationality'] ?? '',
    country_of_residence: row['Country of Residence'] ?? '',
    phone_number: row['Phone Number'] ?? '',
    email: row['Email Address'] ?? '',
    home_address: row['Home Address'] ?? '',
    city: row['City'] ?? '',
    state: row['State'] ?? '',
    zip_code: row['Zip Code'] ?? '',
    university: row['University'] ?? '',
    current_gpa: row['Current GPA / CGPA'] ?? '',
    credits_completed: row['Credits Completed'] ?? '',
    credits_remaining: row['Credits Remaining'] ?? '',
    courses_enrolled: row['Courses Enrolled Per Semester'] ?? '',
    course_codes: row['Course Codes'] ?? '',
    course_units: row['Course Units'] ?? '',
    technical_skills: row['Technical Skills'] ?? '',
    soft_skills: row['Soft Skills'] ?? '',
    research_interests: row['Research Interests'] ?? '',
    professional_interests: row['Professional Interests'] ?? '',
    hobbies: row['Hobbies'] ?? '',
    preferred_learning_style: row['Preferred Learning Style'] ?? '',
    study_partners_preferences: row['Study Partners Preferences'] ?? '',
    preferred_study_hours: row['Preferred Study Hours'] ?? '',
    cs_interests: row['CS and Data Science Interests'] ?? '',
    strong_computing_fields: row['Strong Computing Fields'] ?? '',
    weak_computing_fields: row['Weak Computing Fields'] ?? '',
    study_stats: randomStudyStats()
  }
}

function seedDataset(db, insertStmt, filename, source) {
  const rows = loadCSV(filename)
  let inserted = 0
  db.transaction(() => {
    for (const r of rows.map((row, i) => rowToDatasetStudent(row, i, source))) {
      insertStmt.run(r)
      inserted++
    }
  })
  return inserted
}

async function main() {
  await init()
  const db = getDb()

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO dataset_students (
      id, source, registration_number, first_name, middle_name, last_name, gender,
      date_of_birth, nationality, country_of_residence, phone_number, email, home_address,
      city, state, zip_code, university, current_gpa, credits_completed, credits_remaining,
      courses_enrolled, course_codes, course_units, technical_skills, soft_skills,
      research_interests, professional_interests, hobbies, preferred_learning_style,
      study_partners_preferences, preferred_study_hours, cs_interests,
      strong_computing_fields, weak_computing_fields, study_stats
    ) VALUES (
      @id, @source, @registration_number, @first_name, @middle_name, @last_name, @gender,
      @date_of_birth, @nationality, @country_of_residence, @phone_number, @email, @home_address,
      @city, @state, @zip_code, @university, @current_gpa, @credits_completed, @credits_remaining,
      @courses_enrolled, @course_codes, @course_units, @technical_skills, @soft_skills,
      @research_interests, @professional_interests, @hobbies, @preferred_learning_style,
      @study_partners_preferences, @preferred_study_hours, @cs_interests,
      @strong_computing_fields, @weak_computing_fields, @study_stats
    )
  `)

  db.prepare('DELETE FROM dataset_students').run()

  let total = 0
  try {
    total = seedDataset(db, insertStmt, 'ugandan_students_dataset_1050.csv', 'ug')
    console.log('Inserted Ugandan dataset:', total)
  } catch (e) {
    console.warn('Ugandan dataset not found or error:', e.message)
  }

  console.log('Total dataset_students in database:', total)
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get()
  console.log('Registered users in database:', userCount ? userCount.c : 0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
