const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function authHeaders(user) {
  const h = {}
  if (user?.id) h['X-User-Id'] = user.id
  if (user?.firstName !== undefined || user?.lastName !== undefined) {
    h['X-User-Name'] = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'
  }
  return h
}

export async function getDmMessagesApi(otherUserId, userId) {
  const res = await fetch(`${API_BASE}/api/dm/${encodeURIComponent(otherUserId)}/messages`, {
    headers: { 'X-User-Id': userId }
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to fetch messages')
  return Array.isArray(data.messages) ? data.messages : []
}

export async function sendDmMessageApi(otherUserId, user, text) {
  const res = await fetch(`${API_BASE}/api/dm/${encodeURIComponent(otherUserId)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(user) },
    body: JSON.stringify({ text })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to send message')
  return data.message
}
