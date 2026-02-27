import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendAtlasMessage } from '../api/chatApi'
import '../styles/AtlasBot.css'

function formatBotText(text) {
  if (!text) return ''
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  const out = []
  parts.forEach((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      out.push(<strong key={`b-${i}`}>{part.slice(2, -2)}</strong>)
    } else {
      part.split('\n').forEach((line, j) => {
        out.push(<span key={`t-${i}-${j}`}>{line}</span>)
        if (j < part.split('\n').length - 1) out.push(<br key={`br-${i}-${j}`} />)
      })
    }
  })
  return out
}

export default function AtlasBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm EduBot, your EduConnect assistant. I can help you find features, open resources, or fix issues. Ask me anything.", actions: [] }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text }])
    setLoading(true)

    try {
      const { reply, actions } = await sendAtlasMessage(text)
      setMessages((prev) => [...prev, { role: 'bot', text: reply, actions: actions || [] }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: "I couldn't reach the server. Make sure the EduConnect server is running (from the server folder: npm start), then try again.",
          actions: [{ path: '/feedback', label: 'Send Feedback' }]
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (action) => {
    if (action.url) {
      window.open(action.url, '_blank', 'noopener,noreferrer')
      return
    }
    if (action.path && action.path.startsWith('/')) {
      navigate(action.path)
      setOpen(false)
    }
  }

  return (
    <>
      <div className={`atlas-panel ${open ? 'atlas-panel--open' : ''}`} aria-hidden={!open}>
        <div className="atlas-panel-header">
          <div className="atlas-panel-title">
            <span className="atlas-panel-logo">EduBot</span>
            <span className="atlas-panel-subtitle">System help &amp; navigation</span>
          </div>
          <button
            type="button"
            className="atlas-panel-close"
            onClick={() => setOpen(false)}
            aria-label="Close EduBot"
          >
            ×
          </button>
        </div>
        <div className="atlas-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`atlas-msg atlas-msg--${msg.role}`}>
              {msg.role === 'bot' && (
                <div className="atlas-msg-avatar" aria-hidden="true">
                  E
                </div>
              )}
              <div className="atlas-msg-body">
                <div className="atlas-msg-text">{msg.role === 'bot' ? formatBotText(msg.text) : msg.text}</div>
                {msg.role === 'bot' && msg.actions && msg.actions.length > 0 && (
                  <div className="atlas-msg-actions">
                    {msg.actions.map((action, j) => (
                      <button
                        key={j}
                        type="button"
                        className={`atlas-action-btn ${action.url ? 'atlas-action-btn--external' : ''}`}
                        onClick={() => handleAction(action)}
                      >
                        {action.label}
                        {action.url && <span className="atlas-action-external-icon" aria-hidden="true"> ↗</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="atlas-msg atlas-msg--bot">
              <div className="atlas-msg-avatar">E</div>
              <div className="atlas-msg-body">
                <div className="atlas-msg-text atlas-typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSend} className="atlas-form">
          <input
            type="text"
            className="atlas-input"
            placeholder="Ask about features, resources, or issues..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            aria-label="Message EduBot"
          />
          <button type="submit" className="atlas-send" disabled={!input.trim() || loading} aria-label="Send">
            Send
          </button>
        </form>
      </div>
      <button
        type="button"
        className="atlas-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close EduBot' : 'Open EduBot'}
        aria-expanded={open}
      >
        <span className="atlas-fab-icon">E</span>
        <span className="atlas-fab-label">EduBot</span>
      </button>
    </>
  )
}
