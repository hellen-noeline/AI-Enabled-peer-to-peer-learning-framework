import { Router } from 'express'

const router = Router()

function rowToUser(row) {
  if (!row) return null
  const studyStats = row.study_stats ? JSON.parse(row.study_stats) : row.study_stats
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
    degreeProgram: row.degree_program || '',
    courseArea: row.course_area || '',
    orderedInterests: row.ordered_interests || '',
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
    studyStats: studyStats || { totalHours: 0, weeklyHours: [0,0,0,0,0,0,0], sessionsCompleted: 0, studyProgress: 0 },
    lastWeekReset: row.last_week_reset,
    createdAt: row.created_at,
    lastLoginTime: row.last_login_time
  }
}

const KEY_TO_COL = {
  studyStats: 'study_stats',
  lastWeekReset: 'last_week_reset',
  firstName: 'first_name',
  lastName: 'last_name',
  phoneNumber: 'phone_number',
  dateOfBirth: 'date_of_birth',
  gender: 'gender',
  city: 'city',
  state: 'state',
  zipCode: 'zip_code',
  university: 'university',
  degreeProgram: 'degree_program',
  courseArea: 'course_area',
  orderedInterests: 'ordered_interests',
  technicalSkills: 'technical_skills',
  softSkills: 'soft_skills',
  researchInterests: 'research_interests',
  professionalInterests: 'professional_interests',
  hobbies: 'hobbies',
  csInterests: 'cs_interests',
  strongTopics: 'strong_topics',
  weakTopics: 'weak_topics',
  preferredLearningStyle: 'preferred_learning_style',
  studyPartnersPreferences: 'study_partners_preferences',
  preferredStudyHours: 'preferred_study_hours',
  bio: 'bio',
  profilePicture: 'profile_picture'
}

// PATCH /api/users/:id – update user (e.g. study stats)
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body || {}

    const row = req.db.prepare('SELECT * FROM users WHERE id = ?').get(id)
    if (!row) {
      return res.status(404).json({ error: 'User not found' })
    }

    for (const [key, col] of Object.entries(KEY_TO_COL)) {
      if (!(key in updates)) continue
      const val = key === 'studyStats' ? JSON.stringify(updates[key]) : updates[key]
      req.db.prepare(`UPDATE users SET ${col} = ? WHERE id = ?`).run(val, id)
    }

    const updated = req.db.prepare('SELECT * FROM users WHERE id = ?').get(id)
    res.json({ user: rowToUser(updated) })
  } catch (err) {
    console.error('Update user error:', err)
    res.status(500).json({ error: err.message || 'Update failed' })
  }
})

export default router
