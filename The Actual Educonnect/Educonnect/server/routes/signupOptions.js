import { Router } from 'express'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Resolve public folder: from server/routes -> go up to project root then public; or from server cwd -> ../public
const publicPathFromFile = path.join(__dirname, '..', '..', 'public')
const publicPathFromCwd = path.join(process.cwd(), 'public')
const publicPathFromCwdParent = path.join(process.cwd(), '..', 'public')
function resolvePublicPath() {
  if (existsSync(path.join(publicPathFromFile, 'curriculum_fallback.json'))) return publicPathFromFile
  if (existsSync(path.join(publicPathFromCwd, 'curriculum_fallback.json'))) return publicPathFromCwd
  if (existsSync(path.join(publicPathFromCwdParent, 'curriculum_fallback.json'))) return publicPathFromCwdParent
  return publicPathFromFile
}
const publicPath = resolvePublicPath()
const curriculumPath = path.join(publicPath, 'university_curriculum.json')
const fallbackPath = path.join(publicPath, 'curriculum_fallback.json')

const router = Router()

// Universal options across all fields (Computing, Law, Business, etc.)
const ADDITIONAL_INTERESTS = [
  'AI', 'Machine Learning', 'Data Science', 'NLP', 'Computer Vision', 'Cybersecurity',
  'Web Development', 'Software Engineering', 'Databases', 'Algorithms',
  'Contract Law', 'Constitutional Law', 'Criminal Law', 'International Law', 'Legal Writing',
  'Human Rights', 'Commercial Law', 'Legal Research',
  'Accounting', 'Finance', 'Economics', 'Marketing', 'Human Resources', 'Entrepreneurship',
  'Supply Chain', 'Hospitality', 'Management', 'None'
]

// Static option lists (from dataset placeholders and common values)
const STATIC_OPTIONS = {
  university: [], // filled from curriculum
  degreeProgram: [], // filled from curriculum
  csInterests: ADDITIONAL_INTERESTS, // stored in cs_interests; used as universal "Additional interests"
  technicalSkills: [
    'Python', 'JavaScript', 'Java', 'R', 'SQL', 'Git', 'Docker', 'TensorFlow', 'Pandas',
    'C++', 'React', 'Node.js', 'Machine Learning', 'Deep Learning', 'Cloud Computing',
    'Legal Research', 'Contract Drafting', 'Case Analysis', 'Statutory Interpretation',
    'Accounting', 'Financial Modeling', 'Excel', 'SPSS', 'Project Management'
  ],
  strongTopics: [
    'Algorithms', 'Data Structures', 'Linear Algebra', 'Python', 'Databases',
    'Web Development', 'Machine Learning', 'Programming', 'Software Engineering',
    'Contract Law', 'Constitutional Law', 'Legal Writing', 'Legal Research',
    'Accounting', 'Economics', 'Marketing', 'Management', 'Finance'
  ],
  weakTopics: [
    'Statistics', 'Calculus', 'Networking', 'Operating Systems', 'DevOps',
    'Research Methods', 'Mobile Development', 'Cloud Computing', 'Linear Algebra',
    'Criminal Procedure', 'International Law', 'Legal Latin',
    'Financial Reporting', 'Quantitative Methods', 'Organizational Behavior'
  ],
  softSkills: [
    'Communication', 'Leadership', 'Teamwork', 'Problem-solving', 'Time Management',
    'Critical Thinking', 'Negotiation', 'Presentation', 'Writing', 'Analysis'
  ],
  researchInterests: [
    'Machine Learning', 'AI', 'Cybersecurity', 'Computer Vision', 'NLP', 'Data Science',
    'Artificial Intelligence', 'Human Rights', 'Commercial Law', 'International Law',
    'Consumer Behavior', 'Organizational Strategy', 'Sustainability', 'None'
  ],
  professionalInterests: [
    'ML Engineer', 'Data Scientist', 'Software Engineer', 'Cybersecurity Analyst',
    'AI Researcher', 'Web Developer', 'Lawyer', 'Legal Advisor', 'Judge', 'Legal Researcher',
    'Accountant', 'Financial Analyst', 'Marketing Manager', 'HR Specialist', 'Consultant'
  ],
  hobbies: [
    'Reading', 'Hiking', 'Photography', 'Sports', 'Music', 'Gaming', 'Dancing',
    'Watching films', 'Farming', 'Travel'
  ],
  preferredLearningStyle: ['Visual', 'Auditory', 'Kinesthetic', 'Reading/Writing'],
  studyPartnersPreferences: ['One-on-one', 'Group', 'Online', 'In-person', 'Alone', 'Small group'],
  preferredStudyHours: ['Morning', 'Afternoon', 'Evening', 'Late night'],
  nationality: ['Uganda', 'Kenya', 'Tanzania', 'Rwanda', 'Other'],
  countryOfResidence: ['Uganda', 'Kenya', 'Tanzania', 'Rwanda', 'Other']
}

