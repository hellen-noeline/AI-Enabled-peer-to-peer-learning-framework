import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import '../styles/Login.css'

const LAST_EMAIL_KEY = 'EduConnect_lastEmail'

function Login() {
  const [signInAs, setSignInAs] = useState('user') // 'user' | 'admin'
  const [email, setEmail] = useState(() => localStorage.getItem(LAST_EMAIL_KEY) || '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAdminEmail } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate role matches selection
      const emailIsAdmin = isAdminEmail(email)
      if (signInAs === 'admin' && !emailIsAdmin) {
        setError('This account is not an admin. Please sign in as User, or use an admin email.')
        setLoading(false)
        return
      }
      if (signInAs === 'user' && emailIsAdmin) {
        setError('This is an admin account. Please sign in as Admin instead.')
        setLoading(false)
        return
      }

      const user = await login(email, password)
      if (user) {
        localStorage.setItem(LAST_EMAIL_KEY, email.trim())
        navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard')
      } else {
        setError('Incorrect password. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="login-header"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="login-logo">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1>Welcome to EduConnect</h1>
          <p>Find your perfect study partner</p>
        </motion.div>

        <motion.div
          className="sign-in-as-selector"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <span className="sign-in-as-label">Sign in as</span>
          <div className="sign-in-as-options">
            <button
              type="button"
              className={`sign-in-as-btn ${signInAs === 'user' ? 'active' : ''}`}
              onClick={() => { setSignInAs('user'); setError(''); }}
              aria-pressed={signInAs === 'user'}
            >
              User
            </button>
            <button
              type="button"
              className={`sign-in-as-btn ${signInAs === 'admin' ? 'active' : ''}`}
              onClick={() => { setSignInAs('admin'); setError(''); }}
              aria-pressed={signInAs === 'admin'}
            >
              Admin
            </button>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {error}
            </motion.div>
          )}

          <motion.div
            className="form-group"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </motion.div>

          <motion.div
            className="form-group"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </motion.div>

          <motion.button
            type="submit"
            className="login-button"
            disabled={loading}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </motion.button>
        </form>

        <motion.div
          className="login-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
          <p className="login-server-hint">
            Sign in requires the backend server. Run <code>npm start</code> in the <code>server</code> folder first.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Login

