import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import Navigation from '../components/Navigation'
import { logActivity } from '../api/activityApi'
import { learningFields, PASSING_SCORE, getProficiency } from '../data/quizData'
import '../styles/Quiz.css'

function Quiz() {
  const { fieldId, quizId } = useParams()
  const { user, recordFieldProgress } = useAuth()
  const navigate = useNavigate()

  const field = learningFields.find((f) => f.id === fieldId)
  const quiz = field
    ? quizId === 'final'
      ? field.finalTest
      : field.quizzes.find((q) => q.id === quizId)
    : null

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)

  if (!user) {
    navigate('/login')
    return null
  }

  if (!field || !quiz) {
    return (
      <div className="quiz-container">
        <Navigation />
        <div className="quiz-content">
          <p>Quiz not found.</p>
          <button className="quiz-btn primary" onClick={() => navigate('/resources')}>Back to Resources</button>
        </div>
      </div>
    )
  }

  const { questions, title, isFinal } = quiz
  const currentQ = questions[currentIndex]
  const totalQuestions = questions.length
  const isLast = currentIndex === totalQuestions - 1

  const handleAnswer = (optionIndex) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optionIndex }))
  }

  const handleNext = () => {
    if (isLast) {
      const correct = questions.filter((q) => answers[q.id] === q.correct).length
      const score = correct / totalQuestions
      const passed = score >= PASSING_SCORE
      const scorePercent = Math.round(score * 100)
      setResult({ score: scorePercent, passed, correct, total: totalQuestions, isFinal })
      recordFieldProgress(fieldId, quiz.id, score, isFinal)
      if (user?.id) logActivity(user.id, 'quiz_completed', { fieldId, quizId: quiz.id, score: scorePercent, passed, isFinal })
      setSubmitted(true)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  const handlePrev = () => setCurrentIndex((i) => Math.max(0, i - 1))

  if (submitted && result) {
    const prof = isFinal ? getProficiency(result.score) : null
    return (
      <div className="quiz-container">
        <Navigation />
        <div className="quiz-content">
          <motion.div
            className="quiz-result-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h1>Quiz Complete</h1>
            <p className="quiz-result-title">{title}</p>
            <div className={`quiz-score-badge ${result.passed ? 'passed' : 'not-passed'}`}>
              <span className="quiz-score-value">{result.score}%</span>
              <span className="quiz-score-label">{result.passed ? 'Passed' : 'Not Passed'}</span>
            </div>
            {isFinal && prof && (
              <div className="quiz-proficiency-result" style={{ color: prof.color }}>
                <strong>Proficiency: {prof.level}</strong>
              </div>
            )}
            <p className="quiz-score-detail">
              {result.correct} of {result.total} correct (need {Math.ceil(PASSING_SCORE * 100)}% to pass)
            </p>
            {result.passed && (
              <p className="quiz-credit-msg">✓ Study progress recorded – 0.25h credit added</p>
            )}
            <div className="quiz-result-actions">
              <button
                className="quiz-btn primary"
                onClick={() => {
                  setSubmitted(false)
                  setResult(null)
                  setCurrentIndex(0)
                  setAnswers({})
                }}
              >
                Retake Quiz
              </button>
              <button className="quiz-btn secondary" onClick={() => navigate(`/quiz/${fieldId}`)}>
                Back to {field.name}
              </button>
              <button className="quiz-btn secondary" onClick={() => navigate('/resources')}>
                Resources
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="quiz-container">
      <Navigation />
      <div className="quiz-content">
        <motion.div className="quiz-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="quiz-header">
            <h1>{title}</h1>
            <p className="quiz-progress">Question {currentIndex + 1} of {totalQuestions}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="quiz-question"
            >
              <h2 className="quiz-question-text">{currentQ.question}</h2>
              <div className="quiz-options">
                {currentQ.options.map((opt, idx) => (
                  <button
                    key={idx}
                    className={`quiz-option ${answers[currentQ.id] === idx ? 'selected' : ''}`}
                    onClick={() => handleAnswer(idx)}
                  >
                    <span className="quiz-option-letter">{String.fromCharCode(65 + idx)}</span>
                    <span className="quiz-option-text">{opt}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="quiz-actions">
            <button className="quiz-btn secondary" onClick={handlePrev} disabled={currentIndex === 0}>
              Previous
            </button>
            <button
              className="quiz-btn primary"
              onClick={handleNext}
              disabled={answers[currentQ.id] === undefined}
            >
              {isLast ? 'Submit' : 'Next'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Quiz