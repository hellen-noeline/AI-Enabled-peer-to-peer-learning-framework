/**
 * AI-generated quiz API.
 * Uses OpenAI to generate quiz questions in the same format as src/data/quizData.js.
 * Generated fields are saved to server/data/generatedQuizzes.json and returned by GET /api/quiz/fields
 * so they appear on the frontend without editing quizData.js.
 * Requires OPENAI_API_KEY in server .env (same as chat LLM).
 */
import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { learningResources } from '../data/learningResources.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GENERATED_PATH = path.join(__dirname, '..', 'data', 'generatedQuizzes.json')

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

const router = express.Router()
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
const QUIZ_TIMEOUT_MS = 60000

function parseJsonFromResponse(text) {
  if (!text || typeof text !== 'string') return null
  let raw = text.trim()
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) raw = codeBlock[1].trim()
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function callOpenAI(systemPrompt, userPrompt, maxTokens = 2000) {
  if (!OPENAI_API_KEY) return null
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), QUIZ_TIMEOUT_MS)
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.5
      }),
      signal: controller.signal
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() ?? null
  } catch (_) {
    return null
  }
}

const QUIZ_SYSTEM = `You are a quiz generator for an educational app. Output only valid JSON, no other text.
For a regular quiz use this exact shape:
{"id":"fieldId-1","order":1,"title":"Topic Quiz 1: Subtitle","isFinal":false,"questions":[{"id":"q1","question":"Question text?","options":["A","B","C","D"],"correct":0}]}
For a final test use:
{"id":"fieldId-final","title":"Topic Final Assessment","isFinal":true,"questions":[{"id":"f1","question":"Question text?","options":["A","B","C","D"],"correct":0}]}
Rules: "correct" is the 0-based index of the correct option. Each question must have exactly 4 options. Use clear, educational multiple-choice questions.`

/**
 * POST /api/quiz/generate-one
 * Body: { fieldId, fieldName, description, type: 'quiz'|'final', quizOrder?: 1|2|3 }
 * Returns: one quiz object { id, order?, title, isFinal, questions } or finalTest { id, title, isFinal, questions }
 */
router.post('/generate-one', async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(503).json({ error: 'OPENAI_API_KEY not set. Add it to server/.env to use AI quiz generation.' })
  }
  const { fieldId, fieldName, description, type = 'quiz', quizOrder = 1 } = req.body || {}
  if (!fieldId || !fieldName) {
    return res.status(400).json({ error: 'fieldId and fieldName are required' })
  }

  const isFinal = type === 'final'
  const numQuestions = isFinal ? 10 : 5
  const userPrompt = isFinal
    ? `Generate a final assessment with exactly ${numQuestions} multiple-choice questions for this learning field. Field: "${fieldName}". Description: ${description || 'General knowledge'}. Output JSON with id "${fieldId}-final", title "${fieldName} Final Assessment", isFinal: true, and a "questions" array. Each question: id (f1, f2, ...), question, options (array of 4 strings), correct (0-3).`
    : `Generate exactly ${numQuestions} multiple-choice questions for quiz number ${quizOrder} of this learning field. Field: "${fieldName}". Description: ${description || 'General knowledge'}. Output JSON with id "${fieldId}-${quizOrder}", order: ${quizOrder}, title "${fieldName} Quiz ${quizOrder}: [short subtitle]", isFinal: false, and a "questions" array. Each question: id (q1, q2, ...), question, options (array of 4 strings), correct (0-3).`

  const text = await callOpenAI(QUIZ_SYSTEM, userPrompt, 2500)
  const parsed = parseJsonFromResponse(text)
  if (!parsed || !Array.isArray(parsed.questions)) {
    return res.status(502).json({ error: 'AI did not return valid quiz JSON', raw: text ? text.slice(0, 200) : null })
  }

  // Normalize: ensure correct is number, options length 4
  parsed.questions = parsed.questions.slice(0, numQuestions).map((q, i) => ({
    id: q.id || (isFinal ? `f${i + 1}` : `q${i + 1}`),
    question: String(q.question || '').trim() || `Question ${i + 1}`,
    options: Array.isArray(q.options) ? q.options.slice(0, 4).map((o) => String(o)) : ['A', 'B', 'C', 'D'],
    correct: Math.max(0, Math.min(3, Number(q.correct) || 0))
  }))

  res.json(parsed)
})

/**
 * POST /api/quiz/generate-field
 * Body: { fieldId, fieldName, description, resourceIds?: [1,2] }
 * Generates 3 quizzes + 1 final test and returns a full learning field object you can add to quizData.js.
 */