/** Classify a programme (course + college) into a course area for filtering the degree dropdown */
function getCourseAreaFromProgramme(course, college) {
  const c = (course || '').toLowerCase()
  const g = (college || '').toLowerCase()
  const combined = `${c} ${g}`

  if (/law|llb|legal/.test(combined)) return 'Law'
  if (/agriculture|agri|environmental sciences|crop|soil|agribusiness|extension/.test(combined)) return 'Agriculture'
  if (/business|commerce|accounting|finance|economics|marketing|hr|human resource|hospitality|tourism|logistics|procurement|administration/.test(combined)) return 'Business & Management'
  if (/computing|computer|information technology|software|bit|bcs|informatics|engineering.*technology/.test(combined)) return 'Computing & IT'
  if (/education|teaching|b\.?ed|pedagogy/.test(combined)) return 'Education'
  if (/humanities|literature|philosophy|arts|social sciences|divinity|theology/.test(combined)) return 'Humanities'
  if (/health|nursing|medical|medicine|clinical/.test(combined)) return 'Health'
  return 'Other'
}

function loadCurriculumOptions() {
  const options = { university: [], degreeProgram: [], degreeProgramByCourseArea: {} }
  const programmes = new Set()
  const universities = new Set()
  const byArea = {}

  const courseAreas = ['Computing & IT', 'Law', 'Business & Management', 'Education', 'Humanities', 'Health', 'Agriculture', 'Other']
  courseAreas.forEach((area) => { byArea[area] = new Set() })

  function addFromList(list) {
    if (!Array.isArray(list)) return
    for (const item of list) {
      if (item.university) universities.add(item.university.trim())
      const course = (item.course || '').trim()
      const college = (item.college || '').trim()
      if (!course) continue
      const label = college ? `${course} (${college})` : course
      programmes.add(label)
      const area = getCourseAreaFromProgramme(course, college)
      if (byArea[area]) byArea[area].add(label)
    }
  }
  try {
    if (existsSync(curriculumPath)) {
      const raw = readFileSync(curriculumPath, 'utf8')
      addFromList(JSON.parse(raw))
    }
    if (existsSync(fallbackPath)) {
      const raw = readFileSync(fallbackPath, 'utf8')
      const fallback = JSON.parse(raw)
      addFromList(fallback)
    }
    options.university = [...universities].sort()
    options.degreeProgram = [...programmes].sort()
    options.degreeProgramByCourseArea = {}
    courseAreas.forEach((area) => {
      options.degreeProgramByCourseArea[area] = [...byArea[area]].sort()
    })
  } catch (e) {
    console.warn('Signup options: could not load curriculum', e.message)
  }
  return options
}

