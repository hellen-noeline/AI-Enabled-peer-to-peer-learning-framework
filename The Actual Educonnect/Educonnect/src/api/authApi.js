const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const SERVER_UNREACHABLE_MSG = `Cannot reach the server at ${import.meta.env.VITE_API_URL || 'http://localhost:5000'}. Sign in and sign up require the backend to be running. In the project's server folder run: npm install then npm start, then try again.`

function isNetworkError(err) {
  if (!err) return false
  const msg = String(err.message || '').toLowerCase()
  const name = String(err.name || '').toLowerCase()
  return (
    msg.includes('failed to fetch') ||
    msg.includes('network error') ||
    msg.includes('load failed') ||
    msg.includes('networkrequestfailed') ||
    msg.includes('connection') ||
    msg.includes('refused') ||
    name === 'typeerror'
  )
}

function wrapNetworkError(err) {
  if (isNetworkError(err)) return new Error(SERVER_UNREACHABLE_MSG)
  return err
}

export async function signupApi(userData) {
  let res
  try {
    res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
  } catch (err) {
    throw wrapNetworkError(err, 'sign up')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Sign up failed')
  }
  return data.user
}

export async function loginApi(email, password) {
  let res
  try {
    res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
  } catch (err) {
    throw wrapNetworkError(err)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Login failed')
  }
  return data.user
}

export async function getAdminUsersApi(adminEmail) {
  const res = await fetch(`${API_BASE}/api/admin/users`, {
    headers: { 'X-User-Email': adminEmail }
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch users')
  }
  return data.users
}

export function updateUserApi(userId, updates) {
  fetch(`${API_BASE}/api/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  }).catch(() => {}) // Fire and forget
}
