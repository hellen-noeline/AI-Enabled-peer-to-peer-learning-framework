import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import '../styles/Navigation.css'

function AdminNavigation() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/users', label: 'Users' },
    { path: '/admin/assessments', label: 'Quiz Assessments' },
    { path: '/feedback', label: 'Feedback' }
  ]

  return (
    <motion.nav
      className="navigation admin-nav"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="nav-container">
        <Link to="/admin/dashboard" className="nav-logo">
          <span>EduConnect Admin</span>
        </Link>

        <div className="nav-links">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    className="nav-indicator"
                    layoutId="admin-nav-indicator"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </div>

        <div className="nav-user">
          <div className="user-info">
            <div className="user-avatar admin-avatar">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="user-details">
              <span className="user-name">
                {user?.firstName} {user?.lastName}
                <span className="admin-badge">Admin</span>
              </span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
          <motion.button
            className="logout-btn"
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Logout
          </motion.button>
        </div>
      </div>
    </motion.nav>
  )
}

export default AdminNavigation
