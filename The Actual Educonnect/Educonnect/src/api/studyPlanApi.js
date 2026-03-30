const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function emptyPlan() {
  return { schedule: [], suggestions: [], generatedAt: new Date().toISOString() }
}

function isPlanEmpty(data) {
  if (!data || typeof data !== 'object') return true
  const s = data.schedule
  const g = data.suggestions
  const hasSchedule = Array.isArray(s) && s.length > 0
  const hasSuggestions = Array.isArray(g) && g.length > 0
  return !hasSchedule && !hasSuggestions
}

/**
 * Fetch study plan (schedule + suggestions) for the current user.
 * Tries GET from server first; falls back to POST with user body when GET 404s, fails, or returns an empty plan
 * (e.g. stale client id vs database — POST uses the full session user and still generates a week schedule).
 */
export async function fetchStudyPlan(user) {
  if (!user) return emptyPlan()
  try {
    const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(user.id)}/study-plan`)
    if (res.ok) {
      const data = await res.json()
      if (!isPlanEmpty(data)) return data
    }
  } catch (_) {}
  try {
    const res = await fetch(`${API_BASE}/api/study-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user })
    })
    if (res.ok) {
      const data = await res.json()
      if (!isPlanEmpty(data)) return data
    }
  } catch (_) {}
  return emptyPlan()
}
