const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * Fetch study plan (schedule + suggestions) for the current user.
 * Tries GET from server first; falls back to POST with user body so it works for localStorage users too.
 */
export async function fetchStudyPlan(user) {
  if (!user) return { schedule: [], suggestions: [], generatedAt: new Date().toISOString() }
  try {
    const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(user.id)}/study-plan`)
    if (res.ok) return await res.json()
  } catch (_) {}
  try {
    const res = await fetch(`${API_BASE}/api/study-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user })
    })
    if (res.ok) return await res.json()
  } catch (_) {}
  return { schedule: [], suggestions: [], generatedAt: new Date().toISOString() }
}
