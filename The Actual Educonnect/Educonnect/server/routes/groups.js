import { Router } from 'express'
import { randomUUID } from 'crypto'

const router = Router()

function getCurrentUserId(req) {
  return (req.headers['x-user-id'] || '').trim() || null
}

function rowToUser(row) {
  if (!row) return null
  const studyStats = row.study_stats ? JSON.parse(row.study_stats) : {}
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    university: row.university,
    degreeProgram: row.degree_program || '',
    courseArea: row.course_area || '',
    orderedInterests: row.ordered_interests || '',
    csInterests: row.cs_interests || '',
    technicalSkills: row.technical_skills || '',
    researchInterests: row.research_interests || '',
    preferredLearningStyle: row.preferred_learning_style || '',
    preferredStudyHours: row.preferred_study_hours || ''
  }
}

function parseCommaSeparated(str) {
  if (!str || typeof str !== 'string') return []
  return str.split(',').map(item => item.trim()).filter(item => item.length > 0)
}

function getCourseArea(user) {
  const area = (user?.courseArea || '').trim()
  if (area) return area
  const deg = (user?.degreeProgram || '').toLowerCase()
  if (!deg) return ''
  if (/law|llb|legal/.test(deg)) return 'Law'
  if (/business|bba|commerce|accounting|finance|economics|marketing|hr|hospitality|tourism|logistics/.test(deg)) return 'Business & Management'
  if (/computing|computer|information technology|software|bit|bcs/.test(deg)) return 'Computing & IT'
  if (/education|b\.?ed|teaching/.test(deg)) return 'Education'
  if (/humanities|literature|philosophy|history|arts/.test(deg)) return 'Humanities'
  if (/nursing|health|medical|medicine/.test(deg)) return 'Health'
  if (/agriculture|agri|environmental/.test(deg)) return 'Agriculture'
  return 'Other'
}

function calculateGroupMatch(user1, user2, primaryInterest) {
  let score = 0
  let factors = 0
  const area1 = getCourseArea(user1)
  const area2 = getCourseArea(user2)
  const sameDegree = (user1.degreeProgram && user2.degreeProgram) &&
    (user1.degreeProgram || '').trim().toLowerCase() === (user2.degreeProgram || '').trim().toLowerCase()
  if (sameDegree) score += 0.15
  else if (area1 && area2 && area1 === area2) score += 0.1
  factors += 0.15

  const u1Interests = [...parseCommaSeparated(user1.orderedInterests || ''), ...parseCommaSeparated(user1.csInterests || '')]
  const u2Interests = [...parseCommaSeparated(user2.orderedInterests || ''), ...parseCommaSeparated(user2.csInterests || '')]
  const bothHavePrimary = u1Interests.some(i => i.toLowerCase().trim() === primaryInterest) &&
    u2Interests.some(i => i.toLowerCase().trim() === primaryInterest)
  if (bothHavePrimary) score += 0.225
  const interestOverlap = u1Interests.filter(i => u2Interests.some(i2 => i.toLowerCase().trim() === i2.toLowerCase().trim())).length
  const interestUnion = new Set([...u1Interests.map(i => i.toLowerCase()), ...u2Interests.map(i => i.toLowerCase())]).size
  if (interestUnion > 0) score += (interestOverlap / interestUnion) * 0.225
  factors += 0.45

  const user1Tech = parseCommaSeparated(user1.technicalSkills || '')
  const user2Tech = parseCommaSeparated(user2.technicalSkills || '')
  const techIntersection = user1Tech.filter(t => user2Tech.some(t2 => t.toLowerCase().trim() === t2.toLowerCase().trim())).length
  const techUnion = new Set([...user1Tech, ...user2Tech]).size
  if (techUnion > 0) score += (techIntersection / techUnion) * 0.18
  factors += 0.18

  const user1Research = parseCommaSeparated(user1.researchInterests || '')
  const user2Research = parseCommaSeparated(user2.researchInterests || '')
  const researchIntersection = user1Research.filter(r => user2Research.some(r2 => r.toLowerCase().trim() === r2.toLowerCase().trim())).length
  const researchUnion = new Set([...user1Research, ...user2Research]).size
  if (researchUnion > 0) score += (researchIntersection / researchUnion) * 0.12
  factors += 0.12

  if (user1.preferredLearningStyle && user2.preferredLearningStyle && user1.preferredLearningStyle === user2.preferredLearningStyle) score += 0.05
  factors += 0.05
  if (user1.preferredStudyHours && user2.preferredStudyHours && user1.preferredStudyHours === user2.preferredStudyHours) score += 0.05
  factors += 0.05

  return factors > 0 ? score / factors : 0
}

