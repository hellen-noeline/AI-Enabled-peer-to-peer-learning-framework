/**
 * Hybrid Study Partner Recommendation System
 *
 * Features:
 * - Safe input validation
 * - Content similarity
 * - Availability compatibility
 * - Engagement / reliability scoring
 * - Ranked-interest bonus
 * - Match explanations
 * - Fair handling of missing optional fields
 *
 * Returns users enriched with:
 * - matchScore (0–100)
 * - scoreBreakdown
 * - reasons
 */

/** Dedupe merged dataset + API lists: same email can appear twice (dataset_* id vs real UUID). Prefer non-dataset users. */
function dedupeUsersForMatching(users) {
  if (!Array.isArray(users)) return []
  const byId = new Map()
  for (const u of users) {
    if (!u || typeof u !== 'object' || u.id == null) continue
    const id = String(u.id)
    if (!byId.has(id)) byId.set(id, u)
  }
  const uniqueById = [...byId.values()]

  const emailGroups = new Map()
  for (const u of uniqueById) {
    const email = (u.email || '').trim().toLowerCase()
    const key = email || `__id:${String(u.id)}`
    if (!emailGroups.has(key)) emailGroups.set(key, [])
    emailGroups.get(key).push(u)
  }

  const out = []
  for (const group of emailGroups.values()) {
    if (group.length === 1) {
      out.push(group[0])
      continue
    }
    const best = group.reduce((a, b) => {
      const aDs = String(a.id).startsWith('dataset_')
      const bDs = String(b.id).startsWith('dataset_')
      if (aDs && !bDs) return b
      if (!aDs && bDs) return a
      return a
    })
    out.push(best)
  }
  return out
}

export function getRecommendations(currentUser, allUsers, limit = null) {
  // Guard against missing or invalid input
  if (!currentUser || typeof currentUser !== 'object' || !Array.isArray(allUsers)) {
    return []
  }

  const mergedUnique = dedupeUsersForMatching(allUsers)

  const otherUsers = mergedUnique.filter(
    user =>
      user &&
      typeof user === 'object' &&
      user.id != null &&
      currentUser.id != null &&
      user.id !== currentUser.id
  )

  const scoredUsers = otherUsers.map(user => {
    const content = calculateContentSimilarity(currentUser, user)
    const availability = calculateAvailabilityCompatibility(currentUser, user)
    const engagement = calculateEngagementScore(user)
    const rankedBonus = calculateRankedInterestBonus(currentUser, user)

    // Only include components that could actually be computed
    const components = [
      { key: 'contentScore', value: content, weight: 0.6 },
      { key: 'availabilityScore', value: availability, weight: 0.25 },
      { key: 'engagementScore', value: engagement, weight: 0.15 }
    ].filter(component => component.value !== null)

    const totalWeight = components.reduce((sum, component) => sum + component.weight, 0)

    const finalScore =
      totalWeight > 0
        ? components.reduce((sum, component) => sum + component.value * component.weight, 0) / totalWeight
        : 0

    const scoreBreakdown = {}
    for (const component of components) {
      scoreBreakdown[component.key] = Math.round(component.value * 100)
    }

    return {
      ...user,
      matchScore: Math.round(finalScore * 100),
      scoreBreakdown,
      reasons: generateMatchReasons(currentUser, user, { rankedBonus })
    }
  })

  scoredUsers.sort((a, b) => b.matchScore - a.matchScore)

  // limit: number (including 0) => slice; null/undefined => return all
  return typeof limit === 'number' && limit >= 0
    ? scoredUsers.slice(0, limit)
    : scoredUsers
}

/**
 * Backward-compatible similarity function.
 * Returns only content-based similarity (0–1).
 */
export function calculateSimilarity(user1, user2) {
  const result = calculateContentSimilarity(user1, user2)
  return result === null ? 0 : result
}

