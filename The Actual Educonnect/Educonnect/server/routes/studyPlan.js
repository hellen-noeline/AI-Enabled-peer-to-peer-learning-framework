import { Router } from 'express'
import { generateStudyPlan } from '../studyPlanEngine.js'
import { buildCohortInsights } from '../cohortInsights.js'
import { predictNextTopic } from '../mlInference.js'

const router = Router()

const FIELD_NAMES = {
  ai: 'Artificial Intelligence',
  ml: 'Machine Learning',
  ds: 'Data Science',
  nlp: 'Natural Language Processing',
  cv: 'Computer Vision',
  cyber: 'Cybersecurity',
  web: 'Web Development',
  law: 'Law',
  business: 'Business & Management'
}

function rowToUser(row) {
  if (!row) return null
  const studyStats = row.study_stats ? JSON.parse(row.study_stats) : row.study_stats
  return {
    id: row.id,
    weakTopics: row.weak_topics || '',
    strongTopics: row.strong_topics || '',
    courseArea: row.course_area || '',
    orderedInterests: row.ordered_interests || '',
    preferredStudyHours: row.preferred_study_hours || '',
    preferredLearningStyle: row.preferred_learning_style || '',
    studyStats: studyStats || { totalHours: 0, weeklyHours: [0, 0, 0, 0, 0, 0, 0], fieldProgress: {} }
  }
}

// GET /api/users/:userId/study-plan — generate from DB user (cohort insights wired in)
router.get('/users/:userId/study-plan', (req, res) => {
  try {
    const { userId } = req.params
    const db = req.db
    const row = db.prepare('SELECT id, weak_topics, strong_topics, course_area, ordered_interests, preferred_study_hours, preferred_learning_style, study_stats FROM users WHERE id = ?').get(userId)
    const user = row ? rowToUser(row) : null
    const cohortInsights = buildCohortInsights(db)
    const mlFieldId = predictNextTopic(user)
    const mlNextTopic = mlFieldId ? { fieldId: mlFieldId, fieldName: FIELD_NAMES[mlFieldId] || mlFieldId } : null
    const plan = generateStudyPlan(user, cohortInsights, mlNextTopic)
    res.json(plan)
  } catch (err) {
    console.error('Study plan error:', err)
    res.status(500).json({ error: err.message || 'Failed to generate study plan' })
  }
})

// POST /api/study-plan — generate from body; cohort insights from DB when available
router.post('/study-plan', (req, res) => {
  try {
    const user = req.body?.user || req.body
    const db = req.db
    const cohortInsights = db ? buildCohortInsights(db) : null
    const mlFieldId = predictNextTopic(user)
    const mlNextTopic = mlFieldId ? { fieldId: mlFieldId, fieldName: FIELD_NAMES[mlFieldId] || mlFieldId } : null
    const plan = generateStudyPlan(user, cohortInsights, mlNextTopic)
    res.json(plan)
  } catch (err) {
    console.error('Study plan error:', err)
    res.status(500).json({ error: err.message || 'Failed to generate study plan' })
  }
})

// POST /api/activity — record an event for future “learning” (Phase 2)
router.post('/activity', (req, res) => {
  try {
    const { userId, eventType, payload } = req.body || {}
    if (!userId || !eventType) {
      return res.status(400).json({ error: 'userId and eventType are required' })
    }
    const db = req.db
    const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const payloadStr = payload != null ? JSON.stringify(payload) : null
    db.prepare('INSERT INTO activity_events (id, user_id, event_type, payload) VALUES (?, ?, ?, ?)').run(id, userId, eventType, payloadStr)
    res.status(201).json({ id, ok: true })
  } catch (err) {
    console.error('Activity log error:', err)
    res.status(500).json({ error: err.message || 'Failed to record activity' })
  }
})

export default router