function getChatRoomId(group) {
  const interest = (group.interest || group.id || '').toString().toLowerCase().trim()
  const sanitized = interest.replace(/\s+/g, '_')
  return `group_${sanitized}`
}

// GET /api/groups – computed study groups for current user
router.get('/', (req, res) => {
  try {
    const userId = getCurrentUserId(req)
    if (!userId) {
      return res.status(401).json({ error: 'X-User-Id header required' })
    }

    const currentUserRow = req.db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(userId, 'user')
    if (!currentUserRow) {
      return res.status(404).json({ error: 'User not found' })
    }

    const currentUser = rowToUser(currentUserRow)
    const userRows = req.db.prepare('SELECT * FROM users WHERE role = ?').all('user')
    const datasetRows = req.db.prepare('SELECT * FROM dataset_students').all()

    const datasetToUser = (r, i) => ({
      id: r.id || `dataset_${i}`,
      firstName: r.first_name,
      lastName: r.last_name,
      university: r.university,
      degreeProgram: r.degree_program || '',
      courseArea: r.course_area || '',
      orderedInterests: r.ordered_interests || '',
      csInterests: r.cs_interests || '',
      technicalSkills: r.technical_skills || '',
      researchInterests: r.research_interests || '',
      preferredLearningStyle: r.preferred_learning_style || '',
      preferredStudyHours: r.preferred_study_hours || ''
    })

    const allUsers = [
      ...userRows.filter(r => r.id !== userId).map(rowToUser),
      ...datasetRows.map((r, i) => datasetToUser(r, i))
    ]

    const ordered = parseCommaSeparated(currentUser.orderedInterests || '')
    const additional = parseCommaSeparated(currentUser.csInterests || '')
    const userInterests = [...ordered, ...additional].filter((v, i, a) => a.indexOf(v) === i)
    const otherUsers = allUsers.filter(u => u.id !== currentUser.id)

    const interestGroups = {}
    userInterests.forEach(interest => {
      const interestKey = interest.toLowerCase().trim()
      if (!interestKey) return
      if (!interestGroups[interestKey]) {
        interestGroups[interestKey] = {
          name: interest,
          interest: interestKey,
          members: [],
          commonInterests: [interest],
          matchScore: 0
        }
      }

      otherUsers.forEach(otherUser => {
        const otherOrdered = parseCommaSeparated(otherUser.orderedInterests || '')
        const otherAdditional = parseCommaSeparated(otherUser.csInterests || '')
        const otherInterests = [...otherOrdered, ...otherAdditional]
        if (otherInterests.some(i => i.toLowerCase().trim() === interestKey)) {
          if (!interestGroups[interestKey].members.find(m => m.id === otherUser.id)) {
            const matchScore = calculateGroupMatch(currentUser, otherUser, interestKey)
            if (matchScore > 0.3) {
              interestGroups[interestKey].members.push({
                ...otherUser,
                matchScore: Math.round(matchScore * 100)
              })
            }
          }
        }
      })

      interestGroups[interestKey].members.sort((a, b) => b.matchScore - a.matchScore)
      interestGroups[interestKey].members = interestGroups[interestKey].members.slice(0, 8)
      if (interestGroups[interestKey].members.length > 0) {
        const avgScore = interestGroups[interestKey].members.reduce((sum, m) => sum + m.matchScore, 0) / interestGroups[interestKey].members.length
        interestGroups[interestKey].matchScore = Math.round(avgScore)
      }
    })

    const groupsArray = Object.values(interestGroups)
      .filter(group => group.members.length >= 2)
      .map(group => {
        const programmeSet = new Set()
        group.members.forEach(m => {
          if (m.degreeProgram) programmeSet.add(m.degreeProgram)
        })
        if (currentUser.degreeProgram) programmeSet.add(currentUser.degreeProgram)
        const chatRoomId = getChatRoomId(group)
        return {
          ...group,
          totalMembers: group.members.length + 1,
          programmes: Array.from(programmeSet),
          id: chatRoomId,
          chatRoomId
        }
      })
      .sort((a, b) => b.matchScore - a.matchScore)

    res.json({ groups: groupsArray })
  } catch (err) {
    console.error('Groups error:', err)
    res.status(500).json({ error: err.message || 'Failed to fetch groups' })
  }
})

