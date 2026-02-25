import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import Navigation from '../components/Navigation'
import { getChatRoomId, joinGroup } from '../utils/groupChat'
import '../styles/StudyGroups.css'

function StudyGroups() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    // Generate study groups based on user's interests
    const generateGroups = async () => {
      try {
        const { loadDataset, getDatasetUsers } = await import('../utils/datasetLoader')
        await loadDataset()
        const allUsers = [
          ...getDatasetUsers(),
          ...JSON.parse(localStorage.getItem('EduConnect_users') || '[]')
        ]

        const userGroups = createStudyGroups(user, allUsers)
        setGroups(userGroups)
      } catch (error) {
        console.error('Error generating groups:', error)
      } finally {
        setLoading(false)
      }
    }

    generateGroups()
  }, [user, navigate])

  const createStudyGroups = (currentUser, allUsers) => {
    // Get user's interests
    const userInterests = parseCommaSeparated(currentUser.csInterests || '')
    const userTechSkills = parseCommaSeparated(currentUser.technicalSkills || '')
    const userResearch = parseCommaSeparated(currentUser.researchInterests || '')

    // Filter out current user
    const otherUsers = allUsers.filter(u => u.id !== currentUser.id)

    // Create groups based on interests
    const interestGroups = {}
    
    userInterests.forEach(interest => {
      const interestKey = interest.toLowerCase().trim()
      if (!interestGroups[interestKey]) {
        interestGroups[interestKey] = {
          name: interest,
          interest: interestKey,
          members: [],
          commonInterests: [interest],
          matchScore: 0
        }
      }

      // Find users with similar interests
      otherUsers.forEach(otherUser => {
        const otherInterests = parseCommaSeparated(otherUser.csInterests || '')
        if (otherInterests.some(i => i.toLowerCase().trim() === interestKey)) {
          // Check if user is not already in group
          if (!interestGroups[interestKey].members.find(m => m.id === otherUser.id)) {
            // Calculate match score
            const matchScore = calculateGroupMatch(currentUser, otherUser, interestKey)
            if (matchScore > 0.3) { // Minimum 30% match
              interestGroups[interestKey].members.push({
                ...otherUser,
                matchScore: Math.round(matchScore * 100)
              })
            }
          }
        }
      })

      // Sort members by match score
      interestGroups[interestKey].members.sort((a, b) => b.matchScore - a.matchScore)
      
      // Limit to top 5-8 members per group
      interestGroups[interestKey].members = interestGroups[interestKey].members.slice(0, 8)
      
      // Calculate average match score for the group
      if (interestGroups[interestKey].members.length > 0) {
        const avgScore = interestGroups[interestKey].members.reduce((sum, m) => sum + m.matchScore, 0) / interestGroups[interestKey].members.length
        interestGroups[interestKey].matchScore = Math.round(avgScore)
      }
    })

    // Convert to array and filter groups with at least 2 members (including current user)
    const groupsArray = Object.values(interestGroups)
      .filter(group => group.members.length >= 2)
      .map(group => ({
        ...group,
        totalMembers: group.members.length + 1, // +1 for current user
        id: `group_${group.interest}_${Date.now()}`,
        chatRoomId: getChatRoomId(group)
      }))
      .sort((a, b) => b.matchScore - a.matchScore)

    return groupsArray
  }

  const calculateGroupMatch = (user1, user2, primaryInterest) => {
    let score = 0
    let factors = 0

    // Primary interest match (40%)
    const user1Interests = parseCommaSeparated(user1.csInterests || '')
    const user2Interests = parseCommaSeparated(user2.csInterests || '')
    if (user1Interests.some(i => i.toLowerCase().trim() === primaryInterest) &&
        user2Interests.some(i => i.toLowerCase().trim() === primaryInterest)) {
      score += 0.4
    }
    factors += 0.4

    // Technical skills match (25%)
    const user1Tech = parseCommaSeparated(user1.technicalSkills || '')
    const user2Tech = parseCommaSeparated(user2.technicalSkills || '')
    const techIntersection = user1Tech.filter(t => 
      user2Tech.some(t2 => t.toLowerCase().trim() === t2.toLowerCase().trim())
    ).length
    const techUnion = new Set([...user1Tech, ...user2Tech]).size
    if (techUnion > 0) {
      score += (techIntersection / techUnion) * 0.25
    }
    factors += 0.25

    // Research interests match (20%)
    const user1Research = parseCommaSeparated(user1.researchInterests || '')
    const user2Research = parseCommaSeparated(user2.researchInterests || '')
    const researchIntersection = user1Research.filter(r => 
      user2Research.some(r2 => r.toLowerCase().trim() === r2.toLowerCase().trim())
    ).length
    const researchUnion = new Set([...user1Research, ...user2Research]).size
    if (researchUnion > 0) {
      score += (researchIntersection / researchUnion) * 0.2
    }
    factors += 0.2

    // Learning style match (10%)
    if (user1.preferredLearningStyle && user2.preferredLearningStyle) {
      if (user1.preferredLearningStyle === user2.preferredLearningStyle) {
        score += 0.1
      }
    }
    factors += 0.1

    // Study hours preference match (5%)
    if (user1.preferredStudyHours && user2.preferredStudyHours) {
      if (user1.preferredStudyHours === user2.preferredStudyHours) {
        score += 0.05
      }
    }
    factors += 0.05

    return factors > 0 ? score / factors : 0
  }

  const parseCommaSeparated = (str) => {
    if (!str || typeof str !== 'string') return []
    return str.split(',').map(item => item.trim()).filter(item => item.length > 0)
  }

  const getGroupSizeColor = (size) => {
    if (size >= 6) return '#10B981'
    if (size >= 4) return '#FFD93D'
    return '#FF6B35'
  }

  if (loading) {
    return (
      <div className="groups-container">
        <Navigation />
        <div className="groups-content">
          <div className="loading-state">
            <p>Creating your study groups...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="groups-container">
      <Navigation />
      <div className="groups-content">
        <motion.div
          className="groups-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1>Your Study Groups</h1>
            <p>Groups automatically created based on your interests and skills</p>
          </div>
          <div className="groups-stats">
            <div className="stat-item">
              <span className="stat-value">{groups.length}</span>
              <span className="stat-label">Groups</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {groups.reduce((sum, g) => sum + g.totalMembers, 0)}
              </span>
              <span className="stat-label">Total Members</span>
            </div>
          </div>
        </motion.div>

        {groups.length === 0 ? (
          <motion.div
            className="no-groups"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2>No Groups Found</h2>
            <p>We couldn't find enough users with similar interests to create study groups.</p>
            <p>Try updating your profile with more interests to find better matches!</p>
          </motion.div>
        ) : (
          <div className="groups-grid">
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                className="group-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
              >
                <div className="group-header">
                  <div className="group-title-section">
                    <h3>{group.name} Study Group</h3>
                    <div className="group-match-badge">
                      <span className="match-score">{group.matchScore}%</span>
                      <span className="match-label">Match</span>
                    </div>
                  </div>
                  <div 
                    className="group-size-badge"
                    style={{ 
                      backgroundColor: getGroupSizeColor(group.totalMembers) + '20',
                      color: getGroupSizeColor(group.totalMembers)
                    }}
                  >
                    {group.totalMembers} members
                  </div>
                </div>

                <div className="group-interests">
                  <span className="interests-label">Common Interests:</span>
                  <div className="interests-tags">
                    {group.commonInterests.map((interest, i) => (
                      <span key={i} className="interest-tag">{interest}</span>
                    ))}
                  </div>
                </div>

                <div className="group-members">
                  <h4>Group Members ({group.members.length + 1})</h4>
                  <div className="members-list">
                    {/* Current user */}
                    <div className="member-item current-user">
                      <div className="member-avatar">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <div className="member-info">
                        <span className="member-name">{user.firstName} {user.lastName} (You)</span>
                        <span className="member-university">{user.university || 'Student'}</span>
                      </div>
                      <span className="member-badge">You</span>
                    </div>

                    {/* Other members */}
                    {group.members.slice(0, 5).map((member) => (
                      <div key={member.id} className="member-item">
                        <div className="member-avatar">
                          {member.firstName?.[0]}{member.lastName?.[0]}
                        </div>
                        <div className="member-info">
                          <span className="member-name">{member.firstName} {member.lastName}</span>
                          <span className="member-university">{member.university || 'Student'}</span>
                        </div>
                        <div className="member-actions">
                          <span className="member-match">{member.matchScore}%</span>
                          <button
                            type="button"
                            className="member-dm-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/chat/dm/${member.id}`, {
                                state: { otherUser: member, fromGroup: false }
                              })
                            }}
                          >
                            Message
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {group.members.length > 5 && (
                    <p className="more-members">
                      +{group.members.length - 5} more members
                    </p>
                  )}
                </div>

                <div className="group-actions">
                  <button
                    type="button"
                    className="action-btn primary join-group-btn"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      joinGroup(group.chatRoomId, user.id)
                      const groupMembers = [user, ...group.members]
                      navigate(`/groups/chat/${group.chatRoomId}`, {
                        state: {
                          groupName: `${group.name} Study Group`,
                          groupMembers
                        }
                      })
                    }}
                  >
                    Join Group
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StudyGroups

