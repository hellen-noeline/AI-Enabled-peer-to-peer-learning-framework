import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { fetchSignupOptions, submitSignupSuggestion } from '../api/signupOptionsApi'
import DropdownWithSpecify from '../components/DropdownWithSpecify'
import TagsInputWithDropdown from '../components/TagsInputWithDropdown'
import '../styles/SignUp.css'

function SignUp() {
  const navigate = useNavigate()
  const { signup, isAdminEmail } = useAuth()
  const [signUpAs, setSignUpAs] = useState('user') // 'user' | 'admin'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [signupOptions, setSignupOptions] = useState({})
  const totalSteps = signUpAs === 'admin' ? 1 : 4

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
    profilePicture: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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
      case 3:
        return orderedInterestsList.length > 0
      case 4:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
      }
    } else {
      setError('Please fill in all required fields')
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
      // Remove confirmPassword before saving
      const { confirmPassword, ...userData } = formData
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

  const courseAreaOptions = [
    { value: '', label: 'Select your course area' },
    { value: 'Computing & IT', label: 'Computing & IT' },
    { value: 'Law', label: 'Law' },
    { value: 'Business & Management', label: 'Business & Management' },
    { value: 'Other', label: 'Other' }
  ]

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
    }
  ]
  const INTEREST_TOPICS = INTEREST_FIELDS.flatMap(({ field, subFields }) => [field, ...subFields])

  const orderedInterestsList = formData.orderedInterests
    ? formData.orderedInterests.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const toggleInterest = (topic) => {
    if (orderedInterestsList.includes(topic)) {
      setFormData((prev) => ({
        ...prev,
        orderedInterests: orderedInterestsList.filter((t) => t !== topic).join(', ')
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        orderedInterests: [...orderedInterestsList, topic].join(', ')
      }))
    }
  }

  const moveInterest = (index, direction) => {
    const next = [...orderedInterestsList]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= next.length) return
    ;[next[index], next[newIndex]] = [next[newIndex], next[index]]
    setFormData((prev) => ({ ...prev, orderedInterests: next.join(', ') }))
  }

  return (
    <div className="signup-container">
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

        <form onSubmit={handleSubmit} className="signup-form">
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
                    placeholder="e.g. Uganda, Kenya"
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
          {currentStep === 2 && (
            <motion.div
              className="form-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2>Academic Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Your course (for suggestions) *</label>
                  <select
                    name="courseArea"
                    value={formData.courseArea}
                    onChange={handleChange}
                    required
                  >
                    {courseAreaOptions.map((opt) => (
                      <option key={opt.value || 'blank'} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
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
                    list="degreeProgram-suggestions"
                    placeholder="Type or choose from suggestions"
                    autoComplete="off"
                  />
                  <datalist id="degreeProgram-suggestions">
                    {(signupOptions.degreeProgram || []).map((opt) => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
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

          {/* Step 3: Interests & Skills */}
          {currentStep === 3 && (
            <motion.div
              className="form-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2>Interests & Skills</h2>

              <div className="form-group full-width" style={{ marginBottom: '1.5rem' }}>
                <label>Interests (order from most to least relevant) *</label>
                <p className="form-hint">Select fields and sub-fields that apply, then order your list: first = most relevant. We use this to personalise suggestions.</p>
                <div className="interests-by-field">
                  {INTEREST_FIELDS.map(({ field, subFields }) => (
                    <div key={field} className="interest-field-group">
                      <div className="interest-field-heading">{field}</div>
                      <div className="interests-checkbox-list">
                        <label key={field} className="interest-checkbox-label field-option">
                          <input
                            type="checkbox"
                            checked={orderedInterestsList.includes(field)}
                            onChange={() => toggleInterest(field)}
                          />
                          <span>General interest in this field</span>
                        </label>
                        {subFields.map((sub) => (
                          <label key={sub} className="interest-checkbox-label subfield-option">
                            <input
                              type="checkbox"
                              checked={orderedInterestsList.includes(sub)}
                              onChange={() => toggleInterest(sub)}
                            />
                            <span>{sub}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {orderedInterestsList.length > 0 && (
                  <div className="ordered-interests-list">
                    <span className="ordered-label">Your order (most relevant first — use arrows to reorder):</span>
                    <ul className="ordered-interests-ul">
                      {orderedInterestsList.map((topic, index) => (
                        <li key={topic} className="ordered-interest-item">
                          <span className="order-num">{index + 1}.</span>
                          <span>{topic}</span>
                          <span className="order-buttons">
                            <button type="button" onClick={() => moveInterest(index, 'up')} disabled={index === 0} aria-label="Move up">↑</button>
                            <button type="button" onClick={() => moveInterest(index, 'down')} disabled={index === orderedInterestsList.length - 1} aria-label="Move down">↓</button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="form-grid">
                <TagsInputWithDropdown
                  name="csInterests"
                  label="Additional interests (optional)"
                  value={formData.csInterests}
                  options={signupOptions.csInterests || []}
                  onChange={handleChange}
                  onSuggest={(field, value) => submitSignupSuggestion(field, value).catch(() => {})}
                  placeholder="Any field: e.g. AI, Contract Law, Marketing"
                />
                <TagsInputWithDropdown
                  name="strongTopics"
                  label="Strong Topics"
                  value={formData.strongTopics}
                  options={signupOptions.strongTopics || []}
                  onChange={handleChange}
                  onSuggest={(field, value) => submitSignupSuggestion(field, value).catch(() => {})}
                />
                <TagsInputWithDropdown
                  name="weakTopics"
                  label="Weak Topics"
                  value={formData.weakTopics}
                  options={signupOptions.weakTopics || []}
                  onChange={handleChange}
                  onSuggest={(field, value) => submitSignupSuggestion(field, value).catch(() => {})}
                />
                <TagsInputWithDropdown
                  name="technicalSkills"
                  label="Technical Skills"
                  value={formData.technicalSkills}
                  options={signupOptions.technicalSkills || []}
                  onChange={handleChange}
                  onSuggest={(field, value) => submitSignupSuggestion(field, value).catch(() => {})}
                />
                <TagsInputWithDropdown
                  name="softSkills"
                  label="Soft Skills"
                  value={formData.softSkills}
                  options={signupOptions.softSkills || []}
                  onChange={handleChange}
                  onSuggest={(field, value) => submitSignupSuggestion(field, value).catch(() => {})}
                />
                <TagsInputWithDropdown
                  name="researchInterests"
                  label="Research Interests"
                  value={formData.researchInterests}
                  options={signupOptions.researchInterests || []}
                  onChange={handleChange}
                  onSuggest={(field, value) => submitSignupSuggestion(field, value).catch(() => {})}
                />
                <TagsInputWithDropdown
                  name="professionalInterests"
                  label="Professional Interests"
                  value={formData.professionalInterests}
                  options={signupOptions.professionalInterests || []}
                  onChange={handleChange}
                  onSuggest={(field, value) => submitSignupSuggestion(field, value).catch(() => {})}
                />
                <TagsInputWithDropdown
                  name="hobbies"
                  label="Hobbies"
                  value={formData.hobbies}
                  options={signupOptions.hobbies || []}
                  onChange={handleChange}
                  onSuggest={(field, value) => submitSignupSuggestion(field, value).catch(() => {})}
                />
              </div>
            </motion.div>
          )}

          {/* Step 4: Study Preferences */}
          {currentStep === 4 && (
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
          <p className="signup-server-hint">
            Sign up requires the backend server. Run <code>npm start</code> in the <code>server</code> folder first.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default SignUp