// POST /api/groups/:id/join – join a group (creates group if needed)
router.post('/:id/join', (req, res) => {
  try {
    const userId = getCurrentUserId(req)
    if (!userId) {
      return res.status(401).json({ error: 'X-User-Id header required' })
    }

    const groupId = req.params.id
    if (!groupId || !groupId.startsWith('group_')) {
      return res.status(400).json({ error: 'Invalid group id' })
    }

    const interest = groupId.replace('group_', '').replace(/_/g, ' ')
    const name = interest.charAt(0).toUpperCase() + interest.slice(1)

    req.db.transaction(() => {
      const existing = req.db.prepare('SELECT id FROM study_groups WHERE id = ?').get(groupId)
      if (!existing) {
        req.db.prepare('INSERT INTO study_groups (id, name, interest) VALUES (?, ?, ?)').run(groupId, `${name} Study Group`, groupId)
      }
      const alreadyMember = req.db.prepare('SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?').get(groupId, userId)
      if (!alreadyMember) {
        req.db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)').run(groupId, userId)
      }
    })

    res.json({ joined: true })
  } catch (err) {
    console.error('Join group error:', err)
    res.status(500).json({ error: err.message || 'Failed to join group' })
  }
})

// GET /api/groups/:id/messages
router.get('/:id/messages', (req, res) => {
  try {
    const userId = getCurrentUserId(req)
    if (!userId) {
      return res.status(401).json({ error: 'X-User-Id header required' })
    }

    const groupId = req.params.id
    const rows = req.db.prepare('SELECT id, group_id, user_id, user_name, text, created_at FROM group_messages WHERE group_id = ? ORDER BY created_at ASC').all(groupId)
    const messages = rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      text: r.text,
      createdAt: r.created_at
    }))
    res.json({ messages })
  } catch (err) {
    console.error('Group messages error:', err)
    res.status(500).json({ error: err.message || 'Failed to fetch messages' })
  }
})

// POST /api/groups/:id/messages
router.post('/:id/messages', (req, res) => {
  try {
    const userId = getCurrentUserId(req)
    if (!userId) {
      return res.status(401).json({ error: 'X-User-Id header required' })
    }

    const groupId = req.params.id
    const { text } = req.body || {}
    const userName = (req.headers['x-user-name'] || '').trim() || 'Unknown'

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Message text required' })
    }

    const id = randomUUID()
    req.db.prepare('INSERT INTO group_messages (id, group_id, user_id, user_name, text) VALUES (?, ?, ?, ?, ?)').run(id, groupId, userId, userName, text.trim())

    const msg = req.db.prepare('SELECT id, group_id, user_id, user_name, text, created_at FROM group_messages WHERE id = ?').get(id)
    res.status(201).json({
      message: {
        id: msg.id,
        userId: msg.user_id,
        userName: msg.user_name,
        text: msg.text,
        createdAt: msg.created_at
      }
    })
  } catch (err) {
    console.error('Send group message error:', err)
    res.status(500).json({ error: err.message || 'Failed to send message' })
  }
})

export default router
