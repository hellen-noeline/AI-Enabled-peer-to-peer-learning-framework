/*
This file defines the feedback routes for the application using Express.

Its main purpose is to handle the full feedback workflow between users and admins.
The code allows users to submit feedback, view their own feedback, and lets admins
view all feedback entries and respond to them.

Main logic of the file:
1. A user submits feedback, which is saved into the feedback table in the database.
2. The feedback can include details such as type, subject, message, rating,
   and optional sentiment analysis information.
3. A user can later request to see only the feedback they personally submitted.
4. An admin can request to see all feedback in the system.
5. An admin can respond to a specific feedback entry.
6. When the admin responds, the feedback status is updated to resolved,
   the admin's response is stored, the response time is recorded,
   and an email notification can be sent to the user.

The helper function rowToFeedback() is used to convert raw database rows
into cleaner JavaScript objects with frontend-friendly field names.

Overall, this file acts as the backend controller for collecting,
retrieving, managing, and resolving user feedback.
*/
import { Router } from 'express'
import { randomUUID } from 'crypto'
import { sendFeedbackResponseEmail } from '../emailService.js'

const router = Router()

function rowToFeedback(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    type: row.type,
    subject: row.subject,
    message: row.message,
    rating: row.rating ?? 0,
    status: row.status,
    adminResponse: row.admin_response ?? null,
    respondedAt: row.responded_at ?? null,
    sentiment: (row.sentiment_label != null || row.sentiment_score != null)
      ? { label: row.sentiment_label, score: row.sentiment_score }
      : null,
    createdAt: row.created_at
  }
}

// Submit feedback (caller sends userId so we store it; email is looked up from DB when responding)
router.post('/', (req, res) => {
  try {
    const { userId, userEmail, userName, type, subject, message, rating, sentiment } = req.body || {}
    if (!userId || !type || !subject || !message) {
      return res.status(400).json({ error: 'userId, type, subject and message are required' })
    }
    const id = randomUUID()
    const sentimentLabel = sentiment?.label ?? null
    const sentimentScore = sentiment?.score ?? null
    req.db.prepare(`
      INSERT INTO feedback (id, user_id, type, subject, message, rating, sentiment_label, sentiment_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, type || 'general', subject, message, rating ?? 0, sentimentLabel, sentimentScore)
    const row = req.db.prepare(`
      SELECT f.*, u.email AS user_email, COALESCE(TRIM(u.first_name || ' ' || u.last_name), u.email, 'User') AS user_name
      FROM feedback f
      LEFT JOIN users u ON u.id = f.user_id
      WHERE f.id = ?
    `).get(id)
    res.status(201).json({ feedback: rowToFeedback(row) })
  } catch (err) {
    console.error('Submit feedback error:', err)
    res.status(500).json({ error: err.message || 'Failed to submit feedback' })
  }
})

// List my feedback (identified by user email header)
router.get('/', (req, res) => {
  try {
    const email = (req.headers['x-user-email'] || '').trim().toLowerCase()
    if (!email) {
      return res.status(401).json({ error: 'X-User-Email header required' })
    }
    const user = req.db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(email)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    const rows = req.db.prepare(`
      SELECT f.*, u.email AS user_email, COALESCE(TRIM(u.first_name || ' ' || u.last_name), u.email, 'User') AS user_name
      FROM feedback f
      LEFT JOIN users u ON u.id = f.user_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(user.id)
    res.json({ feedback: rows.map(rowToFeedback) })
  } catch (err) {
    console.error('List feedback error:', err)
    res.status(500).json({ error: err.message || 'Failed to list feedback' })
  }
})

// Admin: list all feedback (requires role = admin in DB)
router.get('/admin/all', (req, res) => {
  try {
    const adminEmail = (req.headers['x-user-email'] || '').trim().toLowerCase()
    if (!adminEmail) {
      return res.status(401).json({ error: 'X-User-Email header required' })
    }
    const admin = req.db.prepare('SELECT id, role FROM users WHERE LOWER(email) = ?').get(adminEmail)
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view all feedback' })
    }
    const rows = req.db.prepare(`
      SELECT f.*, u.email AS user_email, COALESCE(TRIM(u.first_name || ' ' || u.last_name), u.email, 'User') AS user_name
      FROM feedback f
      LEFT JOIN users u ON u.id = f.user_id
      ORDER BY f.created_at DESC
    `).all()
    res.json({ feedback: rows.map(rowToFeedback) })
  } catch (err) {
    console.error('Admin list feedback error:', err)
    res.status(500).json({ error: err.message || 'Failed to list feedback' })
  }
})

// Admin: respond to feedback (requires role = admin in DB)
router.post('/admin/:id/respond', (req, res) => {
  try {
    const adminEmail = (req.headers['x-user-email'] || '').trim().toLowerCase()
    if (!adminEmail) {
      return res.status(401).json({ error: 'X-User-Email header required' })
    }
    const admin = req.db.prepare('SELECT id, role FROM users WHERE LOWER(email) = ?').get(adminEmail)
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can respond to feedback' })
    }
    const { id } = req.params
    const { adminResponse } = req.body || {}
    if (!adminResponse || !String(adminResponse).trim()) {
      return res.status(400).json({ error: 'adminResponse is required' })
    }
    const feedback = req.db.prepare(`
      SELECT f.*, u.email AS user_email, COALESCE(TRIM(u.first_name || ' ' || u.last_name), u.email, 'User') AS user_name
      FROM feedback f
      LEFT JOIN users u ON u.id = f.user_id
      WHERE f.id = ?
    `).get(id)
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' })
    }
    const respondedAt = new Date().toISOString()
    req.db.prepare(`
      UPDATE feedback SET status = ?, admin_response = ?, responded_at = ? WHERE id = ?
    `).run('resolved', adminResponse.trim(), respondedAt, id)
    const toEmail = feedback.user_email
    const userName = feedback.user_name || 'User'
    if (toEmail) {
      sendFeedbackResponseEmail({
        toEmail,
        userName,
        originalSubject: feedback.subject,
        adminResponse: adminResponse.trim()
      }).catch((err) => console.error('Failed to send feedback response email:', err))
    }
    const updated = req.db.prepare(`
      SELECT f.*, u.email AS user_email, COALESCE(TRIM(u.first_name || ' ' || u.last_name), u.email, 'User') AS user_name
      FROM feedback f
      LEFT JOIN users u ON u.id = f.user_id
      WHERE f.id = ?
    `).get(id)
    res.json({ feedback: rowToFeedback(updated) })
  } catch (err) {
    console.error('Respond to feedback error:', err)
    res.status(500).json({ error: err.message || 'Failed to respond' })
  }
})

export default router
