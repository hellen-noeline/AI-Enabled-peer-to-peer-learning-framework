/**
 * AI-generated quiz API.
 * Uses local Python backend (KeyBERT + T5) for quiz generation—no OpenAI API required.
 * Pipeline: text input → preprocessing → keyword extraction → question generation → quiz output.
 * Generated fields are saved to server/data/generatedQuizzes.json and returned by GET /api/quiz/fields.
 */
import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { learningResources } from '../data/learningResources.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GENERATED_PATH = path.join(__dirname, '..', 'data', 'generatedQuizzes.json')
const PYTHON_QUIZ_URL = process.env.PYTHON_QUIZ_URL || 'http://localhost:5001'
const QUIZ_TIMEOUT_MS = 120000

function readGenerated() {
  try {
    const raw = fs.readFileSync(GENERATED_PATH, 'utf-8')
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function saveGenerated(fields) {
  const dir = path.dirname(GENERATED_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(GENERATED_PATH, JSON.stringify(fields, null, 2), 'utf-8')
}

async function callPythonQuiz(body) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), QUIZ_TIMEOUT_MS)
    const res = await fetch(`${PYTHON_QUIZ_URL}/api/quiz/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    })
    clearTimeout(timeout)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Python quiz API: ${res.status}`)
    }
    return await res.json()
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Quiz generation timed out')
    throw err
  }
}

const router = express.Router()

/**
 * POST /api/quiz/generate-one
 * Body: { fieldId, fieldName, description, type: 'quiz'|'final', quizOrder?: 1|2|3 }
 * Returns: one quiz object. Delegates to Python; generates full field and returns requested quiz/final.
 */
router.post('/generate-one', async (req, res) => {
  const { fieldId, fieldName, description, type = 'quiz', quizOrder = 1 } = req.body || {}
  if (!fieldId || !fieldName) {
    return res.status(400).json({ error: 'fieldId and fieldName are required' })
  }
  const text = description || `Topic: ${fieldName}. General knowledge.`
  try {
    const field = await callPythonQuiz({ text, fieldId, fieldName, resourceIds: [] })
    if (type === 'final' && field.finalTest) {
      return res.json(field.finalTest)
    }
    const quiz = field.quizzes?.[(quizOrder || 1) - 1]
    return res.json(quiz || field.quizzes?.[0] || { error: 'No quiz generated' })
  } catch (err) {
    return res.status(503).json({ error: err.message || 'Quiz generation failed. Ensure Python backend is running (port 5001).' })
  }
})

/**
 * POST /api/quiz/generate-field
 * Body: { fieldId, fieldName, description, resourceIds?: [1,2] }
 * Generates 3 quizzes + 1 final test from resources or description. Uses local AI (KeyBERT + T5).
 */
router.post('/generate-field', async (req, res) => {
  const { fieldId, fieldName, description, resourceIds = [] } = req.body || {}
  if (!fieldId || !fieldName) {
    return res.status(400).json({ error: 'fieldId and fieldName are required' })
  }
  let text = description || ''
  const ids = Array.isArray(resourceIds) ? resourceIds : []
  if (ids.length > 0) {
    const resources = learningResources.filter((r) => ids.includes(r.id))
    text = resources.map((r) => `Title: ${r.title}. ${r.description || ''}`).join('\n\n')
  }
  if (!text || text.trim().length < 20) {
    text = text || `Topic: ${fieldName}. General knowledge.`
  }
  try {
    const field = await callPythonQuiz({
      text: text.trim(),
      fieldId,
      fieldName,
      resourceIds: ids
    })
    const all = readGenerated()
    const idx = all.findIndex((f) => f.id === field.id)
    if (idx >= 0) all[idx] = field
    else all.push(field)
    saveGenerated(all)
    res.json(field)
  } catch (err) {
    res.status(503).json({
      error: err.message || 'Quiz generation failed. Start the Python backend: cd backend && python app.py'
    })
  }
})

/**
 * GET /api/quiz/fields – returns all AI-generated fields (saved from Generate Quizzes).
 * Frontend merges these with static learningFields from quizData.js so they appear in the app.
 */
router.get('/fields', (req, res) => {
  try {
    const fields = readGenerated()
    res.json({ fields })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to read generated quizzes' })
  }
})

/**
 * POST /api/quiz/generate-from-resources
 * Body: { fieldId, fieldName? }
 * Python backend loads resources, expands to quiz_source_text (longer, focused content),
 * then generates quizzes. Uses KeyBERT + T5.
 */
router.post('/generate-from-resources', async (req, res) => {
  const { fieldId, fieldName: nameParam } = req.body || {}
  if (!fieldId) {
    return res.status(400).json({ error: 'fieldId is required' })
  }
  const fieldName = nameParam || fieldId.charAt(0).toUpperCase() + fieldId.slice(1).replace(/-/g, ' ')
  const resources = learningResources.filter((r) => (r.category || '').toLowerCase() === String(fieldId).toLowerCase())
  const resourceIds = resources.map((r) => r.id)

  try {
    // Send fieldId/resourceIds only; Python loads resources and expands quiz_source_text
    const field = await callPythonQuiz({
      fieldId,
      fieldName,
      resourceIds
    })
    field.description = `Quizzes generated from your learning resources (${resources.length} courses/sites).`
    const all = readGenerated()
    const idx = all.findIndex((f) => f.id === field.id)
    if (idx >= 0) all[idx] = field
    else all.push(field)
    saveGenerated(all)
    res.json(field)
  } catch (err) {
    res.status(503).json({
      error: err.message || 'Quiz generation failed. Start the Python backend: cd backend && python app.py'
    })
  }
})

export default router
