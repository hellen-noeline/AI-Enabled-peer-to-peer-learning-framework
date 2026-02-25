import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { getAdminUsersApi } from '../api/authApi'
import AdminNavigation from '../components/AdminNavigation'
import '../styles/AdminDashboard.css'

function AdminDashboard() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin || !user?.email) return
    getAdminUsersApi(user.email)
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [isAdmin, user?.email])

  if (!isAdmin) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const totalUsers = users.length
  const usersWithQuizzes = users.filter(
    (u) => u.studyStats?.fieldProgress && Object.keys(u.studyStats.fieldProgress).length > 0
  ).length
  const totalAssessments = users.reduce((sum, u) => {
    const fp = u.studyStats?.fieldProgress || {}
    return sum + Object.values(fp).filter((p) => p.proficiency).length
  }, 0)

  const statCards = [
    {
      title: 'Total Users',
      value: loading ? '—' : totalUsers,
      subtitle: 'Registered in the system',
      route: '/admin/users',
      icon: '👥',
      color: '#6366F1'
    },
    {
      title: 'Users with Quiz Data',
      value: loading ? '—' : usersWithQuizzes,
      subtitle: 'Have taken at least one quiz',
      route: '/admin/assessments',
      icon: '📝',
      color: '#10B981'
    },
    {
      title: 'Field Assessments',
      value: loading ? '—' : totalAssessments,
      subtitle: 'Proficiency tests completed',
      route: '/admin/assessments',
      icon: '✓',
      color: '#F59E0B'
    }
  ]

  const quickActions = [
    { label: 'View All Users', route: '/admin/users', desc: 'Manage registered users' },
    { label: 'Quiz Assessments', route: '/admin/assessments', desc: 'View quiz scores & proficiency' },
    { label: 'Feedback', route: '/feedback', desc: 'Respond to user feedback' }
  ]

  return (
    <div className="admin-dashboard-container">
      <AdminNavigation />
      <div className="admin-dashboard-content">
        <motion.div
          className="admin-dashboard-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {user?.firstName}. Manage users and assess quiz performance.</p>
        </motion.div>

        <div className="admin-stats-grid">
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              className="admin-stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(card.route)}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <div className="admin-stat-icon" style={{ background: `${card.color}20` }}>
                {card.icon}
              </div>
              <div className="admin-stat-content">
                <h3>{card.title}</h3>
                <p className="admin-stat-value">{card.value}</p>
                <p className="admin-stat-subtitle">{card.subtitle}</p>
              </div>
              <span className="admin-stat-arrow">→</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="admin-quick-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2>Quick Actions</h2>
          <div className="admin-actions-grid">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.route}
                className="admin-action-card"
                onClick={() => navigate(action.route)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
              >
                <h3>{action.label}</h3>
                <p>{action.desc}</p>
                <span className="admin-action-link">Go →</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AdminDashboard
