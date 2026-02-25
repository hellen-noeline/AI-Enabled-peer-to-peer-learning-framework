/**
 * Group chat storage (localStorage).
 * Messages are keyed by stable group/chat room ID.
 */

const STORAGE_KEY = 'EduConnect_groupChat'
const JOINED_KEY = 'EduConnect_joinedGroups'

export function getChatRoomId(group) {
  const interest = (group.interest || group.id || '').toString().toLowerCase().trim()
  const sanitized = interest.replace(/\s+/g, '_')
  return `group_${sanitized}`
}

export function joinGroup(chatRoomId, userId) {
  const joined = JSON.parse(localStorage.getItem(JOINED_KEY) || '{}')
  if (!joined[userId]) joined[userId] = []
  if (!joined[userId].includes(chatRoomId)) {
    joined[userId].push(chatRoomId)
    localStorage.setItem(JOINED_KEY, JSON.stringify(joined))
  }
}

export function hasJoinedGroup(userId, chatRoomId) {
  const joined = JSON.parse(localStorage.getItem(JOINED_KEY) || '{}')
  return (joined[userId] || []).includes(chatRoomId)
}

export function getGroupMessages(chatRoomId) {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  return all[chatRoomId] || []
}

export function sendGroupMessage(chatRoomId, { userId, userName, text }) {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  if (!all[chatRoomId]) all[chatRoomId] = []
  const message = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    userId,
    userName,
    text: text.trim(),
    createdAt: new Date().toISOString()
  }
  all[chatRoomId].push(message)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  return message
}

// Personal chat (DM) - 1-on-1 between two users
const DM_STORAGE_KEY = 'EduConnect_dmChat'

export function getDmId(userId1, userId2) {
  const ids = [userId1, userId2].filter(Boolean).sort()
  return ids.length === 2 ? `dm_${ids[0]}_${ids[1]}` : null
}

export function getDmMessages(dmId) {
  const all = JSON.parse(localStorage.getItem(DM_STORAGE_KEY) || '{}')
  return all[dmId] || []
}

export function sendDmMessage(dmId, { userId, userName, text }) {
  const all = JSON.parse(localStorage.getItem(DM_STORAGE_KEY) || '{}')
  if (!all[dmId]) all[dmId] = []
  const message = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    userId,
    userName,
    text: text.trim(),
    createdAt: new Date().toISOString()
  }
  all[dmId].push(message)
  localStorage.setItem(DM_STORAGE_KEY, JSON.stringify(all))
  return message
}
