import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { getAdminUsersApi } from '../api/authApi'
import AdminNavigation from '../components/AdminNavigation'
import '../styles/AdminUsers.css'

function AdminUsers() {
  const { user, isAdmin } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadUsers = useCallback(() => {
    if (!isAdmin || !user?.email) return
    setLoading(true)
    setError('')
    getAdminUsersApi(user.email)
      .then((list) => {
        setUsers(Array.isArray(list) ? list : [])
        setError('')
      })
      .catch((err) => {
        setError(err.message || 'Failed to load users. Ensure the backend is running.')
        setUsers([])
      })
      .finally(() => setLoading(false))
  }, [isAdmin, user?.email])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  if (!isAdmin) {
    return (
      <div className="admin-users-container">
        <div className="admin-users-card">
          <h1>Access Denied</h1>
          <Link to="/dashboard">← Back</Link>
        </div>
      </div>
    )
  }

  const formatDate = (iso) => {
    if (!iso) return '—'
    try {
      const d = new Date(iso)
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="admin-users-container">
      <AdminNavigation />
      <motion.div
        className="admin-users-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="admin-users-header">
          <h1>Registered Users</h1>
          <p>All users who have signed up and are stored in the database</p>
          <div className="admin-users-header-actions">
            <Link to="/admin/dashboard" className="back-link">← Dashboard</Link>
            <button type="button" className="admin-users-refresh" onClick={loadUsers} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh list'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="admin-users-loading">
            <div className="spinner" />
            <p>Loading users...</p>
          </div>
        )}

        {error && (
          <div className="admin-users-error">
            {error}
            <small>Start the backend: cd backend, then run: pip install -r requirements.txt &amp; python app.py</small>
          </div>
        )}

        {!loading && !error && users.length === 0 && (
          <div className="admin-users-empty">
            <p>No users have signed up yet.</p>
          </div>
        )}

        {!loading && !error && users.length > 0 && (
          <div className="admin-users-table-wrap">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.02 }}
                  >
                    <td>{u.firstName} {u.lastName}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-badge ${u.role === 'admin' ? 'admin' : 'user'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default AdminUsers
