/**
 * Ensures the default admin user exists: admin@educonnect.com / 1234 with role admin.
 * Called on server startup so only this account can access admin endpoints.
 */
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { getDb } from './db.js'

const ADMIN_EMAIL = 'admin@educonnect.com'
const ADMIN_PASSWORD = '1234'
const SALT_ROUNDS = 10

export function ensureAdmin() {
  const db = getDb()
  if (!db) return
  const email = ADMIN_EMAIL.toLowerCase()
  const existing = db.prepare('SELECT id, role FROM users WHERE LOWER(email) = ?').get(email)
  const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, SALT_ROUNDS)
  const now = new Date().toISOString()
  const defaultStudyStats = JSON.stringify({
    totalHours: 0,
    weeklyHours: [0, 0, 0, 0, 0, 0, 0],
    sessionsCompleted: 0,
    studyProgress: 0
  })

  if (existing) {
    db.prepare('UPDATE users SET password_hash = ?, role = ? WHERE id = ?').run(passwordHash, 'admin', existing.id)
    console.log('Admin user updated: ' + ADMIN_EMAIL)
  } else {
    const id = randomUUID()
    db.prepare(`
      INSERT INTO users (
        id, email, password_hash, first_name, last_name, role,
        study_stats, last_week_reset, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, email, passwordHash, 'Admin', 'User', 'admin', defaultStudyStats, now, now)
    console.log('Admin user created: ' + ADMIN_EMAIL + ' (password: ' + ADMIN_PASSWORD + ')')
  }
}
