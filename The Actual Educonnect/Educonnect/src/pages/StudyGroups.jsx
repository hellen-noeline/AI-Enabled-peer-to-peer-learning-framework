import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import Navigation from '../components/Navigation'
import { getGroupsApi, joinGroupApi } from '../api/groupsApi'
import '../styles/StudyGroups.css'

function StudyGroups() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [programmeFilter, setProgrammeFilter] = useState('all')
  const [availableProgrammes, setAvailableProgrammes] = useState([])

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const loadGroups = async () => {
      try {
        const groupsData = await getGroupsApi(user.id)
        setGroups(groupsData)

        const programmes = new Set()
        groupsData.forEach(g => {
          (g.programmes || []).forEach(p => programmes.add(p))
        })
        setAvailableProgrammes(Array.from(programmes).sort())
      } catch (error) {
        console.error('Error loading groups:', error)
        setGroups([])
      } finally {
        setLoading(false)
      }
    }

    loadGroups()
  }, [user, navigate])

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

  const filteredGroups = groups.filter(group => {
    if (programmeFilter === 'all') return true
    return Array.isArray(group.programmes) && group.programmes.includes(programmeFilter)
  })

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
              <span className="stat-value">{filteredGroups.length}</span>
              <span className="stat-label">Groups</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {filteredGroups.reduce((sum, g) => sum + g.totalMembers, 0)}
              </span>
              <span className="stat-label">Total Members</span>
            </div>
            <div className="stat-item programme-filter-item">
              <select
                value={programmeFilter}
                onChange={(e) => setProgrammeFilter(e.target.value)}
                className="programme-select"
              >
                <option value="all">All programmes</option>
                {availableProgrammes.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {filteredGroups.length === 0 ? (
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
            {filteredGroups.map((group, index) => (
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
                    onClick={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      try {
                        await joinGroupApi(group.chatRoomId, user.id)
                        const groupMembers = [user, ...group.members]
                        navigate(`/groups/chat/${group.chatRoomId}`, {
                          state: {
                            groupName: `${group.name} Study Group`,
                            groupMembers
                          }
                        })
                      } catch (err) {
                        console.error('Failed to join group:', err)
                      }
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

