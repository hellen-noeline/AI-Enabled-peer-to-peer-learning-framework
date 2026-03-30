import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { fetchSignupOptions, submitSignupSuggestion } from '../api/signupOptionsApi'
import DropdownWithSpecify from '../components/DropdownWithSpecify'
import '../styles/SignUp.css'

function MultiSelectDropdown({ name, label, value, options, onChange, hint, required }) {
  const selected = value
    ? value.split(',').map((s) => s.trim()).filter(Boolean)
    : []
  return (
    <div className="form-group full-width">
      <label>
        {label}
        {required && ' *'}
      </label>
      {hint && <p className="form-hint">{hint}</p>}
      <select
        name={name}
        multiple
        className="signup-multi-select"
        size={5}
        value={selected}
        onChange={(e) => {
          const opts = [...e.target.selectedOptions].map((o) => o.value)
          onChange({ target: { name, value: opts.join(', ') } })
        }}
      >
        {(options || []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}

const DISCIPLINE_TRACKS = [
  'Computing & IT',
  'Law',
  'Business & Management',
  'Education',
  'Humanities',
  'Health',
  'Agriculture',
  'Engineering',
  'Social Sciences',
  'Creative Arts',
  'Other'
]

const LEARNING_PATHWAYS = [
  'Research-oriented',
  'Career / industry focused',
  'Exam-focused',
  'Balanced',
  'Exploratory / undecided'
]

const MODULE_PATHWAYS = [
  'Core / foundation modules',
  'Thesis or dissertation track',
  'Internship or placement track',
  'Elective-heavy pathway',
  'Professional certification prep',
  'Not sure yet'
]

function buildOrderedInterestsFromRanks(form) {
  const parts = [form.disciplineTrack, form.interestRank1, form.interestRank2, form.interestRank3]
    .map((x) => (x || '').trim())
    .filter(Boolean)
  return [...new Set(parts)]
}

function SignUp() {
  const navigate = useNavigate()
  const { signup, isAdminEmail } = useAuth()
  const [signUpAs, setSignUpAs] = useState('user') // 'user' | 'admin'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [signupOptions, setSignupOptions] = useState({})
  const { setTheme } = useTheme()
  const totalSteps = signUpAs === 'admin' ? 1 : 4
  const previousThemeRef = useRef(null)

  useEffect(() => {
    try {
      previousThemeRef.current = localStorage.getItem('EduConnect_theme') || 'dark'
    } catch {
      previousThemeRef.current = 'dark'
    }
    setTheme('light')
    return () => {
      if (previousThemeRef.current) setTheme(previousThemeRef.current)
    }
  }, [setTheme])

  useEffect(() => {
    let cancelled = false
    fetchSignupOptions()
      .then((data) => { if (!cancelled) setSignupOptions(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const [formData, setFormData] = useState({
    // Basic Info
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    countryOfResidence: '',
    city: '',
    state: '',
    zipCode: '',
    university: '',
    degreeProgram: '',
    courseArea: '',
    orderedInterests: '',

    // Academic Info
    creditsCompleted: '',
    creditsRemaining: '',
    coursesEnrolled: '',
    courseCodes: '',
    courseUnits: '',
    
    // Skills & Interests
    technicalSkills: '',
    softSkills: '',
    researchInterests: '',
    professionalInterests: '',
    hobbies: '',
    csInterests: '',
    strongTopics: '',
    weakTopics: '',
    
    // Study Preferences
    preferredLearningStyle: '',
    studyPartnersPreferences: '',
    preferredStudyHours: '',
    
    // Profile
    bio: '',
    profilePicture: '',

    // Step 3 — built into orderedInterests / csInterests at submit (not separate DB columns)
    disciplineTrack: '',
    interestRank1: '',
    interestRank2: '',
    interestRank3: '',
    learningPathway: '',
    modulePathway: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const next = { ...prev, [name]: value }
      if (name === 'courseArea') next.degreeProgram = ''
      return next
    })
  }

  const handleMultiSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateStep = (step) => {
    if (signUpAs === 'admin') {
      return formData.firstName && formData.lastName && formData.email &&
             formData.password && formData.confirmPassword &&
             formData.password === formData.confirmPassword
    }
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName && formData.email &&
               formData.password && formData.confirmPassword &&
               formData.password === formData.confirmPassword
      case 2:
        return formData.university && formData.courseArea
      case 3: {
        const built = buildOrderedInterestsFromRanks(formData)
        return built.length > 0 && !!(formData.disciplineTrack && formData.interestRank1)
      }
      case 4:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setError('')
      if (currentStep < totalSteps) {
        setCurrentStep((s) => s + 1)
      }
    } else {
      setError('Please fill in all required fields')
    }
  }

  const handleFormKeyDown = (e) => {
    if (e.key !== 'Enter' || e.repeat) return
    if (e.target.tagName === 'TEXTAREA') return
    if (signUpAs === 'admin') return
    if (currentStep < totalSteps) {
      e.preventDefault()
      handleNext()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (signUpAs === 'user' && currentStep !== totalSteps) {
      setError('Please complete all steps before creating your account.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!validateStep(currentStep)) {
      setError('Please fill in all required fields')
      return
    }

    if (signUpAs === 'admin' && !isAdminEmail(formData.email)) {
      setError('Admin accounts must use an authorized admin email (e.g. admin@educonnect.com).')
      return
    }

    setLoading(true)

    try {
      const orderedInterests = buildOrderedInterestsFromRanks(formData).join(', ')
      const csParts = [
        ...(formData.learningPathway ? [formData.learningPathway.trim()] : []),
        ...(formData.modulePathway ? [formData.modulePathway.trim()] : []),
        ...(formData.csInterests || '').split(',').map((s) => s.trim()).filter(Boolean)
      ]
      const csInterests = [...new Set(csParts)].join(', ')

      // Teach the model: submit any custom (non-predefined) values so they become options later
      const singleValueFields = [
        'university', 'degreeProgram', 'nationality', 'countryOfResidence',
        'preferredLearningStyle', 'studyPartnersPreferences', 'preferredStudyHours'
      ]
      for (const field of singleValueFields) {
        const value = (formData[field] || '').trim()
        if (!value) continue
        const options = signupOptions[field] || []
        if (!options.includes(value)) {
          submitSignupSuggestion(field, value).catch(() => {})
        }
      }
      const {
        confirmPassword,
        disciplineTrack,
        interestRank1,
        interestRank2,
        interestRank3,
        learningPathway,
        modulePathway,
        ...rest
      } = formData
      const userData = {
        ...rest,
        orderedInterests,
        csInterests
      }
      const newUser = await signup(userData)
      localStorage.setItem('EduConnect_lastEmail', (formData.email || '').trim())
      navigate(newUser.role === 'admin' ? '/admin/dashboard' : '/dashboard')
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const learningStyles = ['Visual', 'Auditory', 'Kinesthetic', 'Reading/Writing']
  const partnerPreferences = ['One-on-one', 'Group', 'Online', 'In-person']
  const studyHours = ['Morning', 'Afternoon', 'Evening', 'Late night']

  // Full list of programmes across all fields (used when API has not loaded or returns empty)
  const defaultDegreePrograms = [
    'Bachelor of Information Technology (College of Computing and Information Sciences)',
    'Bachelor of Computer Science (College of Computing and Information Sciences)',
    'Bachelor of Science in Software Engineering (College of Computing and Information Sciences)',
    'Bachelor of Science in Computer Engineering (College of Computing and Information Sciences)',
    'Bachelor of Business Administration (College of Business and Management Sciences)',
    'Bachelor of Commerce (College of Business and Management Sciences)',
    'Bachelor of Science in Accounting (College of Business and Management Sciences)',
    'Bachelor of Laws (LLB) (School of Law)',
    'Bachelor of Education (Arts) (College of Education and External Studies)',
    'Bachelor of Education (Science) (College of Education and External Studies)',
    'Bachelor of Science in Agriculture (College of Agricultural and Environmental Sciences)',
    'Bachelor of Nursing (College of Health Sciences)',
    'Bachelor of Arts in Social Sciences (College of Humanities and Social Sciences)',
    'Bachelor of Arts in Literature (College of Humanities and Social Sciences)',
    'Bachelor of Divinity (Bishop Tucker School of Theology)'
  ]
  // Show programmes from all fields (full list; no filtering by course area)
  const degreeProgramOptions = (signupOptions.degreeProgram?.length ? signupOptions.degreeProgram : defaultDegreePrograms)

  const courseAreaOptions = [
    { value: '', label: 'Select your course area' },
    { value: 'Computing & IT', label: 'Computing & IT' },
    { value: 'Law', label: 'Law' },
    { value: 'Business & Management', label: 'Business & Management' },
    { value: 'Education', label: 'Education' },
    { value: 'Humanities', label: 'Humanities' },
    { value: 'Health', label: 'Health' },
    { value: 'Agriculture', label: 'Agriculture' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Social Sciences', label: 'Social Sciences' },
    { value: 'Creative Arts', label: 'Creative Arts' },
    { value: 'Other', label: 'Other' }
  ]

  // Use course-area–specific suggestions when user has selected a course area
  const getOptionsForField = (field) => {
    const area = (formData.courseArea || '').trim()
    const byArea = signupOptions.optionsByCourseArea?.[area]?.[field]
    if (byArea && Array.isArray(byArea) && byArea.length > 0) return byArea
    return signupOptions[field] || []
  }

  // General fields with sub-fields for interests
  const INTEREST_FIELDS = [
    {
      field: 'Computing & IT',
      subFields: [
        'Artificial Intelligence',
        'Machine Learning',
        'Data Science',
        'Natural Language Processing',
        'Computer Vision',
        'Deep Learning',
        'Cybersecurity',
        'Web Development',
        'Mobile Development'
      ]
    },
    {
      field: 'Law',
      subFields: [
        'Contract Law',
        'Constitutional Law',
        'Criminal Law',
        'International Law',
        'Legal Writing',
        'Human Rights',
        'Commercial Law'
      ]
    },
    {
      field: 'Business & Management',
      subFields: [
        'Accounting & Finance',
        'Economics',
        'Marketing',
        'Human Resources',
        'Entrepreneurship',
        'Supply Chain & Logistics',
        'Hospitality & Tourism'
      ]
    },
    {
      field: 'Education',
      subFields: [
        'Curriculum & Instruction',
        'Educational Psychology',
        'Special & Inclusive Education',
        'Assessment & Evaluation',
        'Educational Technology'
      ]
    },
    {
      field: 'Humanities',
      subFields: [
        'Philosophy',
        'Literature & Languages',
        'History',
        'Cultural Studies',
        'Theology & Religious Studies'
      ]
    },
    {
      field: 'Health',
      subFields: [
        'Nursing & Midwifery',
        'Medicine & Surgery',
        'Public Health',
        'Pharmacy',
        'Biomedical Sciences'
      ]
    },
    {
      field: 'Agriculture',
      subFields: [
        'Animal Science',
        'Agronomy',
        'Agricultural Economics',
        'Food Science & Technology',
        'Environmental Management',
        'Crop Production'
      ]
    },
    {
      field: 'Engineering',
      subFields: [
        'Civil Engineering',
        'Mechanical Engineering',
        'Electrical Engineering',
        'Chemical Engineering',
        'Aerospace Engineering'
      ]
    },
    {
      field: 'Social Sciences',
      subFields: [
        'Sociology',
        'Psychology',
        'Political Science',
        'Anthropology',
        'International Relations'
      ]
    },
    {
      field: 'Creative Arts',
      subFields: [
        'Fine Arts',
        'Design',
        'Music',
        'Film Studies',
        'Performing Arts'
      ]
    }
  ]
  const INTEREST_TOPICS = INTEREST_FIELDS.flatMap(({ field, subFields }) => [field, ...subFields])
  const interestRankOptions = [...INTEREST_TOPICS].sort((a, b) => a.localeCompare(b))

  return (
    <div className="signup-container signup-page-light">
      <motion.div
        className="signup-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="signup-header">
          <h1>Create Your Account</h1>
          <p>{signUpAs === 'admin' ? 'Create an admin account to manage EduConnect' : 'Join EduConnect and find your perfect study partner'}</p>

          <div className="sign-up-as-selector">
            <span className="sign-up-as-label">Sign up as</span>
            <div className="sign-up-as-options">
              <button
                type="button"
                className={`sign-up-as-btn ${signUpAs === 'user' ? 'active' : ''}`}
                onClick={() => { setSignUpAs('user'); setError(''); setCurrentStep(1); }}
                aria-pressed={signUpAs === 'user'}
              >
                User
              </button>
              <button
                type="button"
                className={`sign-up-as-btn ${signUpAs === 'admin' ? 'active' : ''}`}
                onClick={() => { setSignUpAs('admin'); setError(''); setCurrentStep(1); }}
                aria-pressed={signUpAs === 'admin'}
              >
                Admin
              </button>
            </div>
          </div>

          {signUpAs === 'user' && (
            <>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
              <div className="step-indicator">
                Step {currentStep} of {totalSteps}
              </div>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="signup-form">
          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {error}
            </motion.div>
          )}

          {/* Admin: Basic details only */}
          {signUpAs === 'admin' && (
            <motion.div
              className="form-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2>Admin Account</h2>
              <p className="admin-signup-hint">Use an authorized admin email (e.g. admin@educonnect.com)</p>
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@educonnect.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 1: Basic Information (User only) */}
          {signUpAs === 'user' && currentStep === 1 && (
            <motion.div
              className="form-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2>Basic Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Nationality</label>
                  <input
                    type="text"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    placeholder="e.g. Ugandan, Kenyan"
                  />
                </div>
                <div className="form-group">
                  <label>Country of Residence</label>
                  <input
                    type="text"
                    name="countryOfResidence"
                    value={formData.countryOfResidence}
                    onChange={handleChange}
                    placeholder="e.g. Uganda, Kenya"
                  />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Academic Information */}
          {signUpAs === 'user' && currentStep === 2 && (
            <motion.div
              className="form-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2>Academic Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <DropdownWithSpecify
                    name="courseArea"
                    label="Your course (for suggestions)"
                    value={formData.courseArea}
                    options={courseAreaOptions.filter((o) => o.value).map((o) => o.value)}
                    onChange={handleChange}
                    placeholder="Select your course area"
                    specifyPlaceholder="Type your course if not listed..."
                    required
                  />
                  <p className="form-hint">We use this to suggest relevant resources and materials.</p>
                </div>
                <div className="form-group">
                  <label>University *</label>
                  <input
                    type="text"
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    list="university-suggestions"
                    placeholder="Type or choose from suggestions"
                    autoComplete="off"
                    required
                  />
                  <datalist id="university-suggestions">
                    {(signupOptions.university || []).map((opt) => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </div>
                <div className="form-group">
                  <label>Degree Program</label>
                  <input
                    type="text"
                    name="degreeProgram"
                    value={formData.degreeProgram}
                    onChange={handleChange}
                    list="degree-program-suggestions"
                    placeholder="Type your course or select from suggestions"
                    autoComplete="off"
                  />
                  <datalist id="degree-program-suggestions">
                    {degreeProgramOptions.map((opt) => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                  <p className="form-hint">If your course is not listed, type it in the field above.</p>
                </div>
                <div className="form-group">
                  <label>Credits Completed</label>
                  <input
                    type="number"
                    name="creditsCompleted"
                    value={formData.creditsCompleted}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Credits Remaining</label>
                  <input
                    type="number"
                    name="creditsRemaining"
                    value={formData.creditsRemaining}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Interests & Skills — compact dropdowns */}
          {signUpAs === 'user' && currentStep === 3 && (
            <motion.div
              className="form-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2>Interests & Skills</h2>
              <p className="form-hint" style={{ marginBottom: '1rem' }}>
                Choose your discipline and ranked interests (hold Ctrl or Cmd to pick several in the multi-select lists). We use this to personalise suggestions.
              </p>

              <div className="signup-step3-grid">
                <div className="form-group">
                  <label>Primary discipline / school *</label>
                  <select
                    name="disciplineTrack"
                    value={formData.disciplineTrack}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select discipline</option>
                    {DISCIPLINE_TRACKS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Learning pathway</label>
                  <select
                    name="learningPathway"
                    value={formData.learningPathway}
                    onChange={handleChange}
                  >
                    <option value="">Select (optional)</option>
                    {LEARNING_PATHWAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Module / programme focus</label>
                  <select
                    name="modulePathway"
                    value={formData.modulePathway}
                    onChange={handleChange}
                  >
                    <option value="">Select (optional)</option>
                    {MODULE_PATHWAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Top interest (most relevant) *</label>
                  <select
                    name="interestRank1"
                    value={formData.interestRank1}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select topic</option>
                    {interestRankOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Second interest</label>
                  <select
                    name="interestRank2"
                    value={formData.interestRank2}
                    onChange={handleChange}
                  >
                    <option value="">Optional</option>
                    {interestRankOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Third interest</label>
                  <select
                    name="interestRank3"
                    value={formData.interestRank3}
                    onChange={handleChange}
                  >
                    <option value="">Optional</option>
                    {interestRankOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid" style={{ marginTop: 'var(--spacing-md)' }}>
                <MultiSelectDropdown
                  name="csInterests"
                  label="Additional tags (optional)"
                  value={formData.csInterests}
                  options={signupOptions.csInterests || []}
                  onChange={handleChange}
                  hint="Hold Ctrl/Cmd to select multiple."
                />
                <MultiSelectDropdown
                  name="strongTopics"
                  label="Strong topics"
                  value={formData.strongTopics}
                  options={getOptionsForField('strongTopics')}
                  onChange={handleChange}
                  hint="Hold Ctrl/Cmd to select multiple."
                />
                <MultiSelectDropdown
                  name="weakTopics"
                  label="Weak topics"
                  value={formData.weakTopics}
                  options={getOptionsForField('weakTopics')}
                  onChange={handleChange}
                  hint="Hold Ctrl/Cmd to select multiple."
                />
                <MultiSelectDropdown
                  name="technicalSkills"
                  label="Technical skills"
                  value={formData.technicalSkills}
                  options={getOptionsForField('technicalSkills')}
                  onChange={handleChange}
                  hint="Hold Ctrl/Cmd to select multiple."
                />
                <MultiSelectDropdown
                  name="softSkills"
                  label="Soft skills"
                  value={formData.softSkills}
                  options={signupOptions.softSkills || []}
                  onChange={handleChange}
                  hint="Hold Ctrl/Cmd to select multiple."
                />
                <MultiSelectDropdown
                  name="researchInterests"
                  label="Research interests"
                  value={formData.researchInterests}
                  options={getOptionsForField('researchInterests')}
                  onChange={handleChange}
                  hint="Hold Ctrl/Cmd to select multiple."
                />
                <MultiSelectDropdown
                  name="professionalInterests"
                  label="Professional interests"
                  value={formData.professionalInterests}
                  options={getOptionsForField('professionalInterests')}
                  onChange={handleChange}
                  hint="Hold Ctrl/Cmd to select multiple."
                />
                <MultiSelectDropdown
                  name="hobbies"
                  label="Hobbies"
                  value={formData.hobbies}
                  options={signupOptions.hobbies || []}
                  onChange={handleChange}
                  hint="Hold Ctrl/Cmd to select multiple."
                />
              </div>
            </motion.div>
          )}

          {/* Step 4: Study Preferences */}
          {signUpAs === 'user' && currentStep === 4 && (
            <motion.div
              className="form-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2>Study Preferences</h2>
              <div className="form-grid">
                <DropdownWithSpecify
                  name="preferredLearningStyle"
                  label="Preferred Learning Style"
                  value={formData.preferredLearningStyle}
                  options={signupOptions.preferredLearningStyle || learningStyles}
                  onChange={handleChange}
                  placeholder="Select or specify"
                />
                <DropdownWithSpecify
                  name="studyPartnersPreferences"
                  label="Study Partners Preferences"
                  value={formData.studyPartnersPreferences}
                  options={signupOptions.studyPartnersPreferences || partnerPreferences}
                  onChange={handleChange}
                  placeholder="Select or specify"
                />
                <DropdownWithSpecify
                  name="preferredStudyHours"
                  label="Preferred Study Hours"
                  value={formData.preferredStudyHours}
                  options={signupOptions.preferredStudyHours || studyHours}
                  onChange={handleChange}
                  placeholder="Select or specify"
                />
                <div className="form-group full-width">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div className="form-actions">
            {currentStep > 1 && (
              <motion.button
                type="button"
                onClick={handlePrevious}
                className="button-secondary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Previous
              </motion.button>
            )}
            {currentStep < totalSteps ? (
              <motion.button
                type="button"
                onClick={handleNext}
                className="button-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Next
              </motion.button>
            ) : (
              <motion.button
                type="submit"
                className="button-primary"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </motion.button>
            )}
          </div>
        </form>

        <div className="signup-footer">
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default SignUp

