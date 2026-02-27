import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useStudy } from '../contexts/StudyContext'
import '../styles/Navigation.css'

function Navigation() {
  const { user, logout, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { stopStudySession } = useStudy()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    stopStudySession() // Save any active study session before clearing user
    logout()
    navigate('/login', { replace: true })
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/recommendations', label: 'Find Partners' },
    { path: '/groups', label: 'Study Groups' },
    { path: '/resources', label: 'Resources' },
    { path: '/profile', label: 'Profile' },
    { path: '/feedback', label: 'Feedback' }
  ]

  return (
    <motion.nav
      className="navigation"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="nav-container">
        <Link to="/dashboard" className="nav-logo">
          <span>EduConnect</span>
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
                  layoutId="nav-indicator"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
            
            )
          })}
        </div>

        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="theme-toggle-icon" aria-hidden>{theme === 'dark' ? '☀️' : '🌙'}</span>
        </button>

        <div className="nav-user">
          <div className="user-info">
            <div className="user-avatar">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="user-details">
              <span className="user-name">
                {user?.firstName} {user?.lastName}
                {isAdmin && <span className="admin-badge">Admin</span>}
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

export default Navigation