function calculateContentSimilarity(user1, user2) {
  if (!user1 || !user2 || typeof user1 !== 'object' || typeof user2 !== 'object') {
    return null
  }

  let score = 0
  let maxScore = 0

  const compareList = (list1, list2, weight) => {
    if (list1.length > 0 || list2.length > 0) {
      score += calculateJaccardSimilarity(list1, list2) * weight
      maxScore += weight
    }
  }

  const compareExact = (value1, value2, weight) => {
    const normalized1 = normalizeText(value1)
    const normalized2 = normalizeText(value2)

    if (normalized1 && normalized2) {
      if (normalized1 === normalized2) {
        score += weight
      }
      maxScore += weight
    }
  }

  const interests1 = unique([
    ...parseCommaSeparated(user1.orderedInterests),
    ...parseCommaSeparated(user1.csInterests)
  ])

  const interests2 = unique([
    ...parseCommaSeparated(user2.orderedInterests),
    ...parseCommaSeparated(user2.csInterests)
  ])

  // Interests split into:
  // - General shared interests: 40%
  // - Ranked-interest bonus: 10%
  
  compareList(interests1, interests2, 0.4)

  const rankedBonus = calculateRankedInterestBonus(user1, user2)
  if (rankedBonus !== null) {
    score += rankedBonus * 0.1
    maxScore += 0.1
  }

  compareList(parseCommaSeparated(user1.technicalSkills), parseCommaSeparated(user2.technicalSkills), 0.12)
  compareList(parseCommaSeparated(user1.softSkills), parseCommaSeparated(user2.softSkills), 0.08)
  compareList(parseCommaSeparated(user1.researchInterests), parseCommaSeparated(user2.researchInterests), 0.08)
  compareList(parseCommaSeparated(user1.professionalInterests), parseCommaSeparated(user2.professionalInterests), 0.08)
  compareList(parseCommaSeparated(user1.hobbies), parseCommaSeparated(user2.hobbies), 0.05)

  compareExact(user1.courseArea, user2.courseArea, 0.22)
  compareExact(user1.degreeProgram, user2.degreeProgram, 0.12)

  compareExact(user1.preferredLearningStyle, user2.preferredLearningStyle, 0.05)
  compareExact(user1.studyPartnersPreferences, user2.studyPartnersPreferences, 0.03)
  if (user1.academicLevel != null || user2.academicLevel != null) {
    compareExact(user1.academicLevel, user2.academicLevel, 0.04)
  }

  return maxScore > 0 ? score / maxScore : null
}

function calculateRankedInterestBonus(user1, user2) {
  const ranked1 = parseCommaSeparated(user1?.orderedInterests)
  const ranked2 = parseCommaSeparated(user2?.orderedInterests)

  if (ranked1.length === 0 || ranked2.length === 0) {
    return null
  }

  // Top 3 ranked interests matter most
  const weights = [3, 2, 1]
  const maxRankWeight = weights.reduce((sum, weight) => sum + weight, 0)

  let bonus = 0

  for (let i = 0; i < Math.min(3, ranked1.length); i++) {
    const interest = ranked1[i]
    const matchIndex = ranked2.indexOf(interest)

    if (matchIndex === 0) {
      bonus += weights[i]
    } else if (matchIndex === 1) {
      bonus += weights[i] * 0.75
    } else if (matchIndex === 2) {
      bonus += weights[i] * 0.5
    }
  }

  return bonus / maxRankWeight
}

function calculateAvailabilityCompatibility(user1, user2) {
  if (!user1 || !user2 || typeof user1 !== 'object' || typeof user2 !== 'object') {
    return null
  }

  let score = 0
  let maxScore = 0

  const hours1 = normalizeText(user1.preferredStudyHours)
  const hours2 = normalizeText(user2.preferredStudyHours)

  if (hours1 && hours2) {
    maxScore += 0.5

    if (hours1 === hours2) {
      score += 0.5
    } else if (areStudyHoursClose(hours1, hours2)) {
      score += 0.25
    }
  }

  const days1 = parseCommaSeparated(user1.availableDays)
  const days2 = parseCommaSeparated(user2.availableDays)

  if (days1.length > 0 || days2.length > 0) {
    score += calculateJaccardSimilarity(days1, days2) * 0.5
    maxScore += 0.5
  }

  return maxScore > 0 ? score / maxScore : null
}

function calculateEngagementScore(user) {
  if (!user || typeof user !== 'object') {
    return null
  }

  let score = 0
  let maxScore = 0

  if (typeof user.attendanceRate === 'number') {
    score += clamp(user.attendanceRate, 0, 1) * 0.4
    maxScore += 0.4
  }

  if (typeof user.responseRate === 'number') {
    score += clamp(user.responseRate, 0, 1) * 0.25
    maxScore += 0.25
  }

  if (typeof user.averageRating === 'number') {
    score += (clamp(user.averageRating, 0, 5) / 5) * 0.2
    maxScore += 0.2
  }

  if (typeof user.isActive === 'boolean') {
    score += user.isActive ? 0.15 : 0
    maxScore += 0.15
  }

  return maxScore > 0 ? score / maxScore : null
}

