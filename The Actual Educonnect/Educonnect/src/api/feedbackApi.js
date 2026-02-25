const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function headers(userEmail) {
  const h = { 'Content-Type': 'application/json' }
  if (userEmail) h['X-User-Email'] = userEmail
  return h
}

export async function submitFeedbackApi({ userId, userEmail, userName, type, subject, message, rating, sentiment }) {
  const res = await fetch(`${API_BASE}/api/feedback`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      userId,
      userEmail,
      userName,
      type: type || 'general',
      subject,
      message,
      rating: rating ?? 0,
      sentiment: sentiment || null
    })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to submit feedback')
  return data.feedback
}

export async function getMyFeedbackApi(userEmail) {
  if (!userEmail) return []
  const res = await fetch(`${API_BASE}/api/feedback`, {
    headers: headers(userEmail)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to load feedback')
  return data.feedback || []
}

export async function getAdminFeedbackApi(adminEmail) {
  if (!adminEmail) return []
  const res = await fetch(`${API_BASE}/api/feedback/admin/all`, {
    headers: headers(adminEmail)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to load feedback')
  return data.feedback || []
}

export async function respondToFeedbackApi(feedbackId, adminResponse, adminEmail) {
  if (!adminEmail) throw new Error('Admin email required')
  const res = await fetch(`${API_BASE}/api/feedback/admin/${feedbackId}/respond`, {
    method: 'POST',
    headers: headers(adminEmail),
    body: JSON.stringify({ adminResponse: adminResponse.trim() })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to send response')
  return data.feedback
}