// Options tailored by course area so suggestions match the user's field
const OPTIONS_BY_COURSE_AREA = {
  'Computing & IT': {
    strongTopics: ['Algorithms', 'Data Structures', 'Linear Algebra', 'Python', 'Databases', 'Web Development', 'Machine Learning', 'Programming', 'Software Engineering', 'Networking', 'Operating Systems'],
    weakTopics: ['Statistics', 'Calculus', 'DevOps', 'Research Methods', 'Mobile Development', 'Cloud Computing', 'Linear Algebra', 'Security'],
    technicalSkills: ['Python', 'JavaScript', 'Java', 'R', 'SQL', 'Git', 'Docker', 'TensorFlow', 'Pandas', 'C++', 'React', 'Node.js', 'Machine Learning', 'Deep Learning', 'Cloud Computing'],
    professionalInterests: ['ML Engineer', 'Data Scientist', 'Software Engineer', 'Cybersecurity Analyst', 'AI Researcher', 'Web Developer', 'DevOps Engineer'],
    researchInterests: ['Machine Learning', 'AI', 'Cybersecurity', 'Computer Vision', 'NLP', 'Data Science', 'Artificial Intelligence']
  },
  'Law': {
    strongTopics: ['Contract Law', 'Constitutional Law', 'Legal Writing', 'Legal Research', 'Criminal Law', 'International Law', 'Human Rights', 'Commercial Law', 'Tort Law'],
    weakTopics: ['Criminal Procedure', 'International Law', 'Legal Latin', 'Statutory Interpretation', 'Evidence', 'Legal Drafting'],
    technicalSkills: ['Legal Research', 'Contract Drafting', 'Case Analysis', 'Statutory Interpretation', 'Mooting', 'Legal Writing', 'Citation', 'Excel'],
    professionalInterests: ['Lawyer', 'Legal Advisor', 'Judge', 'Legal Researcher', 'Prosecutor', 'Corporate Counsel', 'Human Rights Advocate'],
    researchInterests: ['Human Rights', 'Commercial Law', 'International Law', 'Constitutional Law', 'Criminal Justice', 'Legal Theory']
  },
  'Business & Management': {
    strongTopics: ['Accounting', 'Economics', 'Marketing', 'Management', 'Finance', 'Organizational Behavior', 'Strategy', 'Supply Chain'],
    weakTopics: ['Financial Reporting', 'Quantitative Methods', 'Organizational Behavior', 'Statistics', 'Business Law', 'Taxation'],
    technicalSkills: ['Accounting', 'Financial Modeling', 'Excel', 'SPSS', 'Project Management', 'Data Analysis', 'Presentation', 'CRM'],
    professionalInterests: ['Accountant', 'Financial Analyst', 'Marketing Manager', 'HR Specialist', 'Consultant', 'Entrepreneur', 'Operations Manager'],
    researchInterests: ['Consumer Behavior', 'Organizational Strategy', 'Sustainability', 'Finance', 'Marketing', 'Entrepreneurship']
  },
  'Education': {
    strongTopics: ['Curriculum Design', 'Educational Psychology', 'Assessment', 'Teaching Methods', 'Child Development', 'Literacy', 'Numeracy'],
    weakTopics: ['Research Methods', 'Statistics in Education', 'Special Needs', 'Educational Technology', 'Policy'],
    technicalSkills: ['Lesson Planning', 'Assessment Design', 'Classroom Management', 'EdTech', 'Excel', 'Presentation'],
    professionalInterests: ['Teacher', 'Curriculum Developer', 'Education Consultant', 'School Administrator', 'Tutor', 'Researcher'],
    researchInterests: ['Learning Sciences', 'Educational Policy', 'Teacher Training', 'Inclusive Education', 'EdTech']
  },
  'Humanities': {
    strongTopics: ['Literature', 'History', 'Philosophy', 'Writing', 'Critical Analysis', 'Research Methods'],
    weakTopics: ['Quantitative Methods', 'Statistics', 'Digital Humanities', 'Academic Writing'],
    technicalSkills: ['Research', 'Writing', 'Citation', 'Archival Research', 'Presentation', 'Excel'],
    professionalInterests: ['Writer', 'Researcher', 'Editor', 'Academic', 'Museum Curator', 'Journalist'],
    researchInterests: ['Literature', 'History', 'Philosophy', 'Cultural Studies', 'Gender Studies']
  },
  'Health': {
    strongTopics: ['Anatomy', 'Physiology', 'Clinical Skills', 'Pharmacology', 'Patient Care', 'Medical Ethics'],
    weakTopics: ['Statistics', 'Research Methods', 'Health Informatics', 'Epidemiology'],
    technicalSkills: ['Clinical Assessment', 'Patient Documentation', 'Medical Research', 'Excel', 'SPSS'],
    professionalInterests: ['Nurse', 'Clinical Officer', 'Researcher', 'Health Educator', 'Public Health Specialist'],
    researchInterests: ['Public Health', 'Clinical Research', 'Epidemiology', 'Health Policy']
  },
  'Agriculture': {
    strongTopics: ['Crop Science', 'Soil Science', 'Animal Husbandry', 'Agribusiness', 'Agricultural Economics', 'Extension'],
    weakTopics: ['Statistics', 'Research Methods', 'Agricultural Policy', 'Biotechnology'],
    technicalSkills: ['Field Assessment', 'Data Collection', 'Excel', 'GIS', 'Project Management'],
    professionalInterests: ['Agronomist', 'Extension Officer', 'Agribusiness Manager', 'Researcher', 'Consultant'],
    researchInterests: ['Crop Improvement', 'Sustainable Agriculture', 'Agricultural Economics', 'Climate Resilience']
  },
  'Other': {
    strongTopics: STATIC_OPTIONS.strongTopics,
    weakTopics: STATIC_OPTIONS.weakTopics,
    technicalSkills: STATIC_OPTIONS.technicalSkills,
    professionalInterests: STATIC_OPTIONS.professionalInterests,
    researchInterests: STATIC_OPTIONS.researchInterests
  }
}

