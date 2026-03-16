import { Router } from 'express'
import { randomUUID } from 'crypto'

const router = Router()

function getCurrentUserId(req) {
  return (req.headers['x-user-id'] || '').trim() || null
}

function getDmId(userId1, userId2) {
  const ids = [userId1, userId2].filter(Boolean).sort()
  return ids.length === 2 ? `dm_${ids[0]}_${ids[1]}` : null
}

// GET /api/dm/:otherUserId/messages
router.get('/:otherUserId/messages', (req, res) => {
  try {
    const userId = getCurrentUserId(req)
    if (!userId) {
      return res.status(401).json({ error: 'X-User-Id header required' })
    }

    const otherUserId = req.params.otherUserId
    if (!otherUserId || userId === otherUserId) {
      return res.status(400).json({ error: 'Invalid other user id' })
    }

    const dmId = getDmId(userId, otherUserId)
    const rows = req.db.prepare('SELECT id, dm_id, user_id, user_name, text, created_at FROM dm_messages WHERE dm_id = ? ORDER BY created_at ASC').all(dmId)
    const messages = rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      text: r.text,
      createdAt: r.created_at
    }))
    res.json({ messages })
  } catch (err) {
    console.error('DM messages error:', err)
    res.status(500).json({ error: err.message || 'Failed to fetch messages' })
  }
})

// POST /api/dm/:otherUserId/messages
router.post('/:otherUserId/messages', (req, res) => {
  try {
    const userId = getCurrentUserId(req)
    if (!userId) {
      return res.status(401).json({ error: 'X-User-Id header required' })
    }

    const otherUserId = req.params.otherUserId
    if (!otherUserId || userId === otherUserId) {
      return res.status(400).json({ error: 'Invalid other user id' })
    }

    const dmId = getDmId(userId, otherUserId)
    const { text } = req.body || {}
    const userName = (req.headers['x-user-name'] || '').trim() || 'Unknown'

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Message text required' })
    }

    const id = randomUUID()
    req.db.prepare('INSERT INTO dm_messages (id, dm_id, user_id, user_name, text) VALUES (?, ?, ?, ?, ?)').run(id, dmId, userId, userName, text.trim())

    const msg = req.db.prepare('SELECT id, dm_id, user_id, user_name, text, created_at FROM dm_messages WHERE id = ?').get(id)
    res.status(201).json({
      message: {
        id: msg.id,
        userId: msg.user_id,
        userName: msg.user_name,
        text: msg.text,
        createdAt: msg.created_at
      }
    })
  } catch (err) {
    console.error('Send DM message error:', err)
    res.status(500).json({ error: err.message || 'Failed to send message' })
  }
})

export default router
