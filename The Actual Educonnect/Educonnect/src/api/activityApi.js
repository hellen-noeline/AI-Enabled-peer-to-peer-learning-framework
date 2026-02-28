const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * Log an activity event for the learning model (Phase 2). Fire-and-forget.
 */
export function logActivity(userId, eventType, payload = {}) {
  if (!userId || !eventType) return
  fetch(`${API_BASE}/api/activity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, eventType, payload })
  }).catch(() => {})
}
