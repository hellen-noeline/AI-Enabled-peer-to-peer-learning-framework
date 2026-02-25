import { Router } from 'express'

const router = Router()

function rowToUser(row) {
  if (!row) return null
  const studyStats = row.study_stats ? JSON.parse(row.study_stats) : {}
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    university: row.university,
    createdAt: row.created_at,
    lastLoginTime: row.last_login_time,
    studyStats: studyStats
  }
}

// GET /api/admin/users – list all users (requires role = admin in DB)
router.get('/users', (req, res) => {
  try {
    const adminEmail = (req.headers['x-user-email'] || '').trim().toLowerCase()
    if (!adminEmail) {
      return res.status(401).json({ error: 'X-User-Email header required' })
    }
    const admin = req.db.prepare('SELECT id, role FROM users WHERE LOWER(email) = ?').get(adminEmail)
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can list users' })
    }

    const rows = req.db.prepare('SELECT id, email, first_name, last_name, university, created_at, last_login_time, study_stats FROM users ORDER BY created_at DESC').all()
    const users = rows.map(rowToUser)
    res.json({ users })
  } catch (err) {
    console.error('Admin users error:', err)
    res.status(500).json({ error: err.message || 'Failed to fetch users' })
  }
})

export default router
