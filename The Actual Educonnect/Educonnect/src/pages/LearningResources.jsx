import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useStudy } from '../contexts/StudyContext'
import Navigation from '../components/Navigation'
import { resourceToField, categoryToField, learningFields } from '../data/quizData'
import { learningResources } from '../data/learningResources'
import '../styles/LearningResources.css'

const getFieldForResource = (resource) => {
  const fieldFromResource = resourceToField[resource.id]
  if (fieldFromResource) return fieldFromResource
  const fieldId = categoryToField[resource.category]
  return fieldId ? learningFields.find((f) => f.id === fieldId) : null
}

function LearningResources() {
  const { user } = useAuth()
  const { startStudySession } = useStudy()
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'All Resources' },
    { id: 'ai', name: 'Artificial Intelligence' },
    { id: 'ml', name: 'Machine Learning' },
    { id: 'ds', name: 'Data Science' },
    { id: 'nlp', name: 'Natural Language Processing' },
    { id: 'cv', name: 'Computer Vision' },
    { id: 'dl', name: 'Deep Learning' },
    { id: 'cyber', name: 'Cybersecurity' },
    { id: 'web', name: 'Web Development' },
    { id: 'mobile', name: 'Mobile Development' }
  ]

  const filteredResources = selectedCategory === 'all' 
    ? learningResources 
    : learningResources.filter(resource => resource.category === selectedCategory)

  const getDifficultyColor = (difficulty) => {
    switch(difficulty.toLowerCase()) {
      case 'beginner': return '#10B981'
      case 'intermediate': return '#FFD93D'
      case 'advanced': return '#FF6B35'
      default: return '#6B7280'
    }
  }

  return (
    <div className="resources-container">
      <Navigation />
      <main id="main-content" role="main" className="resources-content" tabIndex={-1} aria-label="Learning resources">
        <motion.div
          className="resources-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1>Learning Resources</h1>
            <p>Discover curated learning materials tailored to your interests</p>
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          className="category-filter"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {categories.map((category) => (
            <motion.button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="category-name">{category.name}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Resources Grid */}
        <div className="resources-grid">
          {filteredResources.map((resource, index) => {
            const field = getFieldForResource(resource)
            const proficiency = field && user?.studyStats?.fieldProgress?.[field.id]?.proficiency
            return (
            <motion.div
              key={resource.id}
              className="resource-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
            >
              <div className="resource-header">
                <div className="resource-type-badge">{resource.type}</div>
                <div className="resource-rating">
                  <svg className="rating-star-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  <span>{resource.rating}</span>
                </div>
              </div>
              
              <h3>{resource.title}</h3>
              <p className="resource-provider">by {resource.provider}</p>
              <p className="resource-description">{resource.description}</p>
              
              <div className="resource-meta">
                <span 
                  className="difficulty-badge"
                  style={{ backgroundColor: getDifficultyColor(resource.difficulty) + '20', color: getDifficultyColor(resource.difficulty) }}
                >
                  {resource.difficulty}
                </span>
                <span className="duration-badge">
                  {resource.duration}
                </span>
              </div>
              
              <div className="resource-actions">
                <a
                  href={resource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-link"
                  onClick={() => startStudySession()}
                >
                  View Resource →
                </a>
                <button
                  className={`resource-quiz-btn ${proficiency ? 'quiz-passed' : ''}`}
                  onClick={() => field && navigate(`/quiz/${field.id}`)}
                >
                  {proficiency ? `✓ ${proficiency}` : 'Take Quizzes'}
                </button>
              </div>
              {proficiency && (
                <p className="resource-quiz-badge">Proficiency: {proficiency}</p>
              )}
            </motion.div>
          )})}
        </div>

        {filteredResources.length === 0 && (
          <motion.div
            className="no-resources"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p>No resources found for this category.</p>
          </motion.div>
        )}
      </main>
    </div>
  )
}

export default LearningResources

