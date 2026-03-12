import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import Navigation from '../components/Navigation'
import { getProficiency } from '../data/quizData'
import { useLearningFields } from '../contexts/LearningFieldsContext'
import { generateFromResources } from '../api/quizApi'
import '../styles/Quiz.css'

function QuizHub() {
  const { fieldId } = useParams()
  const { user } = useAuth()
  const { learningFields, resourceToField, refreshGenerated } = useLearningFields()
  const navigate = useNavigate()
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState(null)
  const attemptedGen = useRef(null)

  let field = learningFields.find((f) => f.id === fieldId)
  if (!field && /^\d+$/.test(fieldId)) {
    const resourceField = resourceToField[parseInt(fieldId, 10)]
    if (resourceField) {
      navigate(`/quiz/${resourceField.id}`, { replace: true })
      return null
    }
  }

  if (!user) {
    navigate('/login')
    return null
  }

  const allQuizzes = field ? [...(field.quizzes || []), field.finalTest].filter(Boolean) : []
  const needsGeneration = !field || allQuizzes.length === 0

  const runGenerateFromResources = () => {
    const fieldName = field?.name || fieldId.charAt(0).toUpperCase() + fieldId.slice(1).replace(/-/g, ' ')
    setGenerateError(null)
    setGenerating(true)
    generateFromResources({ fieldId, fieldName })
      .then(() => refreshGenerated())
      .catch((err) => setGenerateError(err?.message || 'Generation failed'))
      .finally(() => setGenerating(false))
  }

  useEffect(() => {
    if (!needsGeneration || !fieldId) return
    if (attemptedGen.current === fieldId) return
    attemptedGen.current = fieldId
    runGenerateFromResources()
  }, [fieldId, needsGeneration])

  if (!field && !generating && generateError) {
    return (
      <div className="quiz-container">
        <Navigation />
        <div className="quiz-content">
          <p>Could not load quizzes for this topic.</p>
          <p style={{ color: 'var(--error, #c00)' }}>{generateError}</p>
          <button className="quiz-btn primary" onClick={() => { attemptedGen.current = null; runGenerateFromResources() }}>Try again</button>
          <button className="quiz-btn secondary" onClick={() => navigate('/resources')}>Back to Resources</button>
        </div>
      </div>
    )
  }

  if (!field || (field && allQuizzes.length === 0)) {
    const showError = !generating && generateError
    return (
      <div className="quiz-container">
        <Navigation />
        <div className="quiz-content">
          <motion.div className="quiz-hub-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="quiz-hub-header">
              <h1>{field?.name || fieldId}</h1>
              <p className="quiz-hub-desc">
                {generating ? 'Generating quiz from your learning resources (courses/sites)…' : showError ? 'Generation failed.' : 'Preparing your quiz…'}
              </p>
              {showError && (
                <>
                  <p style={{ color: 'var(--error, #c00)' }}>{generateError}</p>
                  <button className="quiz-btn primary" onClick={() => { attemptedGen.current = null; runGenerateFromResources() }}>Try again</button>
                </>
              )}
            </div>
            {generating && <p className="quiz-hub-note">No admin needed — quizzes are created from the learning resources you use.</p>}
            <button className="quiz-btn secondary" onClick={() => navigate('/resources')}>← Back to Resources</button>
          </motion.div>
        </div>
      </div>
    )
  }

  const progress = user.studyStats?.fieldProgress?.[fieldId] || {}
  const quizScores = progress.quizScores || {}
  const finalScore = progress.finalScore
  const proficiency = progress.proficiency
  const quizzes = field.quizzes || []
  const totalQuizzes = quizzes.length

  return (
    <div className="quiz-container">
      <Navigation />
      <div className="quiz-content">
        <motion.div
          className="quiz-hub-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="quiz-hub-header">
            <h1>{field.name}</h1>
            <p className="quiz-hub-desc">{field.description}</p>
            {proficiency && (
              <div
                className="quiz-proficiency-badge"
                style={{ borderColor: getProficiency(finalScore || 0).color, color: getProficiency(finalScore || 0).color }}
              >
                {proficiency}
              </div>
            )}
          </div>

          <div className="quiz-hub-progress">
            <h3>Your Progress</h3>
            <div className="quiz-progress-list">
              {quizzes.map((q) => (
                <div key={q.id} className="quiz-progress-item">
                  <span className="quiz-progress-label">{q.title}</span>
                  <span className="quiz-progress-score">
                    {quizScores[q.id] != null ? `${quizScores[q.id]}%` : '—'}
                  </span>
                  <button
                    className="quiz-btn small"
                    onClick={() => navigate(`/quiz/${fieldId}/${q.id}`)}
                  >
                    {quizScores[q.id] != null ? 'Retake' : 'Take'}
                  </button>
                </div>
              ))}
              {field.finalTest && (
                <div key="final" className="quiz-progress-item final">
                  <span className="quiz-progress-label">{field.finalTest.title}</span>
                  <span className="quiz-progress-score">{finalScore != null ? `${finalScore}%` : '—'}</span>
                  <button
                    className="quiz-btn small primary"
                    onClick={() => navigate(`/quiz/${fieldId}/final`)}
                  >
                    {finalScore != null ? 'Retake Final' : 'Take Final Test'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="quiz-hub-note">
            Complete quizzes to build knowledge. The final test gauges your proficiency in this field.
          </p>

          <button className="quiz-btn secondary" onClick={() => navigate('/resources')}>
            ← Back to Resources
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default QuizHub
