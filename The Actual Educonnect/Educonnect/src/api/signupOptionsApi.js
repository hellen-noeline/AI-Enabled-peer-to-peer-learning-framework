const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export async function fetchSignupOptions() {
  const res = await fetch(`${API_BASE}/api/signup-options`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to load signup options')
  }
  return res.json()
}

export async function submitSignupSuggestion(field, value) {
  const res = await fetch(`${API_BASE}/api/signup-suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field, value: (value || '').trim() })
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to save suggestion')
  }
  return res.json()
}
