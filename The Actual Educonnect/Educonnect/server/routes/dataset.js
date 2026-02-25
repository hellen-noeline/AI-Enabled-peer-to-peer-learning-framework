import { Router } from 'express'

const router = Router()

function rowToUser(row) {
  if (!row) return null
  const studyStats = row.study_stats ? JSON.parse(row.study_stats) : {
    totalHours: 0,
    weeklyHours: [0, 0, 0, 0, 0, 0, 0],
    sessionsCompleted: 0,
    studyProgress: 0
  }
  return {
    id: row.id,
    registrationNumber: row.registration_number,
    firstName: row.first_name,
    middleName: row.middle_name || '',
    lastName: row.last_name,
    gender: row.gender,
    dateOfBirth: row.date_of_birth,
    nationality: row.nationality,
    countryOfResidence: row.country_of_residence,
    phoneNumber: row.phone_number,
    email: row.email,
    homeAddress: row.home_address,
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
    preferredLearningStyle: row.preferred_learning_style || '',
    studyPartnersPreferences: row.study_partners_preferences || '',
    preferredStudyHours: row.preferred_study_hours || '',
    csInterests: row.cs_interests || '',
    strongComputingFields: row.strong_computing_fields || '',
    weakComputingFields: row.weak_computing_fields || '',
    isFromDataset: true,
    studyStats
  }
}

// GET /api/dataset-students – all dataset students (for recommendations)
router.get('/dataset-students', (req, res) => {
  try {
    const rows = req.db.prepare('SELECT * FROM dataset_students ORDER BY id').all()
    const users = rows.map(rowToUser)
    res.json({ users })
  } catch (err) {
    console.error('Dataset students error:', err)
    res.status(500).json({ error: err.message || 'Failed to fetch dataset' })
  }
})

export default router
