import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useStudy } from '../contexts/StudyContext'
import Navigation from '../components/Navigation'
import { getGroupMessages, sendGroupMessage } from '../utils/groupChat'
import { getRecommendedResourcesFromChat } from '../utils/chatResourceRecommender'
import '../styles/GroupChat.css'

function GroupChat() {
  const { chatRoomId } = useParams()
  const { user } = useAuth()
  const { startStudySession } = useStudy()
  const navigate = useNavigate()
  const location = useLocation()
  const [messages, setMessages] = useState([])
  const recommendedResources = getRecommendedResourcesFromChat(messages, 5, user)
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null)
  const pollRef = useRef(null)
  const inputRef = useRef(null)

  const groupName = location.state?.groupName || chatRoomId?.replace('group_', '').replace(/_/g, ' ') || 'Study Group'
  const groupMembers = location.state?.groupMembers || []

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!chatRoomId) {
      navigate('/groups')
      return
    }

    const loadMessages = () => {
      setMessages(getGroupMessages(chatRoomId))
    }
    loadMessages()
    pollRef.current = setInterval(loadMessages, 2000)
    return () => clearInterval(pollRef.current)
  }, [user, chatRoomId, navigate])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [chatRoomId])

  const handleSubmit = (e) => {
    e.preventDefault()
    const text = newMessage.trim()
    if (!text || !user) return

    sendGroupMessage(chatRoomId, {
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      text
    })
    setMessages(getGroupMessages(chatRoomId))
    setNewMessage('')
  }

  if (!user) return null

  const otherMembers = groupMembers.filter(m => m.id !== user?.id)

  return (
    <div className="group-chat-container">
      <Navigation />
      <div className="group-chat-content group-chat-with-sidebar">
        <motion.div
          className="group-chat-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="chat-header">
            <button
              type="button"
              className="chat-back-btn"
              onClick={() => navigate('/groups')}
            >
              ← Back
            </button>
            <h1>{groupName} Chat</h1>
            <p>Chat with your study group members • Message anyone privately</p>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <p>No messages yet. Start the conversation!</p>
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
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!newMessage.trim()}
            >
              Send
            </button>
          </form>
        </motion.div>

        {(otherMembers.length > 0 || recommendedResources.length > 0) && (
        <aside className="group-chat-sidebar">
          {otherMembers.length > 0 && (
            <div className="group-chat-members-panel">
              <h3>Group Members</h3>
              <p className="members-panel-hint">Message privately</p>
              <div className="members-panel-list">
                {otherMembers.map((member) => (
                  <div key={member.id} className="members-panel-item">
                    <div className="member-avatar-small">
                      {member.firstName?.[0]}{member.lastName?.[0]}
                    </div>
                    <div className="member-details">
                      <span className="member-name-small">
                        {member.firstName} {member.lastName}
                      </span>
                      <button
                        type="button"
                        className="message-member-btn"
                        onClick={() =>
                          navigate(`/chat/dm/${member.id}`, {
                            state: { otherUser: member, fromGroup: true }
                          })
                        }
                      >
                        Message
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recommendedResources.length > 0 && (
            <div className="chat-recommended-resources">
              <h3>Recommended for this chat</h3>
              <p className="members-panel-hint">Based on your discussion</p>
              <div className="chat-resources-list">
                {recommendedResources.map((res) => (
                  <a
                    key={res.id}
                    href={res.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chat-resource-item"
                    onClick={() => startStudySession?.()}
                  >
                    <span className="chat-resource-title">{res.title}</span>
                    <span className="chat-resource-meta">{res.provider} • {res.difficulty}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </aside>
        )}
      </div>
    </div>
  )
}

export default GroupChat
