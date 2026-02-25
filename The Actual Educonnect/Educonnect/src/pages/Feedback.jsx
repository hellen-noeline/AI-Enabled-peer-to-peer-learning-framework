import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import AdminNavigation from '../components/AdminNavigation'
import { analyzeSentiment } from '../utils/sentimentAnalysis'
import { sendFeedbackConfirmation, sendFeedbackResponseToUser } from '../utils/emailService'
import {
  submitFeedbackApi,
  getMyFeedbackApi,
  getAdminFeedbackApi,
  respondToFeedbackApi
} from '../api/feedbackApi'
import '../styles/Feedback.css'

function Feedback() {
  const { user, isAdmin } = useAuth()
  const [formData, setFormData] = useState({
    type: 'general',
    subject: '',
    message: '',
    rating: 0
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [myFeedback, setMyFeedback] = useState([])
  const [allFeedback, setAllFeedback] = useState([]) // Admin: all feedback
  const [respondingTo, setRespondingTo] = useState(null)
  const [adminResponse, setAdminResponse] = useState('')
  const [respondLoading, setRespondLoading] = useState(false)
  const [adminError, setAdminError] = useState('')

  const loadMyFeedback = React.useCallback(async () => {
    if (!user?.email) return
    try {
      const mine = await getMyFeedbackApi(user.email)
      setMyFeedback(mine)
    } catch (_) {
      const stored = JSON.parse(localStorage.getItem('EduConnect_feedback') || '[]')
      setMyFeedback([...stored.filter(f => f.userId === user?.id)].reverse())
    }
  }, [user?.email, user?.id])

  const loadAllFeedbackForAdmin = React.useCallback(async () => {
    if (!user?.email || !isAdmin) return
    try {
      const all = await getAdminFeedbackApi(user.email)
      setAllFeedback(all)
    } catch (_) {
      const stored = JSON.parse(localStorage.getItem('EduConnect_feedback') || '[]')
      setAllFeedback([...stored].reverse())
    }
  }, [user?.email, isAdmin])

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('EduConnect_feedback') || '[]')
    const fromStorage = [...stored].reverse()
    const userFeedbackFromStorage = stored.filter(f => f.userId === user?.id)

    if (user?.email) {
      loadMyFeedback()
      if (isAdmin) {
        loadAllFeedbackForAdmin()
      } else {
        setAllFeedback(fromStorage)
      }
    } else {
      setMyFeedback([...userFeedbackFromStorage].reverse())
      setAllFeedback(fromStorage)
    }
  }, [user, isAdmin, loadMyFeedback, loadAllFeedbackForAdmin])

  // Admins: refresh feedback list periodically so new user submissions appear
  useEffect(() => {
    if (!isAdmin || !user?.email) return
    const interval = setInterval(loadAllFeedbackForAdmin, 30000)
    return () => clearInterval(interval)
  }, [isAdmin, user?.email, loadAllFeedbackForAdmin])

  // Admins: refresh when tab gets focus so returning to the page shows latest
  useEffect(() => {
    if (!isAdmin || !user?.email) return
    const onFocus = () => loadAllFeedbackForAdmin()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [isAdmin, user?.email, loadAllFeedbackForAdmin])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!user) {
      setError('Please sign in to submit feedback.')
      return
    }
    if (!formData.subject.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    const message = formData.message.trim()
    const subject = formData.subject.trim()
    const fullText = `${subject}. ${message}`

    let sentiment = { label: 'NEUTRAL', score: 0.5 }
    try {
      sentiment = await analyzeSentiment(fullText)
    } catch (_) {}

    try {
      let feedback
      try {
        feedback = await submitFeedbackApi({
          userId: user.id,
          userEmail: user.email,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          type: formData.type,
          subject,
          message,
          rating: formData.rating,
          sentiment: { label: sentiment.label, score: sentiment.score }
        })
        setMyFeedback((prev) => [feedback, ...prev])
      } catch (apiErr) {
        const fallback = {
          id: Date.now().toString(),
          userId: user.id,
          userEmail: user.email,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          type: formData.type,
          subject,
          message,
          rating: formData.rating,
          createdAt: new Date().toISOString(),
          status: 'pending',
          sentiment: { label: sentiment.label, score: sentiment.score }
        }
        const stored = JSON.parse(localStorage.getItem('EduConnect_feedback') || '[]')
        stored.push(fallback)
        localStorage.setItem('EduConnect_feedback', JSON.stringify(stored))
        feedback = fallback
        setMyFeedback((prev) => [feedback, ...prev])
      }

      const feedbackTypeLabel = feedbackTypes.find(t => t.value === formData.type)?.label || 'General Feedback'
      await sendFeedbackConfirmation({
        toEmail: user.email,
        userName: feedback.userName || user.email,
        subject,
        message,
        feedbackType: feedbackTypeLabel
      })

      setFormData({ type: 'general', subject: '', message: '', rating: 0 })
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to submit feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const feedbackTypes = [
    { value: 'general', label: 'General Feedback' },
    { value: 'bug', label: 'Bug Report' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'improvement', label: 'Improvement Suggestion' },
    { value: 'other', label: 'Other' }
  ]

  const updateFeedbackInStorage = (feedbackId, updates) => {
    const stored = JSON.parse(localStorage.getItem('EduConnect_feedback') || '[]')
    const idx = stored.findIndex(f => f.id === feedbackId)
    if (idx >= 0) {
      stored[idx] = { ...stored[idx], ...updates }
      localStorage.setItem('EduConnect_feedback', JSON.stringify(stored))
      setAllFeedback([...stored].reverse())
      if (stored[idx].userId === user?.id) {
        setMyFeedback([...stored.filter(f => f.userId === user?.id)].reverse())
      }
    }
  }

  const handleAdminRespond = async (feedback) => {
    if (!adminResponse.trim()) return
    setRespondLoading(true)
    setAdminError('')
    try {
      const trimmed = adminResponse.trim()
      try {
        const updated = await respondToFeedbackApi(feedback.id, trimmed, user?.email)
        setAllFeedback((prev) => prev.map((f) => (f.id === feedback.id ? updated : f)))
        if (feedback.userId === user?.id) {
          setMyFeedback((prev) => prev.map((f) => (f.id === feedback.id ? updated : f)))
        }
      } catch (apiErr) {
        const updates = {
          status: 'resolved',
          adminResponse: trimmed,
          respondedAt: new Date().toISOString()
        }
        updateFeedbackInStorage(feedback.id, updates)
        await sendFeedbackResponseToUser({
          toEmail: feedback.userEmail,
          userName: feedback.userName,
          originalSubject: feedback.subject,
          adminResponse: trimmed
        })
      }
      setRespondingTo(null)
      setAdminResponse('')
    } catch (err) {
      setAdminError(err.message || 'Response saved locally but email may have failed.')
    } finally {
      setRespondLoading(false)
    }
  }

  return (
    <div className="feedback-container">
      {isAdmin && <AdminNavigation />}
      <motion.div
        className="feedback-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        role="main"
        id="main-content"
        aria-label="Feedback"
        data-audio-main
      >
        <div className="feedback-header">
          <h1>{isAdmin ? 'Admin: Manage Feedback' : 'Share Your Feedback'}</h1>
          <p>{isAdmin ? 'View all user feedback and respond. Responses are sent to each user\'s sign-in email.' : "We'd love to hear from you! Sentiment is analyzed with DistilBERT."}</p>
          {!isAdmin && <Link to="/dashboard" className="feedback-nlp-link">← Back to Dashboard</Link>}
          {isAdmin && <Link to="/admin/dashboard" className="feedback-nlp-link">← Admin Dashboard</Link>}
        </div>

        {isAdmin && (
          <div className="admin-feedback-section">
            <h2>All User Feedback</h2>
            {allFeedback.length === 0 ? (
              <p className="no-feedback-msg">No feedback submitted yet.</p>
            ) : (
              <div className="admin-feedback-list">
                {allFeedback.map((feedback) => (
                  <motion.div
                    key={feedback.id}
                    className={`admin-feedback-item ${respondingTo === feedback.id ? 'responding' : ''}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="admin-feedback-meta">
                      <span className="feedback-type">{feedbackTypes.find(t => t.value === feedback.type)?.label}</span>
                      <span className="feedback-from">{feedback.userName} &lt;{feedback.userEmail}&gt;</span>
                      <span className="feedback-date">
                        {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className={`feedback-status ${feedback.status}`}>{feedback.status}</span>
                    </div>
                    <h3>{feedback.subject}</h3>
                    <p>{feedback.message}</p>
                    {feedback.adminResponse && (
                      <div className="admin-response-display">
                        <strong>Your response (sent to user):</strong>
                        <p>{feedback.adminResponse}</p>
                        {feedback.respondedAt && (
                          <span className="responded-at">
                            Sent {new Date(feedback.respondedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                    {!feedback.adminResponse && (
                      <>
                        {respondingTo === feedback.id ? (
                          <div className="respond-form">
                            <textarea
                              value={adminResponse}
                              onChange={(e) => setAdminResponse(e.target.value)}
                              placeholder="Type your response to the user..."
                              rows={4}
                              disabled={respondLoading}
                            />
                            <div className="respond-actions">
                              <button
                                type="button"
                                className="send-response-btn"
                                onClick={() => handleAdminRespond(feedback)}
                                disabled={respondLoading || !adminResponse.trim()}
                              >
                                {respondLoading ? 'Sending...' : "Send response to user's email"}
                              </button>
                              <button
                                type="button"
                                className="cancel-respond-btn"
                                onClick={() => { setRespondingTo(null); setAdminResponse(''); setAdminError(''); }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="respond-btn"
                            onClick={() => setRespondingTo(feedback.id)}
                          >
                            Respond & Email User
                          </button>
                        )}
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {isAdmin && adminError && (
          <motion.div className="error-message" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {adminError}
          </motion.div>
        )}

        {!isAdmin && !user && (
          <div className="feedback-login-required">
            <p>Please sign in to submit feedback. Responses to your feedback will be sent to the email you use to sign in.</p>
            <Link to="/login" className="feedback-nlp-link">Sign in</Link>
          </div>
        )}
        {!isAdmin && user && (
        <form onSubmit={handleSubmit} className="feedback-form">
          {submitted && (
            <motion.div
              className="success-message"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M20 6L9 17L4 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Thank you for your feedback! A confirmation has been sent to your email.
            </motion.div>
          )}
          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {error}
            </motion.div>
          )}
          <div className="form-group">
            <label htmlFor="type">Feedback Type *</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              {feedbackTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject *</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Brief summary of your feedback"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message *</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Please provide detailed feedback..."
              rows="6"
              required
            />
          </div>

          <div className="form-group">
            <label>Overall Rating (Optional)</label>
            <div className="rating-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  type="button"
                  className={`rating-star ${formData.rating >= star ? 'active' : ''}`}
                  onClick={() => handleRatingClick(star)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </motion.button>
              ))}
              {formData.rating > 0 && (
                <span className="rating-text">
                  {formData.rating === 1 && 'Poor'}
                  {formData.rating === 2 && 'Fair'}
                  {formData.rating === 3 && 'Good'}
                  {formData.rating === 4 && 'Very Good'}
                  {formData.rating === 5 && 'Excellent'}
                </span>
              )}
            </div>
          </div>

          <motion.button
            type="submit"
            className="submit-button"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </motion.button>
        </form>
        )}

        {!isAdmin && myFeedback.length > 0 && (
          <div className="my-feedback-section">
            <h2>Your Previous Feedback</h2>
            <div className="feedback-list">
              {myFeedback.map((feedback) => (
                <motion.div
                  key={feedback.id}
                  className="feedback-item"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="feedback-item-header">
                    <div className="feedback-meta">
                      <span className="feedback-type">{feedbackTypes.find(t => t.value === feedback.type)?.label}</span>
                      <span className="feedback-date">
                        {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {feedback.rating > 0 && (
                      <div className="feedback-rating-display">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            viewBox="0 0 24 24"
                            fill={i < feedback.rating ? 'currentColor' : 'none'}
                            className={i < feedback.rating ? 'filled' : 'empty'}
                          >
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                          </svg>
                        ))}
                      </div>
                    )}
                  </div>
                  <h3>{feedback.subject}</h3>
                  <p>{feedback.message}</p>
                  {feedback.sentiment && (
                    <span className={`feedback-sentiment sentiment-${(feedback.sentiment.label || '').toLowerCase()}`}>
                      {feedback.sentiment.label} ({(feedback.sentiment.score * 100).toFixed(0)}%)
                    </span>
                  )}
                  <span className={`feedback-status ${feedback.status}`}>
                    {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default Feedback

