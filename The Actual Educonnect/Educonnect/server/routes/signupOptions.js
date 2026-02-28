import { Router } from 'express'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicPath = path.join(__dirname, '..', '..', 'public')
const curriculumPath = path.join(publicPath, 'university_curriculum.json')

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

function loadCurriculumOptions() {
  const options = { university: [], degreeProgram: [] }
  if (!existsSync(curriculumPath)) return options
  try {
    const raw = readFileSync(curriculumPath, 'utf8')
    const list = JSON.parse(raw)
    if (!Array.isArray(list)) return options
    const universities = new Set()
    const programmes = new Set()
    for (const item of list) {
      if (item.university) universities.add(item.university.trim())
      const course = (item.course || '').trim()
      const college = (item.college || '').trim()
      if (course) {
        programmes.add(college ? `${course} (${college})` : course)
      }
    }
    options.university = [...universities].sort()
    options.degreeProgram = [...programmes].sort()
  } catch (e) {
    console.warn('Signup options: could not load curriculum', e.message)
  }
  return options
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

// GET /api/signup-options — all options (from curriculum + static + learned suggestions)
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
