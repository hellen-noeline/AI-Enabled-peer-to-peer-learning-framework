import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { getAdminUsersApi } from '../api/authApi'
import { learningFields } from '../data/quizData'
import AdminNavigation from '../components/AdminNavigation'
import '../styles/AdminQuizAssessments.css'

function AdminQuizAssessments() {
  const { user, isAdmin } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterField, setFilterField] = useState('')

  useEffect(() => {
    if (!isAdmin || !user?.email) return
    setLoading(true)
    setError('')
    getAdminUsersApi(user.email)
      .then((data) => data.filter((u) => u.role === 'user'))
      .then(setUsers)
      .catch((err) => setError(err.message || 'Failed to load users'))
      .finally(() => setLoading(false))
  }, [isAdmin, user?.email])

  if (!isAdmin) {
    return (
      <div className="admin-assessments-container">
        <div className="admin-assessments-card">
          <h1>Access Denied</h1>
          <Link to="/dashboard">← Back</Link>
        </div>
      </div>
    )
  }

  const fieldMap = Object.fromEntries(learningFields.map((f) => [f.id, f.name]))

  const getFieldProgress = (u) => u.studyStats?.fieldProgress || {}

  const filteredUsers = filterField
    ? users.filter((u) => getFieldProgress(u)[filterField])
    : users

  return (
    <div className="admin-assessments-container">
      <AdminNavigation />
      <div className="admin-assessments-content">
        <motion.div
          className="admin-assessments-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Quiz Assessments</h1>
          <p>View quiz scores and proficiency across all users</p>
          <Link to="/admin/dashboard" className="back-link">← Dashboard</Link>
        </motion.div>

        {loading && (
          <div className="admin-assessments-loading">
            <div className="spinner" />
            <p>Loading assessments...</p>
          </div>
        )}

        {error && (
          <div className="admin-assessments-error">
            {error}
            <small>Ensure the backend is running.</small>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="admin-assessments-filters">
              <label>Filter by field:</label>
              <select
                value={filterField}
                onChange={(e) => setFilterField(e.target.value)}
              >
                <option value="">All users</option>
                {learningFields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-assessments-table-wrap">
              <table className="admin-assessments-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    {learningFields.map((f) => (
                      <th key={f.id}>{f.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const fp = getFieldProgress(u)
                    return (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <td>
                          <strong>{u.firstName} {u.lastName}</strong>
                        </td>
                        <td>{u.email}</td>
                        {learningFields.map((f) => {
                          const data = fp[f.id]
                          const score = data?.finalScore
                          const prof = data?.proficiency
                          const quizScores = data?.quizScores || {}
                          const hasData = score != null || Object.keys(quizScores).length > 0
                          return (
                            <td key={f.id} className="assessment-cell">
                              {!hasData ? (
                                <span className="no-data">—</span>
                              ) : (
                                <div className="assessment-detail">
                                  {prof && (
                                    <span className={`proficiency-badge ${(prof || '').toLowerCase()}`}>
                                      {prof}
                                    </span>
                                  )}
                                  {score != null && (
                                    <span className="final-score">Final: {score}%</span>
                                  )}
                                  {Object.keys(quizScores).length > 0 && !prof && (
                                    <span className="quiz-scores">
                                      {Object.values(quizScores).join(', ')}%
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="admin-assessments-empty">
                <p>
                  {filterField
                    ? `No users have taken quizzes for ${fieldMap[filterField] || filterField}`
                    : 'No users or quiz data yet.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AdminQuizAssessments
