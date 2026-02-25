import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import Navigation from '../components/Navigation'
import { getDmId, getDmMessages, sendDmMessage } from '../utils/groupChat'
import '../styles/PersonalChat.css'

function PersonalChat() {
  const { otherUserId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null)
  const pollRef = useRef(null)
  const inputRef = useRef(null)

  const otherUser = location.state?.otherUser
  const otherUserName = otherUser
    ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || 'Unknown'
    : 'Study partner'
  const fromGroup = location.state?.fromGroup

  const dmId = user && otherUserId ? getDmId(user.id, otherUserId) : null

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!otherUserId || !dmId) {
      navigate('/groups')
      return
    }

    const loadMessages = () => setMessages(getDmMessages(dmId))
    loadMessages()
    pollRef.current = setInterval(loadMessages, 2000)
    return () => clearInterval(pollRef.current)
  }, [user, otherUserId, dmId, navigate])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [dmId])

  const handleSubmit = (e) => {
    e.preventDefault()
    const text = newMessage.trim()
    if (!text || !user || !dmId) return

    sendDmMessage(dmId, {
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      text
    })
    setMessages(getDmMessages(dmId))
    setNewMessage('')
  }

  if (!user) return null

  return (
    <div className="personal-chat-container">
      <Navigation />
      <div className="personal-chat-content">
        <motion.div
          className="personal-chat-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="chat-header">
            <button
              type="button"
              className="chat-back-btn"
              onClick={() => (fromGroup ? navigate(-1) : navigate('/groups'))}
            >
              ← Back
            </button>
            <h1>Chat with {otherUserName}</h1>
            <p>Private conversation (only you and {otherUserName} can see this)</p>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <p>No messages yet. Say hello!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.userId === user.id ? 'own' : 'other'}`}
                >
                  <div className="message-avatar">
                    {msg.userName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                  </div>
                  <div className="message-body">
                    <span className="message-sender">{msg.userName}</span>
                    <p className="message-text">{msg.text}</p>
                    <span className="message-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="chat-input-form">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              maxLength={500}
              className="chat-input"
              aria-label="Message input"
            />
            <button type="submit" className="chat-send-btn" disabled={!newMessage.trim()}>
              Send
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default PersonalChat