router.post('/generate-field', async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(503).json({ error: 'OPENAI_API_KEY not set. Add it to server/.env to use AI quiz generation.' })
  }
  const { fieldId, fieldName, description, resourceIds = [] } = req.body || {}
  if (!fieldId || !fieldName) {
    return res.status(400).json({ error: 'fieldId and fieldName are required' })
  }

  const quizzes = []
  for (let order = 1; order <= 3; order++) {
    const one = await callOpenAI(
      QUIZ_SYSTEM,
      `Generate exactly 5 multiple-choice questions for quiz number ${order} of this learning field. Field: "${fieldName}". Description: ${description || 'General knowledge'}. Output JSON with id "${fieldId}-${order}", order: ${order}, title "${fieldName} Quiz ${order}: [short subtitle]", isFinal: false, and a "questions" array. Each question: id (q1..q5), question, options (4 strings), correct (0-3).`,
      2500
    )
    const parsed = parseJsonFromResponse(one)
    if (parsed && Array.isArray(parsed.questions)) {
      parsed.questions = parsed.questions.slice(0, 5).map((q, i) => ({
        id: q.id || `q${i + 1}`,
        question: String(q.question || '').trim() || `Question ${i + 1}`,
        options: Array.isArray(q.options) ? q.options.slice(0, 4).map((o) => String(o)) : ['A', 'B', 'C', 'D'],
        correct: Math.max(0, Math.min(3, Number(q.correct) || 0))
      }))
      quizzes.push(parsed)
    }
  }

  const finalText = await callOpenAI(
    QUIZ_SYSTEM,
    `Generate a final assessment with exactly 10 multiple-choice questions for this learning field. Field: "${fieldName}". Description: ${description || 'General knowledge'}. Output JSON with id "${fieldId}-final", title "${fieldName} Final Assessment", isFinal: true, and a "questions" array. Each question: id (f1..f10), question, options (4 strings), correct (0-3).`,
    3500
  )
  const finalParsed = parseJsonFromResponse(finalText)
  let finalTest = null
  if (finalParsed && Array.isArray(finalParsed.questions)) {
    finalTest = {
      id: `${fieldId}-final`,
      title: `${fieldName} Final Assessment`,
      isFinal: true,
      questions: finalParsed.questions.slice(0, 10).map((q, i) => ({
        id: q.id || `f${i + 1}`,
        question: String(q.question || '').trim() || `Question ${i + 1}`,
        options: Array.isArray(q.options) ? q.options.slice(0, 4).map((o) => String(o)) : ['A', 'B', 'C', 'D'],
        correct: Math.max(0, Math.min(3, Number(q.correct) || 0))
      }))
    }
  }

  const field = {
    id: fieldId,
    name: fieldName,
    description: description || '',
    resourceIds: Array.isArray(resourceIds) ? resourceIds : [],
    quizzes,
    finalTest
  }

  const all = readGenerated()
  const idx = all.findIndex((f) => f.id === field.id)
  if (idx >= 0) all[idx] = field
  else all.push(field)
  saveGenerated(all)

  res.json(field)
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
 * Generates quizzes from the learning resources (sites) for this topic: uses title + description
 * of each resource with category === fieldId. No admin needed – can be called when user opens
 * Quiz for a field that has no quizzes yet. Saves to generatedQuizzes.json.
 */
router.post('/generate-from-resources', async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(503).json({ error: 'OPENAI_API_KEY not set. Add it to server/.env.' })
  }
  const { fieldId, fieldName: nameParam } = req.body || {}
  if (!fieldId) {
    return res.status(400).json({ error: 'fieldId is required' })
  }
  const fieldName = nameParam || fieldId.charAt(0).toUpperCase() + fieldId.slice(1).replace(/-/g, ' ')
  const resources = learningResources.filter((r) => (r.category || '').toLowerCase() === String(fieldId).toLowerCase())
  const contentText = resources.length
    ? resources.map((r) => `Title: ${r.title}. Description: ${r.description || ''}`).join('\n\n')
    : `Topic: ${fieldName}. General knowledge.`

  const quizzes = []
  const quizPrompt = `Generate exactly 5 multiple-choice questions based ONLY on the following learning resource content. Use the content to make questions that check understanding. Output JSON with id "${fieldId}-1", order: 1, title "${fieldName} Quiz 1: From your resources", isFinal: false, and a "questions" array. Each question: id (q1..q5), question, options (4 strings), correct (0-3).\n\nContent:\n${contentText.slice(0, 3000)}`
  const one = await callOpenAI(QUIZ_SYSTEM, quizPrompt, 2500)
  const parsed = parseJsonFromResponse(one)
  if (parsed && Array.isArray(parsed.questions)) {
    parsed.questions = parsed.questions.slice(0, 5).map((q, i) => ({
      id: q.id || `q${i + 1}`,
      question: String(q.question || '').trim() || `Question ${i + 1}`,
      options: Array.isArray(q.options) ? q.options.slice(0, 4).map((o) => String(o)) : ['A', 'B', 'C', 'D'],
      correct: Math.max(0, Math.min(3, Number(q.correct) || 0))
    }))
    quizzes.push(parsed)
  }

  const finalPrompt = `Generate a final assessment of exactly 10 multiple-choice questions based ONLY on the following learning resource content. Use the content to make questions that check understanding. Output JSON with id "${fieldId}-final", title "${fieldName} Final Assessment", isFinal: true, and a "questions" array. Each question: id (f1..f10), question, options (4 strings), correct (0-3).\n\nContent:\n${contentText.slice(0, 4000)}`
  const finalText = await callOpenAI(QUIZ_SYSTEM, finalPrompt, 3500)
  const finalParsed = parseJsonFromResponse(finalText)
  let finalTest = null
  if (finalParsed && Array.isArray(finalParsed.questions)) {
    finalTest = {
      id: `${fieldId}-final`,
      title: `${fieldName} Final Assessment`,
      isFinal: true,
      questions: finalParsed.questions.slice(0, 10).map((q, i) => ({
        id: q.id || `f${i + 1}`,
        question: String(q.question || '').trim() || `Question ${i + 1}`,
        options: Array.isArray(q.options) ? q.options.slice(0, 4).map((o) => String(o)) : ['A', 'B', 'C', 'D'],
        correct: Math.max(0, Math.min(3, Number(q.correct) || 0))
      }))
    }
  }

  const field = {
    id: fieldId,
    name: fieldName,
    description: `Quizzes generated from your learning resources (${resources.length} courses/sites).`,
    resourceIds: resources.map((r) => r.id),
    quizzes,
    finalTest
  }

  const all = readGenerated()
  const idx = all.findIndex((f) => f.id === field.id)
  if (idx >= 0) all[idx] = field
  else all.push(field)
  saveGenerated(all)

  res.json(field)
})

export default router
