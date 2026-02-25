import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const router = Router()
const SALT_ROUNDS = 10

// Emails that get admin role on signup (env: ADMIN_EMAILS comma-separated, or default)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'admin@educonnect.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

function getRoleForEmail(email) {
  return email && ADMIN_EMAILS.includes((email || '').trim().toLowerCase()) ? 'admin' : 'user'
}

function userRowToObject(row) {
  if (!row) return null
  const studyStats = row.study_stats ? JSON.parse(row.study_stats) : {
    totalHours: 0,
    weeklyHours: [0, 0, 0, 0, 0, 0, 0],
    sessionsCompleted: 0,
    studyProgress: 0
  }
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phoneNumber: row.phone_number,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    nationality: row.nationality,
    countryOfResidence: row.country_of_residence,
    city: row.city,
    state: row.state,
    zipCode: row.zip_code,
    university: row.university,
    currentGPA: row.current_gpa,
    creditsCompleted: row.credits_completed,
    creditsRemaining: row.credits_remaining,
    coursesEnrolled: row.courses_enrolled,
    courseCodes: row.course_codes,
    courseUnits: row.course_units,
    technicalSkills: row.technical_skills || '',
    softSkills: row.soft_skills || '',
    researchInterests: row.research_interests || '',
    professionalInterests: row.professional_interests || '',
    hobbies: row.hobbies || '',
    csInterests: row.cs_interests || '',
    strongTopics: row.strong_topics || '',
    weakTopics: row.weak_topics || '',
    preferredLearningStyle: row.preferred_learning_style || '',
    studyPartnersPreferences: row.study_partners_preferences || '',
    preferredStudyHours: row.preferred_study_hours || '',
    bio: row.bio || '',
    profilePicture: row.profile_picture || '',
    studyStats,
    lastWeekReset: row.last_week_reset,
    createdAt: row.created_at,
    lastLoginTime: row.last_login_time,
    role: row.role || 'user'
  }
}

function userDataToRow(userData, id, passwordHash) {
  const now = new Date().toISOString()
  const studyStats = userData.studyStats || {
    totalHours: 0,
    weeklyHours: [0, 0, 0, 0, 0, 0, 0],
    sessionsCompleted: 0,
    studyProgress: 0
  }
  return {
    id: id || randomUUID(),
    email: (userData.email || '').trim().toLowerCase(),
    password_hash: passwordHash,
    first_name: userData.firstName ?? '',
    last_name: userData.lastName ?? '',
    phone_number: userData.phoneNumber ?? '',
    date_of_birth: userData.dateOfBirth ?? '',
    gender: userData.gender ?? '',
    nationality: userData.nationality ?? '',
    country_of_residence: userData.countryOfResidence ?? '',
    city: userData.city ?? '',
    state: userData.state ?? '',
    zip_code: userData.zipCode ?? '',
    university: userData.university ?? '',
    current_gpa: userData.currentGPA ?? '',
    credits_completed: userData.creditsCompleted ?? '',
    credits_remaining: userData.creditsRemaining ?? '',
    courses_enrolled: userData.coursesEnrolled ?? '',
    course_codes: userData.courseCodes ?? '',
    course_units: userData.courseUnits ?? '',
    technical_skills: userData.technicalSkills ?? '',
    soft_skills: userData.softSkills ?? '',
    research_interests: userData.researchInterests ?? '',
    professional_interests: userData.professionalInterests ?? '',
    hobbies: userData.hobbies ?? '',
    cs_interests: userData.csInterests ?? '',
    strong_topics: userData.strongTopics ?? '',
    weak_topics: userData.weakTopics ?? '',
    preferred_learning_style: userData.preferredLearningStyle ?? '',
    study_partners_preferences: userData.studyPartnersPreferences ?? '',
    preferred_study_hours: userData.preferredStudyHours ?? '',
    bio: userData.bio ?? '',
    profile_picture: userData.profilePicture ?? '',
    study_stats: JSON.stringify(studyStats),
    last_week_reset: userData.lastWeekReset ?? now,
    created_at: userData.createdAt ?? now,
    last_login_time: userData.lastLoginTime ?? null,
    role: userData.role ?? getRoleForEmail(userData.email)
  }
}

router.post('/signup', async (req, res) => {
  try {
    const userData = req.body || {}
    const email = (userData.email || '').trim().toLowerCase()
    const password = userData.password

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const existing = req.db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' })
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const id = randomUUID()
    const row = userDataToRow({ ...userData, createdAt: new Date().toISOString() }, id, passwordHash)

    const role = getRoleForEmail(email)
    req.db.prepare(`
      INSERT INTO users (
        id, email, password_hash, first_name, last_name, phone_number, date_of_birth,
        gender, nationality, country_of_residence, city, state, zip_code, university,
        current_gpa, credits_completed, credits_remaining, courses_enrolled, course_codes,
        course_units, technical_skills, soft_skills, research_interests, professional_interests,
        hobbies, cs_interests, strong_topics, weak_topics, preferred_learning_style,
        study_partners_preferences, preferred_study_hours, bio, profile_picture, study_stats,
        last_week_reset, created_at, last_login_time, role
      ) VALUES (
        @id, @email, @password_hash, @first_name, @last_name, @phone_number, @date_of_birth,
        @gender, @nationality, @country_of_residence, @city, @state, @zip_code, @university,
        @current_gpa, @credits_completed, @credits_remaining, @courses_enrolled, @course_codes,
        @course_units, @technical_skills, @soft_skills, @research_interests, @professional_interests,
        @hobbies, @cs_interests, @strong_topics, @weak_topics, @preferred_learning_style,
        @study_partners_preferences, @preferred_study_hours, @bio, @profile_picture, @study_stats,
        @last_week_reset, @created_at, @last_login_time, @role
      )
    `).run({ ...row, role })

    const user = userRowToObject(req.db.prepare('SELECT * FROM users WHERE id = ?').get(id))
    res.status(201).json({ user })
  } catch (err) {
    console.error('Signup error:', err)
    res.status(500).json({ error: err.message || 'Sign up failed' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    const emailNorm = (email || '').trim().toLowerCase()

    if (!emailNorm || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const row = req.db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(emailNorm)
    if (!row) {
      return res.status(401).json({ error: 'No account found with this email' })
    }

    const match = await bcrypt.compare(password, row.password_hash)
    if (!match) {
      return res.status(401).json({ error: 'Incorrect password' })
    }

    const now = new Date().toISOString()
    req.db.prepare('UPDATE users SET last_login_time = ? WHERE id = ?').run(now, row.id)
    if ((row.role || 'user') === 'user' && getRoleForEmail(row.email) === 'admin') {
      req.db.prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', row.id)
    }
    const user = userRowToObject(req.db.prepare('SELECT * FROM users WHERE id = ?').get(row.id))
    res.json({ user })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: err.message || 'Login failed' })
  }
})

export default router
