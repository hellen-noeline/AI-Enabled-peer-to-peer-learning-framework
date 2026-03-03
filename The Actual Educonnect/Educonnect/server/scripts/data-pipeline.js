/**
 * Data pipeline: collect → clean → load
 * Ingests CSV (e.g. Google Form export), maps columns, cleans, and loads into dataset_students.
 *
 * Usage:
 *   node scripts/data-pipeline.js <path-to.csv> [--source=form] [--dry-run]
 *   node scripts/data-pipeline.js ./form_responses.csv --source=form
 *   node scripts/data-pipeline.js ./form_responses.csv --dry-run   (no DB write, only validate and log)
 *
 * Google Form CSV: download from Form responses → Spreadsheet → File → Download → CSV.
 * Put the CSV path relative to server/ or absolute.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parse } from 'csv-parse/sync'
import { init, getDb } from '../db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SERVER_DIR = path.join(__dirname, '..')

// Map Google Form question text (exact as in export) → dataset_students column name
const GOOGLE_FORM_TO_DATASET = {
  'First name': 'first_name',
  'Last name': 'last_name',
  'Email address': 'email',
  'Phone number': 'phone_number',
  'Date of birth': 'date_of_birth',
  'Gender': 'gender',
  'Nationality': 'nationality',
  'Country of residence': 'country_of_residence',
  'City': 'city',
  'State / Region / District': 'state',
  'Zip / Postal code': 'zip_code',
  'University / Institution name': 'university',
  'Field of study / Major': 'field_of_study',
  'Current year of study': 'year_of_study',
  'Current GPA (if applicable)': 'current_gpa',
  'Credits completed': 'credits_completed',
  'Credits remaining': 'credits_remaining',
  'Courses currently enrolled (e.g. course codes or names)': 'courses_enrolled',
  'Strong topics (subjects you\'re confident in)': 'strong_computing_fields',
  'Topics you want to improve (weaker or want to strengthen)': 'weak_computing_fields',
  'CS / Data / Tech interests (e.g. AI, ML, Data Science, NLP, Web Dev, Cybersecurity)': 'cs_interests',
  'Technical skills (languages, tools, frameworks)': 'technical_skills',
  'Soft skills (e.g. Communication, Leadership, Problem-solving)': 'soft_skills',
  'Research interests (if any)': 'research_interests',
  'Professional / career interests': 'professional_interests',
  'Hobbies (optional)': 'hobbies',
  'Preferred learning style': 'preferred_learning_style',
  'Preferred study partner setup': 'study_partners_preferences',
  'Preferred study environment': 'study_environment',
  'Preferred study time': 'preferred_study_hours',
  'Anything else you want in a study partner? (e.g. same year, same timezone)': 'partner_notes',
  'Short bio (a few lines about you and your goals)': 'bio',
  // Common alternatives
  'Timestamp': '_timestamp',
  'First Name': 'first_name',
  'Last Name': 'last_name',
  'Email Address': 'email',
  'Phone Number': 'phone_number',
  'Date of Birth': 'date_of_birth',
  'University': 'university',
  'Current GPA': 'current_gpa',
  'Credits Completed': 'credits_completed',
  'Credits Remaining': 'credits_remaining',
  'CS and Data Science Interests': 'cs_interests',
  'Technical Skills': 'technical_skills',
  'Soft Skills': 'soft_skills',
  'Research Interests': 'research_interests',
  'Professional Interests': 'professional_interests',
  'Preferred Learning Style': 'preferred_learning_style',
  'Study Partners Preferences': 'study_partners_preferences',
  'Preferred Study Hours': 'preferred_study_hours',
  'Strong Computing Fields': 'strong_computing_fields',
  'Weak Computing Fields': 'weak_computing_fields',
}

const DATASET_COLUMNS = [
  'first_name', 'middle_name', 'last_name', 'gender', 'date_of_birth',
  'nationality', 'country_of_residence', 'phone_number', 'email', 'home_address',
  'city', 'state', 'zip_code', 'university', 'current_gpa', 'credits_completed',
  'credits_remaining', 'courses_enrolled', 'course_codes', 'course_units',
  'technical_skills', 'soft_skills', 'research_interests', 'professional_interests',
  'hobbies', 'preferred_learning_style', 'study_partners_preferences',
  'preferred_study_hours', 'cs_interests', 'strong_computing_fields', 'weak_computing_fields',
]

function trim(s) {
  if (s == null || s === undefined) return ''
  return String(s).trim()
}

function cleanValue(value) {
  const s = trim(value)
  if (s.toLowerCase() === 'n/a' || s.toLowerCase() === 'na' || s === '-') return ''
  return s
}

function randomStudyStats() {
  return JSON.stringify({
    totalHours: Math.floor(Math.random() * 200) + 50,
    weeklyHours: Array.from({ length: 7 }, () => Math.floor(Math.random() * 8) + 2),
    sessionsCompleted: Math.floor(Math.random() * 100) + 20,
    studyProgress: Math.floor(Math.random() * 80) + 10,
  })
}

/**
 * Map a row from Google Form CSV (headers = question text) to dataset_students row.
 */
