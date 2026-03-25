import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useStudy } from '../contexts/StudyContext'
import Navigation from '../components/Navigation'
import { IconCheck } from '../components/Icons'
import { useLearningFields } from '../contexts/LearningFieldsContext'
import { learningResources } from '../data/learningResources'
import '../styles/LearningResources.css'

function getFieldForResource(resource, learningFields, resourceToField, categoryToField) {
  const fieldFromResource = resourceToField[resource.id]
  if (fieldFromResource) return fieldFromResource
  const fieldId = categoryToField[resource.category]
  return fieldId ? learningFields.find((f) => f.id === fieldId) : null
}

function parseList(value) {
  return (value || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

const AREA_TO_CATEGORIES = {
  'computing & it': ['ai', 'ml', 'ds', 'nlp', 'cv', 'dl', 'cyber', 'web', 'mobile'],
  law: ['law'],
  'business & management': ['business'],
  education: ['education'],
  humanities: ['humanities'],
  health: ['health'],
  agriculture: ['agriculture']
}

function LearningResources() {
  const { user } = useAuth()
  const { startStudySession } = useStudy()
  const { learningFields, resourceToField, categoryToField } = useLearningFields()
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('recommended')
  const [searchQuery, setSearchQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState([])

  useEffect(() => {
    try {
      const savedSearches = localStorage.getItem('educonnect_recent_searches')
      if (savedSearches) setRecentSearches(JSON.parse(savedSearches))
    } catch (e) {
      console.error('Failed to parse recent searches', e)
    }
  }, [])

  const categories = [
    { id: 'recommended', name: 'Recommended for You' },
    { id: 'ai', name: 'Artificial Intelligence' },
    { id: 'ml', name: 'Machine Learning' },
    { id: 'ds', name: 'Data Science' },
    { id: 'nlp', name: 'Natural Language Processing' },
    { id: 'cv', name: 'Computer Vision' },
    { id: 'dl', name: 'Deep Learning' },
    { id: 'cyber', name: 'Cybersecurity' },
    { id: 'web', name: 'Web Development' },
    { id: 'mobile', name: 'Mobile Development' },
    { id: 'law', name: 'Law' },
    { id: 'business', name: 'Business & Management' },
    { id: 'education', name: 'Education' },
    { id: 'humanities', name: 'Humanities' },
    { id: 'health', name: 'Health' },
    { id: 'agriculture', name: 'Agriculture' }
  ]

  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const weakTopics = parseList(user?.weakTopics)
  const orderedInterests = parseList(user?.orderedInterests)
  const additionalInterests = parseList(user?.csInterests)
  const combinedInterests = [...new Set([...orderedInterests, ...additionalInterests])]
  const preferredCategories = AREA_TO_CATEGORIES[(user?.courseArea || '').trim().toLowerCase()] || []

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    const query = searchQuery.trim()
    const updatedSearches = [query, ...recentSearches.filter((s) => s.toLowerCase() !== query.toLowerCase())].slice(0, 5)
    setRecentSearches(updatedSearches)
    localStorage.setItem('educonnect_recent_searches', JSON.stringify(updatedSearches))
  }

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  const includesAny = (text, terms) => terms.some((term) => text.includes(term))

  const dedupeById = (items) => {
    const seen = new Set()
    return items.filter((item) => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
  }

  const searchMatches = useMemo(() => {
    if (!normalizedSearchQuery) return []
    return learningResources.filter((res) => {
      const text = `${res.title} ${res.description} ${res.category} ${res.type} ${res.provider}`.toLowerCase()
      return text.includes(normalizedSearchQuery)
    })
  }, [normalizedSearchQuery])

  const recommendationSections = useMemo(() => {
    const recentTerms = recentSearches.map((s) => s.toLowerCase().trim()).filter(Boolean)

    const basedOnSearch = learningResources
      .map((res) => {
        const text = `${res.title} ${res.description} ${res.category}`.toLowerCase()
        const score = recentTerms.reduce((acc, term) => acc + (text.includes(term) ? 1 : 0), 0)
        return { ...res, _score: score }
      })
      .filter((res) => res._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 8)

    const weakAreaMatches = learningResources
      .filter((res) => includesAny(`${res.title} ${res.description} ${res.category}`.toLowerCase(), weakTopics))
      .slice(0, 8)

    const interestMatches = learningResources
      .filter((res) => {
        const text = `${res.title} ${res.description} ${res.category}`.toLowerCase()
        return includesAny(text, combinedInterests) || preferredCategories.includes(res.category)
      })
      .slice(0, 10)

    const fallback = learningResources
      .filter((res) => preferredCategories.includes(res.category))
      .slice(0, 8)

    const sections = []
    if (basedOnSearch.length > 0) {
      sections.push({
        id: 'searches',
        title: 'Based on your searches',
        subtitle: 'Matched using your most recent search history',
        reasonLabel: 'Why this was recommended: matched your recent searches',
        resources: dedupeById(basedOnSearch)
      })
    }
    if (weakAreaMatches.length > 0) {
      sections.push({
        id: 'weak-areas',
        title: 'To improve your weak areas',
        subtitle: 'Matched against your weak topics from profile and progress',
        reasonLabel: 'Why this was recommended: matched weak topics',
        resources: dedupeById(weakAreaMatches)
      })
    }
    if (interestMatches.length > 0) {
      sections.push({
        id: 'interests',
        title: 'Based on your interests',
        subtitle: 'Matched from ordered interests, additional interests, and course area',
        reasonLabel: 'Why this was recommended: matched interests or course area',
        resources: dedupeById(interestMatches)
      })
    }
    if (sections.length === 0) {
      sections.push({
        id: 'starter',
        title: 'Recommended to get you started',
        subtitle: 'Starter resources from your field',
        reasonLabel: 'Why this was recommended: popular starter resources for your field',
        resources: dedupeById(fallback.length > 0 ? fallback : learningResources.slice(0, 8))
      })
    }
    return sections
  }, [recentSearches, weakTopics.join(','), combinedInterests.join(','), preferredCategories.join(',')])

  let finalResources = []
  if (normalizedSearchQuery) {
    finalResources = searchMatches
  } else if (selectedCategory !== 'recommended') {
    finalResources = learningResources.filter((r) => r.category === selectedCategory)
  }

  const getDifficultyColor = (difficulty) => {
    switch ((difficulty || '').toLowerCase()) {
      case 'beginner':
        return '#10B981'
      case 'intermediate':
        return '#FFD93D'
      case 'advanced':
        return '#FF6B35'
      default:
        return '#6B7280'
    }
  }

  const renderResourceCard = (resource, index, delayBase = 0.1, whyLabel = '') => {
    const field = getFieldForResource(resource, learningFields, resourceToField, categoryToField)
    const proficiency = field && user?.studyStats?.fieldProgress?.[field.id]?.proficiency
    return (
      <motion.div
        key={resource.id}
        className="resource-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delayBase + Math.min(index * 0.04, 0.5) }}
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
        {whyLabel && (
          <p className="resource-quiz-badge" style={{ marginTop: 8 }}>
            {whyLabel}
          </p>
        )}
        <div className="resource-meta">
          <span className="difficulty-badge" style={{ backgroundColor: `${getDifficultyColor(resource.difficulty)}20`, color: getDifficultyColor(resource.difficulty) }}>
            {resource.difficulty}
          </span>
          <span className="duration-badge">{resource.duration}</span>
        </div>
        <div className="resource-actions">
          <a href={resource.link} target="_blank" rel="noopener noreferrer" className="resource-link" onClick={() => startStudySession()}>
            View Resource →
          </a>
          {field && (
            <button className={`resource-quiz-btn ${proficiency ? 'quiz-passed' : ''}`} onClick={() => navigate(`/quiz/${field.id}`)}>
              {proficiency ? <><IconCheck className="inline-check" /> {proficiency}</> : 'Take Quizzes'}
            </button>
          )}
        </div>
        {proficiency && <p className="resource-quiz-badge">Proficiency: {proficiency}</p>}
      </motion.div>
    )
  }

  return (
    <div className="resources-container">
      <Navigation />
      <main id="main-content" role="main" className="resources-content" tabIndex={-1} aria-label="Learning resources">
        <motion.div className="resources-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <h1>Learning Resources</h1>
            <p>We prioritise what you need now: your searches, weak areas, and interests.</p>
          </div>
        </motion.div>

        <motion.div
          className="search-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}
        >
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="Search resources, topics, or skills to learn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-light)',
                color: 'var(--text-main)',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-light)',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '4px'
                }}
              >
                ×
              </button>
            )}
          </form>
          <button
            onClick={handleSearchSubmit}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Search
          </button>
        </motion.div>

        <AnimatePresence>
          {!normalizedSearchQuery && (
            <motion.div
              className="category-filter"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
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
          )}
        </AnimatePresence>

        <div style={{ margin: '10px 0 20px 0' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>
            {normalizedSearchQuery
              ? `Search results for "${searchQuery}"`
              : selectedCategory === 'recommended'
                ? 'Recommended for You'
                : categories.find((c) => c.id === selectedCategory)?.name}
          </h2>
        </div>

        {!normalizedSearchQuery && selectedCategory === 'recommended' && (
          <div>
            {recommendationSections.map((section, sectionIndex) => (
              <section key={section.id} style={{ marginBottom: '28px' }}>
                <h3 style={{ marginBottom: 6 }}>{section.title}</h3>
                <p style={{ marginTop: 0, marginBottom: 14, color: 'var(--text-secondary)' }}>{section.subtitle}</p>
                <div className="resources-grid">
                  {section.resources.map((resource, index) => renderResourceCard(
                    resource,
                    index,
                    0.05 + sectionIndex * 0.05,
                    section.reasonLabel
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {(normalizedSearchQuery || selectedCategory !== 'recommended') && (
          <div className="resources-grid">
            {finalResources.map((resource, index) => renderResourceCard(resource, index))}
          </div>
        )}

        {(normalizedSearchQuery || selectedCategory !== 'recommended') && finalResources.length === 0 && (
          <motion.div className="no-resources" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p>No resources found. Try adjusting your search or selecting a different category.</p>
          </motion.div>
        )}
      </main>
    </div>
  )
}

export default LearningResources