function getSuggestions(db, fieldName) {
  try {
    const rows = db.prepare(
      'SELECT value FROM signup_suggestions WHERE field_name = ? ORDER BY use_count DESC'
    ).all(fieldName)
    return rows.map((r) => r.value).filter(Boolean)
  } catch (_) {
    return []
  }
}

function mergeOptions(staticList, suggestedList) {
  const set = new Set([...(staticList || []), ...(suggestedList || [])])
  return [...set]
}

// GET /api/signup-options — all options (curriculum + fallback + static + learned) + by course area
router.get('/signup-options', (req, res) => {
  try {
    const db = req.db
    const fromCurriculum = loadCurriculumOptions()
    const result = {}
    const fieldNames = [
      'university', 'degreeProgram', 'csInterests', 'technicalSkills', 'strongTopics',
      'weakTopics', 'softSkills', 'researchInterests', 'professionalInterests', 'hobbies',
      'preferredLearningStyle', 'studyPartnersPreferences', 'preferredStudyHours',
      'nationality', 'countryOfResidence'
    ]
    for (const field of fieldNames) {
      const staticList = field === 'university' ? fromCurriculum.university
        : field === 'degreeProgram' ? fromCurriculum.degreeProgram
          : (STATIC_OPTIONS[field] || [])
      const suggested = getSuggestions(db, field)
      result[field] = mergeOptions(staticList, suggested)
    }
    result.degreeProgramByCourseArea = fromCurriculum.degreeProgramByCourseArea || {}
    result.optionsByCourseArea = {}
    for (const area of Object.keys(OPTIONS_BY_COURSE_AREA)) {
      const areaOpts = OPTIONS_BY_COURSE_AREA[area]
      result.optionsByCourseArea[area] = {
        strongTopics: mergeOptions(areaOpts.strongTopics, getSuggestions(db, 'strongTopics')),
        weakTopics: mergeOptions(areaOpts.weakTopics, getSuggestions(db, 'weakTopics')),
        technicalSkills: mergeOptions(areaOpts.technicalSkills, getSuggestions(db, 'technicalSkills')),
        professionalInterests: mergeOptions(areaOpts.professionalInterests, getSuggestions(db, 'professionalInterests')),
        researchInterests: mergeOptions(areaOpts.researchInterests, getSuggestions(db, 'researchInterests'))
      }
    }
    res.json(result)
  } catch (err) {
    console.error('Signup options error:', err)
    res.status(500).json({ error: err.message || 'Failed to load options' })
  }
})

// POST /api/signup-suggestions — record a custom value so the "model" learns (options grow)
router.post('/signup-suggestions', (req, res) => {
  try {
    const db = req.db
    const { field, value } = req.body || {}
    const fieldName = (field || '').toString().trim()
    const valueStr = (value || '').toString().trim()
    if (!fieldName || !valueStr) {
      return res.status(400).json({ error: 'field and value are required' })
    }
    const now = new Date().toISOString()
    const existing = db.prepare(
      'SELECT use_count FROM signup_suggestions WHERE field_name = ? AND value = ?'
    ).get(fieldName, valueStr)
    if (existing) {
      db.prepare(
        'UPDATE signup_suggestions SET use_count = use_count + 1 WHERE field_name = ? AND value = ?'
      ).run(fieldName, valueStr)
    } else {
      db.prepare(
        'INSERT INTO signup_suggestions (field_name, value, use_count, created_at) VALUES (?, ?, 1, ?)'
      ).run(fieldName, valueStr, now)
    }
    res.status(201).json({ ok: true })
  } catch (err) {
    console.error('Signup suggestions error:', err)
    res.status(500).json({ error: err.message || 'Failed to save suggestion' })
  }
})

export default router
