/*
This code defines a helper function used to log user activity in the application.
It sends activity events from the frontend to the backend API so the system can
track user interactions.

The function records information such as the user ID, the type of event that
occurred (e.g., quiz completed, resource viewed), and optional additional data
(payload) describing the event. This information is sent to the backend using
a POST request and can be stored for analytics, user behavior tracking, or
training recommendation models.

The request is designed as a "fire-and-forget" operation, meaning that if the
logging fails, it does not interrupt the user experience.
*/
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