function generateMatchReasons(user1, user2, opts = {}) {
  const reasons = []
  const rankedBonus = opts.rankedBonus ?? calculateRankedInterestBonus(user1, user2)

  const sharedInterests = getSharedItems(
    [...parseCommaSeparated(user1?.orderedInterests), ...parseCommaSeparated(user1?.csInterests)],
    [...parseCommaSeparated(user2?.orderedInterests), ...parseCommaSeparated(user2?.csInterests)]
  )

  const sharedTechnicalSkills = getSharedItems(
    parseCommaSeparated(user1?.technicalSkills),
    parseCommaSeparated(user2?.technicalSkills)
  )

  const sharedSoftSkills = getSharedItems(
    parseCommaSeparated(user1?.softSkills),
    parseCommaSeparated(user2?.softSkills)
  )

  const sharedDays = getSharedItems(
    parseCommaSeparated(user1?.availableDays),
    parseCommaSeparated(user2?.availableDays)
  )

  if (rankedBonus !== null && rankedBonus >= 0.5) {
    reasons.push('Your top-ranked interests align well')
  }

  if (sharedInterests.length > 0) {
    reasons.push(`You share interests in ${sharedInterests.slice(0, 3).join(', ')}`)
  }

  if (sharedTechnicalSkills.length > 0) {
    reasons.push(`You both have technical skills in ${sharedTechnicalSkills.slice(0, 3).join(', ')}`)
  }

  if (sharedSoftSkills.length > 0) {
    reasons.push(`You both show strengths in ${sharedSoftSkills.slice(0, 2).join(', ')}`)
  }

  if (
    normalizeText(user1?.preferredLearningStyle) &&
    normalizeText(user1?.preferredLearningStyle) === normalizeText(user2?.preferredLearningStyle)
  ) {
    reasons.push(`You both prefer a ${user1.preferredLearningStyle} learning style`)
  }

  if (
    normalizeText(user1?.preferredStudyHours) &&
    normalizeText(user1?.preferredStudyHours) === normalizeText(user2?.preferredStudyHours)
  ) {
    reasons.push(`You are both available during ${user1.preferredStudyHours}`)
  } else if (
    normalizeText(user1?.preferredStudyHours) &&
    normalizeText(user2?.preferredStudyHours) &&
    areStudyHoursClose(normalizeText(user1.preferredStudyHours), normalizeText(user2.preferredStudyHours))
  ) {
    reasons.push('Your preferred study hours are close enough to be compatible')
  }

  if (sharedDays.length > 0) {
    reasons.push(`Your study days overlap on ${sharedDays.slice(0, 3).join(', ')}`)
  }

  if (typeof user2?.averageRating === 'number' && user2.averageRating >= 4) {
    reasons.push('This user has strong peer feedback')
  }

  if (typeof user2?.attendanceRate === 'number' && user2.attendanceRate >= 0.8) {
    reasons.push('This user has a high attendance rate')
  }

  // Fallback reason if nothing specific was found
  if (reasons.length === 0) {
    reasons.push('Based on your profile and preferences')
  }

  // Keep explanations manageable
  return reasons.slice(0, 5)
}

function parseCommaSeparated(value) {
  if (!value || typeof value !== 'string') {
    return []
  }

  return unique(
    value
      .split(',')
      .map(item => normalizeText(item))
      .filter(item => item && item !== 'none')
  )
}

function calculateJaccardSimilarity(arr1, arr2) {
  const set1 = new Set(arr1)
  const set2 = new Set(arr2)

  if (set1.size === 0 && set2.size === 0) return 1
  if (set1.size === 0 || set2.size === 0) return 0

  const intersectionSize = [...set1].filter(item => set2.has(item)).length
  const unionSize = new Set([...set1, ...set2]).size

  return intersectionSize / unionSize
}

function getSharedItems(arr1, arr2) {
  const set2 = new Set(arr2)
  return [...new Set(arr1.filter(item => set2.has(item)))]
}

function areStudyHoursClose(hours1, hours2) {
  // Symmetric matching: order does not matter
  const closePairs = [
    ['morning', 'early morning'],
    ['morning', 'afternoon'],
    ['afternoon', 'evening'],
    ['evening', 'night']
  ]

  return closePairs.some(
    ([a, b]) => (hours1 === a && hours2 === b) || (hours1 === b && hours2 === a)
  )
}

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase()
}

function unique(arr) {
  return [...new Set(arr)]
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}
