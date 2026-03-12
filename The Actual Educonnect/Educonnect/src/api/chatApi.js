/*
This function sends a user's message to the Atlas chatbot backend API
and returns the chatbot's response.

It performs a POST request to the /api/chat endpoint, sending the user's
message in JSON format. If the request fails, it throws an error with a
descriptive message. If successful, it returns the chatbot's response
as JSON so the frontend can display it in the chat interface.

This function acts as the communication bridge between the frontend
chat interface and the backend chatbot service.
*/
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export async function sendAtlasMessage(message) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Request failed: ${res.status}`)
  }
  return res.json()
}
