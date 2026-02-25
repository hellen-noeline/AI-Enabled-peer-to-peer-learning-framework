import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import Navigation from '../components/Navigation'
import { getRecommendations } from '../utils/recommendationEngine'
import { loadDataset, getDatasetUsers } from '../utils/datasetLoader'
import '../styles/Recommendations.css'

function Recommendations() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all') // all, high, medium, low

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true)
        await loadDataset()
        const allUsers = [
          ...getDatasetUsers(),
          ...JSON.parse(localStorage.getItem('EduConnect_users') || '[]')
        ]
        
        const recs = getRecommendations(user, allUsers)
        setRecommendations(recs)
      } catch (error) {
        console.error('Error loading recommendations:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (user) {
      loadRecommendations()
    }
  }, [user])

  if (!user) return null

  const parseCommaSeparated = (str) => {
    if (!str) return []
    return str.split(',').map(item => item.trim()).filter(item => item && item.toLowerCase() !== 'none')
  }

  const filteredRecommendations = recommendations.filter(rec => {
    const matchesSearch = searchQuery === '' || 
      `${rec.firstName} ${rec.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.university && rec.university.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.csInterests && rec.csInterests.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesFilter = filter === 'all' || 
      (filter === 'high' && rec.matchScore >= 70) ||
      (filter === 'medium' && rec.matchScore >= 40 && rec.matchScore < 70) ||
      (filter === 'low' && rec.matchScore < 40)
    
    return matchesSearch && matchesFilter
  })

  const getMatchColor = (score) => {
    if (score >= 70) return '#10B981' // green
    if (score >= 40) return '#F59E0B' // orange
    return '#6B7280' // gray
  }

  const getMatchLabel = (score) => {
    if (score >= 70) return 'High Match'
    if (score >= 40) return 'Medium Match'
    return 'Low Match'
  }

  return (
    <div className="recommendations-container">
      <Navigation />
      <main id="main-content" role="main" className="recommendations-content" tabIndex={-1} aria-label="Study partner recommendations" data-audio-main>
        <motion.div
          className="recommendations-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1>Find Your Study Partners</h1>
            <p>Discover students with similar interests and learning styles</p>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          className="search-filter-bar"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name, university, or interests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'high' ? 'active' : ''}`}
              onClick={() => setFilter('high')}
            >
              High Match (70%+)
            </button>
            <button
              className={`filter-btn ${filter === 'medium' ? 'active' : ''}`}
              onClick={() => setFilter('medium')}
            >
              Medium (40-69%)
            </button>
            <button
              className={`filter-btn ${filter === 'low' ? 'active' : ''}`}
              onClick={() => setFilter('low')}
            >
              Low (40% -)
            </button>
          </div>
        </motion.div>

        {/* Results Count */}
        <motion.div
          className="results-count"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span>
            {filteredRecommendations.length} {filteredRecommendations.length === 1 ? 'match' : 'matches'} found
          </span>
        </motion.div>

        {/* Recommendations Grid */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Finding your perfect study partners...</p>
          </div>
        ) : filteredRecommendations.length === 0 ? (
          <motion.div
            className="no-results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="no-results-icon">🔍</div>
            <h3>No matches found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </motion.div>
        ) : (
          <div className="recommendations-grid-full">
            {filteredRecommendations.map((rec, index) => (
              <motion.div
                key={rec.id}
                className="recommendation-card-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -4 }}
                onClick={() => navigate(`/profile/${rec.id}`)}
              >
                <div className="rec-card-header">
                  <div className="rec-avatar-large">
                    {rec.firstName?.[0]}{rec.lastName?.[0]}
                  </div>
                  <div className="rec-header-info">
                    <h3>{rec.firstName} {rec.lastName}</h3>
                    {rec.university && (
                      <p className="rec-university">{rec.university}</p>
                    )}
                    {rec.city && rec.state && (
                      <p className="rec-location">📍 {rec.city}, {rec.state}</p>
                    )}
                  </div>
                  <div 
                    className="match-badge"
                    style={{ backgroundColor: getMatchColor(rec.matchScore) }}
                  >
                    <span className="match-score">{rec.matchScore}%</span>
                    <span className="match-label">{getMatchLabel(rec.matchScore)}</span>
                  </div>
                </div>

                <div className="rec-card-body">
                  {rec.csInterests && (
                    <div className="rec-section">
                      <h4>CS Interests</h4>
                      <div className="tags-list">
                        {parseCommaSeparated(rec.csInterests).slice(0, 5).map((interest, i) => (
                          <span key={i} className="tag tag-primary">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {rec.technicalSkills && (
                    <div className="rec-section">
                      <h4>Technical Skills</h4>
                      <div className="tags-list">
                        {parseCommaSeparated(rec.technicalSkills).slice(0, 4).map((skill, i) => (
                          <span key={i} className="tag tag-accent">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rec-preferences">
                    {rec.preferredLearningStyle && (
                      <div className="pref-item">
                        <span className="pref-label">Learning Style</span>
                        <span className="pref-value">{rec.preferredLearningStyle}</span>
                      </div>
                    )}
                    {rec.studyPartnersPreferences && (
                      <div className="pref-item">
                        <span className="pref-label">Partner Preference</span>
                        <span className="pref-value">{rec.studyPartnersPreferences}</span>
                      </div>
                    )}
                    {rec.preferredStudyHours && (
                      <div className="pref-item">
                        <span className="pref-label">Study Hours</span>
                        <span className="pref-value">{rec.preferredStudyHours}</span>
                      </div>
                    )}
                  </div>

                  {rec.bio && (
                    <div className="rec-bio">
                      <p>{rec.bio}</p>
                    </div>
                  )}
                </div>

                <div className="rec-card-footer">
                  <motion.button
                    className="view-profile-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/profile/${rec.id}`)
                    }}
                  >
                    View Profile →
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Recommendations

