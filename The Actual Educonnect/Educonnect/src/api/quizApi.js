/**
 * API for AI-generated quizzes (OpenAI). Requires OPENAI_API_KEY on the server.
 * Generated fields are saved on the server and returned by getGeneratedFields() so they appear on the frontend.
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const FIELDS_TIMEOUT_MS = 5000

export async function getGeneratedFields() {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FIELDS_TIMEOUT_MS)
  try {
    const res = await fetch(`${API_BASE}/api/quiz/fields`, { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return []
    const data = await res.json().catch(() => ({}))
    return Array.isArray(data.fields) ? data.fields : []
  } catch (_) {
    clearTimeout(timeout)
    return []
  }
}

export async function generateQuizField(body) {
  const res = await fetch(`${API_BASE}/api/quiz/generate-field`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`)
  return data
}

export async function generateOneQuiz(body) {
  const res = await fetch(`${API_BASE}/api/quiz/generate-one`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`)
  return data
}

/** Generate quizzes from learning resources (sites) for this topic. No admin needed. */
export async function generateFromResources(body) {
  const res = await fetch(`${API_BASE}/api/quiz/generate-from-resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`)
  return data
}
