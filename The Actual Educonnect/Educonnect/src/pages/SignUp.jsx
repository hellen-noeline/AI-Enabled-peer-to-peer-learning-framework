import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import '../styles/SignUp.css'

function SignUp() {
  const navigate = useNavigate()
  const { signup, isAdminEmail } = useAuth()
  const [signUpAs, setSignUpAs] = useState('user') // 'user' | 'admin'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = signUpAs === 'admin' ? 1 : 4

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
        return formData.university
      case 3:
        return formData.csInterests
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
                  <label>University *</label>
                  <input
                    type="text"
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    required
                  />
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
                <div className="form-group full-width">
                  <label>Course Codes (comma-separated)</label>
                  <input
                    type="text"
                    name="courseCodes"
                    value={formData.courseCodes}
                    onChange={handleChange}
                    placeholder="e.g., CS101, MATH201, DS401"
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
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>CS and Data Science Interests * (comma-separated)</label>
                  <input
                    type="text"
                    name="csInterests"
                    value={formData.csInterests}
                    onChange={handleChange}
                    placeholder="e.g., AI, Machine Learning, Data Science, NLP"
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label>Strong Topics (comma-separated)</label>
                  <input
                    type="text"
                    name="strongTopics"
                    value={formData.strongTopics}
                    onChange={handleChange}
                    placeholder="e.g., Algorithms, Linear Algebra, Python, Databases"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Weak Topics (comma-separated)</label>
                  <input
                    type="text"
                    name="weakTopics"
                    value={formData.weakTopics}
                    onChange={handleChange}
                    placeholder="e.g., Statistics, Calculus, Networking, Operating Systems"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Technical Skills (comma-separated)</label>
                  <input
                    type="text"
                    name="technicalSkills"
                    value={formData.technicalSkills}
                    onChange={handleChange}
                    placeholder="e.g., Python, JavaScript, Git, Docker"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Soft Skills (comma-separated)</label>
                  <input
                    type="text"
                    name="softSkills"
                    value={formData.softSkills}
                    onChange={handleChange}
                    placeholder="e.g., Communication, Leadership, Teamwork"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Research Interests (comma-separated)</label>
                  <input
                    type="text"
                    name="researchInterests"
                    value={formData.researchInterests}
                    onChange={handleChange}
                    placeholder="e.g., Machine Learning, AI, Cybersecurity"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Professional Interests (comma-separated)</label>
                  <input
                    type="text"
                    name="professionalInterests"
                    value={formData.professionalInterests}
                    onChange={handleChange}
                    placeholder="e.g., ML Engineer, Data Scientist, Software Engineer"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Hobbies (comma-separated)</label>
                  <input
                    type="text"
                    name="hobbies"
                    value={formData.hobbies}
                    onChange={handleChange}
                    placeholder="e.g., Reading, Hiking, Photography"
                  />
                </div>
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
                <div className="form-group">
                  <label>Preferred Learning Style</label>
                  <select
                    name="preferredLearningStyle"
                    value={formData.preferredLearningStyle}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    {learningStyles.map(style => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Study Partners Preferences</label>
                  <select
                    name="studyPartnersPreferences"
                    value={formData.studyPartnersPreferences}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    {partnerPreferences.map(pref => (
                      <option key={pref} value={pref}>{pref}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Preferred Study Hours</label>
                  <select
                    name="preferredStudyHours"
                    value={formData.preferredStudyHours}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    {studyHours.map(hour => (
                      <option key={hour} value={hour}>{hour}</option>
                    ))}
                  </select>
                </div>
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

