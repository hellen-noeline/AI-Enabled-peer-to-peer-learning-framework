const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function authHeaders(userId) {
  return userId ? { 'X-User-Id': userId } : {}
}

export async function getUsersApi(userId) {
  const res = await fetch(`${API_BASE}/api/users`, {
    headers: authHeaders(userId)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to fetch users')
  return Array.isArray(data.users) ? data.users : []
}