function mapFormRowToDataset(row, index, source) {
  const out = {
    id: `dataset_${source}_${index}`,
    source,
    registration_number: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: '',
    date_of_birth: '',
    nationality: '',
    country_of_residence: '',
    phone_number: '',
    email: '',
    home_address: '',
    city: '',
    state: '',
    zip_code: '',
    university: '',
    current_gpa: '',
    credits_completed: '',
    credits_remaining: '',
    courses_enrolled: '',
    course_codes: '',
    course_units: '',
    technical_skills: '',
    soft_skills: '',
    research_interests: '',
    professional_interests: '',
    hobbies: '',
    preferred_learning_style: '',
    study_partners_preferences: '',
    preferred_study_hours: '',
    cs_interests: '',
    strong_computing_fields: '',
    weak_computing_fields: '',
    study_stats: randomStudyStats(),
  }

  for (const [formHeader, datasetKey] of Object.entries(GOOGLE_FORM_TO_DATASET)) {
    if (!(formHeader in row)) continue
    const raw = row[formHeader]
    const val = cleanValue(raw)
    if (datasetKey.startsWith('_')) continue // skip e.g. _timestamp
    if (datasetKey === 'courses_enrolled' && val) out.courses_enrolled = val
    else if (datasetKey === 'study_environment' && val) {
      if (out.study_partners_preferences) out.study_partners_preferences += `; ${val}`
      else out.study_partners_preferences = val
    } else if (datasetKey === 'partner_notes' || datasetKey === 'bio' || datasetKey === 'field_of_study' || datasetKey === 'year_of_study') {
      // Store in a column we have or skip; dataset_students has no bio/field/year - could extend later
      if (datasetKey === 'field_of_study' && val) out.courses_enrolled = (out.courses_enrolled ? out.courses_enrolled + '; ' : '') + val
    } else if (out.hasOwnProperty(datasetKey)) {
      out[datasetKey] = val
    }
  }

  return out
}

function loadCSV(filePath) {
  const text = readFileSync(filePath, 'utf-8')
  return parse(text, { columns: true, skip_empty_lines: true, relax_column_count: true })
}

function validateRow(row, index) {
  const errors = []
  if (!trim(row.email)) errors.push('missing email')
  if (!trim(row.first_name) && !trim(row.last_name)) errors.push('missing name')
  return errors
}

async function runPipeline(inputPath, source = 'form', dryRun = false) {
  const resolvedPath = path.isAbsolute(inputPath) ? inputPath : path.join(SERVER_DIR, inputPath)
  if (!existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`)
  }

  const rawRows = loadCSV(resolvedPath)
  const mapped = rawRows.map((row, i) => mapFormRowToDataset(row, i, source))
  const valid = []
  const invalid = []

  mapped.forEach((row, i) => {
    const errs = validateRow(row, i)
    if (errs.length) invalid.push({ index: i, row, errors: errs })
    else valid.push(row)
  })

  if (invalid.length > 0) {
    console.warn(`Skipped ${invalid.length} row(s) with errors:`)
    invalid.slice(0, 5).forEach(({ index, errors }) => console.warn(`  Row ${index + 2}: ${errors.join(', ')}`))
    if (invalid.length > 5) console.warn(`  ... and ${invalid.length - 5} more`)
  }

  console.log(`Cleaned: ${valid.length} valid rows, ${invalid.length} skipped`)

  if (dryRun) {
    console.log('Dry run: no database write. Valid row count:', valid.length)
    return { valid, invalid, inserted: 0 }
  }

  if (valid.length === 0) {
    console.log('No valid rows to insert.')
    return { valid, invalid, inserted: 0 }
  }

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

  db.transaction(() => {
    valid.forEach((r) => insertStmt.run(r))
  })

  console.log(`Inserted ${valid.length} rows into dataset_students (source=${source}).`)
  return { valid, invalid, inserted: valid.length }
}

// Optional: write cleaned CSV for backup or manual review
function escapeCsv(val) {
  const s = String(val ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}
function writeCleanedCSV(rows, outputPath) {
  if (rows.length === 0) return
  const cols = ['id', 'source', ...DATASET_COLUMNS]
  const header = cols.map(escapeCsv).join(',')
  const body = rows.map((r) => cols.map((c) => escapeCsv(r[c])).join(',')).join('\n')
  writeFileSync(outputPath, header + '\n' + body, 'utf-8')
  console.log('Wrote cleaned CSV to', outputPath)
}

// CLI
const args = process.argv.slice(2)
const inputFile = args.find((a) => !a.startsWith('--'))
const source = (args.find((a) => a.startsWith('--source=')) || '--source=form').split('=')[1]
const dryRun = args.includes('--dry-run')
const outCsv = args.find((a) => a.startsWith('--out='))?.split('=')[1]

if (!inputFile) {
  console.log(`
Usage: node scripts/data-pipeline.js <path-to.csv> [options]
  --source=form    Source label (default: form)
  --dry-run       Validate and clean only; do not write to DB
  --out=path.csv  Also write cleaned rows to a CSV file

Example:
  node scripts/data-pipeline.js ./form_responses.csv --source=form
  node scripts/data-pipeline.js ./form_responses.csv --dry-run --out=./cleaned.csv
`)
  process.exit(1)
}

runPipeline(inputFile, source, dryRun)
  .then(({ valid, inserted }) => {
    if (outCsv && valid.length) {
      const outPath = path.isAbsolute(outCsv) ? outCsv : path.join(SERVER_DIR, outCsv)
      writeCleanedCSV(valid, outPath)
    }
  })
  .catch((err) => {
    console.error('Pipeline failed:', err)
    process.exit(1)
  })
