import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import Navigation from '../components/Navigation'
import '../styles/NLPInsights.css'

const BERTOPIC_API = 'http://localhost:5000'

const STORAGE_GROUP_CHAT = 'EduConnect_groupChat'
const STORAGE_DM_CHAT = 'EduConnect_dmChat'

/** Collect documents from feedback, group chats, and personal chats for topic modelling */
function collectDocumentsForTopics() {
  const documents = []
  const sources = { feedback: 0, groupChat: 0, dmChat: 0 }

  // Feedback
  const allFeedback = JSON.parse(localStorage.getItem('EduConnect_feedback') || '[]')
  allFeedback.forEach((f) => {
    const text = `${f.subject || ''} ${f.message || ''}`.trim()
    if (text.length > 10) {
      documents.push(text)
      sources.feedback++
    }
  })

  // Group chat messages
  const groupChats = JSON.parse(localStorage.getItem(STORAGE_GROUP_CHAT) || '{}')
  Object.values(groupChats).forEach((messages) => {
    (messages || []).forEach((msg) => {
      const text = (msg.text || '').trim()
      if (text.length > 10) {
        documents.push(text)
        sources.groupChat++
      }
    })
  })

  // Personal (DM) chat messages
  const dmChats = JSON.parse(localStorage.getItem(STORAGE_DM_CHAT) || '{}')
  Object.values(dmChats).forEach((messages) => {
    (messages || []).forEach((msg) => {
      const text = (msg.text || '').trim()
      if (text.length > 10) {
        documents.push(text)
        sources.dmChat++
      }
    })
  })

  return { documents, sources }
}

function NLPInsights() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [topics, setTopics] = useState([])
  const [documentTopics, setDocumentTopics] = useState([])
  const [sources, setSources] = useState(null)

  const runTopicModelling = async () => {
    setError('')
    setLoading(true)
    setSources(null)
    try {
      const { documents, sources: docSources } = collectDocumentsForTopics()
      setSources(docSources)

      if (documents.length < 2) {
        setError('Need at least 2 documents to run topic modelling. Add more feedback or chat messages (group chats and personal chats are included).')
        setLoading(false)
        return
      }

      const res = await fetch(`${BERTOPIC_API}/api/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Topic modelling failed')
      }

      setTopics(data.topics || [])
      setDocumentTopics(data.document_topics || [])
    } catch (err) {
      setError(err.message || 'Backend may be offline. Run: cd backend && python app.py')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  if (!user) return null

  return (
    <div className="nlp-insights-container">
      <Navigation />
      <div className="nlp-insights-content">
        <motion.div
          className="nlp-insights-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="nlp-header">
            <h1>NLP Insights</h1>
            <p>BERTopic for topic modelling • DistilBERT for sentiment (on Feedback)</p>
          </div>

          <div className="nlp-section">
            <h2>Topic Modelling (BERTopic)</h2>
            <p>Extract topics from feedback, group chats, and personal chats. Requires Python backend running.</p>
            {sources && (
              <div className="nlp-sources">
                <span>Sources: {sources.feedback} feedback</span>
                <span>{sources.groupChat} group chat</span>
                <span>{sources.dmChat} personal chat</span>
                <span className="nlp-total">{sources.feedback + sources.groupChat + sources.dmChat} total</span>
              </div>
            )}
            <button
              className="nlp-run-btn"
              onClick={runTopicModelling}
              disabled={loading}
            >
              {loading ? 'Running BERTopic...' : 'Run Topic Modelling'}
            </button>
            {error && <p className="nlp-error">{error}</p>}
          </div>

          {topics.length > 0 && (
            <div className="topics-section">
              <h3>Detected Topics</h3>
              <div className="topics-list">
                {topics.map((t) => (
                  <div key={t.topic_id} className="topic-card">
                    <h4>Topic {t.topic_id}</h4>
                    <p className="topic-count">{t.count} documents</p>
                    <div className="topic-keywords">
                      {t.keywords?.map((kw, i) => (
                        <span key={i} className="keyword-tag">{kw}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="nlp-note">
            <strong>Setup:</strong> Start the BERTopic backend: <code>cd backend && pip install -r requirements.txt && python app.py</code>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default NLPInsights
