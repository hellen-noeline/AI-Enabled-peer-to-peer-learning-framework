import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import Navigation from '../components/Navigation'
import { learningFields, getProficiency, resourceToField } from '../data/quizData'
import '../styles/Quiz.css'

function QuizHub() {
  const { fieldId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
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

  if (!field) {
    return (
      <div className="quiz-container">
        <Navigation />
        <div className="quiz-content">
          <p>Field not found.</p>
          <button className="quiz-btn primary" onClick={() => navigate('/resources')}>Back to Resources</button>
        </div>
      </div>
    )
  }

  const progress = user.studyStats?.fieldProgress?.[fieldId] || {}
  const quizScores = progress.quizScores || {}
  const finalScore = progress.finalScore
  const proficiency = progress.proficiency

  const allQuizzes = [...field.quizzes, field.finalTest]
  const totalQuizzes = field.quizzes.length

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
              {field.quizzes.map((q) => (
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
