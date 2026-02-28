import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import Navigation from '../components/Navigation'
import { loadDataset, getDatasetUsers } from '../utils/datasetLoader'
import '../styles/Profile.css'

function Profile() {
  const { user, updateUser } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [viewingUser, setViewingUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    bio: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    university: '',
    city: '',
    state: '',
    csInterests: '',
    technicalSkills: '',
    strongTopics: '',
    weakTopics: '',
    softSkills: '',
    hobbies: '',
    researchInterests: '',
    professionalInterests: '',
    preferredLearningStyle: '',
    studyPartnersPreferences: '',
    preferredStudyHours: ''
  })

  // Update formData when user changes
  useEffect(() => {
    if (user && (!id || id === user.id)) {
      setFormData({
        bio: user?.bio || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
        university: user?.university || '',
        city: user?.city || '',
        state: user?.state || '',
        csInterests: user?.csInterests || '',
        technicalSkills: user?.technicalSkills || '',
        strongTopics: user?.strongTopics || '',
        weakTopics: user?.weakTopics || '',
        softSkills: user?.softSkills || '',
        hobbies: user?.hobbies || '',
        researchInterests: user?.researchInterests || '',
        professionalInterests: user?.professionalInterests || '',
        preferredLearningStyle: user?.preferredLearningStyle || '',
        studyPartnersPreferences: user?.studyPartnersPreferences || '',
        preferredStudyHours: user?.preferredStudyHours || ''
      })
    }
  }, [user, id])

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    // If viewing another user's profile
    if (id && id !== user.id) {
      setLoading(true)
      const loadUserProfile = async () => {
        try {
          await loadDataset()
          const allUsers = [
            ...getDatasetUsers(),
            ...JSON.parse(localStorage.getItem('EduConnect_users') || '[]')
          ]
          const foundUser = allUsers.find(u => u.id === id)
          if (foundUser) {
            setViewingUser(foundUser)
          } else {
            navigate('/profile')
          }
        } catch (error) {
          console.error('Error loading user profile:', error)
          navigate('/profile')
        } finally {
          setLoading(false)
        }
      }
      loadUserProfile()
    } else {
      setViewingUser(null)
    }
  }, [user, id, navigate])

  if (!user) return null

  // Use viewingUser if viewing another profile, otherwise use current user
  const displayUser = viewingUser || user
  const isOwnProfile = !id || id === user.id

  if (loading) {
    return (
      <div className="profile-container">
        <Navigation />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    updateUser(formData)
    setIsEditing(false)
  }

  const parseCommaSeparated = (str) => {
    if (!str) return []
    return str.split(',').map(item => item.trim()).filter(item => item && item.toLowerCase() !== 'none')
  }

  const renderTags = (str, color = 'primary') => {
    const items = parseCommaSeparated(str)
    if (items.length === 0) return <span className="empty-text">Not specified</span>
    return (
      <div className="tags-container">
        {items.map((item, index) => (
          <span key={index} className={`tag tag-${color}`}>
            {item}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="profile-container">
      <Navigation />
      <div className="profile-content">
        <motion.div
          className="profile-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="profile-cover">
            <div className="profile-avatar-large">
              {displayUser.firstName?.[0]}{displayUser.lastName?.[0]}
            </div>
          </div>
          <div className="profile-info-header">
            <div>
              <h1>{displayUser.firstName} {displayUser.lastName}</h1>
              <p className="profile-email">{displayUser.email}</p>
              {displayUser.university && (
                <p className="profile-university">
                  {displayUser.university}
                  {displayUser.degreeProgram && (
                    <>
                      {' · '}
                      <span className="profile-degree">{displayUser.degreeProgram}</span>
                    </>
                  )}
                </p>
              )}
            </div>
            {isOwnProfile && (
              <motion.button
                className="edit-btn"
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isEditing ? '💾 Save' : '✏️ Edit'}
              </motion.button>
            )}
          </div>
        </motion.div>

        <div className="profile-sections">
          {/* Bio Section */}
          <motion.section
            className="profile-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2>About</h2>
            {isEditing ? (
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                rows="4"
                className="bio-input"
              />
            ) : (
              <p className="bio-text">{displayUser.bio || (isOwnProfile ? 'No bio yet. Add one to help others get to know you!' : 'No bio available.')}</p>
            )}
          </motion.section>

          {/* Additional interests — only show when present or when editing */}
          {(isEditing || (displayUser.csInterests && displayUser.csInterests.trim())) ? (
            <motion.section
              className="profile-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2>Additional interests</h2>
              {isEditing ? (
                <input
                  type="text"
                  name="csInterests"
                  value={formData.csInterests}
                  onChange={handleChange}
                  placeholder="e.g., AI, Contract Law, Marketing"
                  className="tags-input"
                />
              ) : (
                renderTags(displayUser.csInterests, 'primary')
              )}
            </motion.section>
          ) : null}

          {/* Technical Skills */}
          <motion.section
            className="profile-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2>Technical Skills</h2>
            {isEditing ? (
              <input
                type="text"
                name="technicalSkills"
                value={formData.technicalSkills}
                onChange={handleChange}
                placeholder="e.g., Python, JavaScript, Git"
                className="tags-input"
              />
            ) : (
              renderTags(displayUser.technicalSkills, 'accent')
            )}
          </motion.section>

          {/* Strong & Weak Topics */}
          <motion.section
            className="profile-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h2>Strong Topics</h2>
            {isEditing ? (
              <input
                type="text"
                name="strongTopics"
                value={formData.strongTopics}
                onChange={handleChange}
                placeholder="e.g., Algorithms, Linear Algebra, Python"
                className="tags-input"
              />
            ) : (
              renderTags(displayUser.strongTopics, 'success')
            )}
          </motion.section>

          <motion.section
            className="profile-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36 }}
          >
            <h2>Weak Topics</h2>
            {isEditing ? (
              <input
                type="text"
                name="weakTopics"
                value={formData.weakTopics}
                onChange={handleChange}
                placeholder="e.g., Statistics, Calculus, Networking"
                className="tags-input"
              />
            ) : (
              renderTags(displayUser.weakTopics, 'warning')
            )}
          </motion.section>

          {/* Soft Skills */}
          <motion.section
            className="profile-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2>Soft Skills</h2>
            {isEditing ? (
              <input
                type="text"
                name="softSkills"
                value={formData.softSkills}
                onChange={handleChange}
                placeholder="e.g., Communication, Leadership"
                className="tags-input"
              />
            ) : (
              renderTags(displayUser.softSkills, 'secondary')
            )}
          </motion.section>

          {/* Research Interests */}
          <motion.section
            className="profile-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2>Research Interests</h2>
            {isEditing ? (
              <input
                type="text"
                name="researchInterests"
                value={formData.researchInterests}
                onChange={handleChange}
                placeholder="e.g., Machine Learning, AI"
                className="tags-input"
              />
            ) : (
              renderTags(displayUser.researchInterests, 'info')
            )}
          </motion.section>

          {/* Professional Interests */}
          <motion.section
            className="profile-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2>Professional Interests</h2>
            {isEditing ? (
              <input
                type="text"
                name="professionalInterests"
                value={formData.professionalInterests}
                onChange={handleChange}
                placeholder="e.g., ML Engineer, Data Scientist"
                className="tags-input"
              />
            ) : (
              renderTags(displayUser.professionalInterests, 'success')
            )}
          </motion.section>

          {/* Hobbies */}
          <motion.section
            className="profile-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h2>Hobbies</h2>
            {isEditing ? (
              <input
                type="text"
                name="hobbies"
                value={formData.hobbies}
                onChange={handleChange}
                placeholder="e.g., Reading, Hiking, Photography"
                className="tags-input"
              />
            ) : (
              renderTags(displayUser.hobbies, 'warning')
            )}
          </motion.section>

          {/* Study Preferences */}
          <motion.section
            className="profile-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h2>Study Preferences</h2>
            <div className="preferences-grid">
              <div className="preference-item">
                <label>Learning Style</label>
                {isEditing ? (
                  <select
                    name="preferredLearningStyle"
                    value={formData.preferredLearningStyle}
                    onChange={handleChange}
                    className="preference-select"
                  >
                    <option value="">Select</option>
                    <option value="Visual">Visual</option>
                    <option value="Auditory">Auditory</option>
                    <option value="Kinesthetic">Kinesthetic</option>
                    <option value="Reading/Writing">Reading/Writing</option>
                  </select>
                ) : (
                  <p className="preference-value">{displayUser.preferredLearningStyle || 'Not specified'}</p>
                )}
              </div>
              <div className="preference-item">
                <label>Partner Preference</label>
                {isEditing ? (
                  <select
                    name="studyPartnersPreferences"
                    value={formData.studyPartnersPreferences}
                    onChange={handleChange}
                    className="preference-select"
                  >
                    <option value="">Select</option>
                    <option value="One-on-one">One-on-one</option>
                    <option value="Group">Group</option>
                    <option value="Online">Online</option>
                    <option value="In-person">In-person</option>
                  </select>
                ) : (
                  <p className="preference-value">{displayUser.studyPartnersPreferences || 'Not specified'}</p>
                )}
              </div>
              <div className="preference-item">
                <label>Preferred Study Hours</label>
                {isEditing ? (
                  <select
                    name="preferredStudyHours"
                    value={formData.preferredStudyHours}
                    onChange={handleChange}
                    className="preference-select"
                  >
                    <option value="">Select</option>
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Late night">Late night</option>
                  </select>
                ) : (
                  <p className="preference-value">{displayUser.preferredStudyHours || 'Not specified'}</p>
                )}
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  )
}

export default Profile

