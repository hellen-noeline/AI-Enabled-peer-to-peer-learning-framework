/**
 * Study plan engine: generates a weekly schedule and improvement suggestions
 * from user profile + study_stats. Uses only existing data (no ML yet);
 * can be extended to consume activity_events and cohort insights later.
 */

const FIELD_IDS = ['ai', 'ml', 'ds', 'nlp', 'cv', 'cyber', 'web', 'law', 'business']
const FIELD_NAMES = {
  ai: 'Artificial Intelligence',
  ml: 'Machine Learning',
  ds: 'Data Science',
  nlp: 'Natural Language Processing',
  cv: 'Computer Vision',
  cyber: 'Cybersecurity',
  web: 'Web Development',
  law: 'Law',
  business: 'Business & Management'
}
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DEFAULT_HOURS_PER_DAY = 1.5
const TARGET_WEEKLY_HOURS = 10

const COURSE_AREA_TO_FIELDS = {
  'Computing & IT': ['ai', 'ml', 'ds', 'nlp', 'cv', 'cyber', 'web'],
  'Law': ['law'],
  'Business & Management': ['business']
}

function parseList(str) {
  if (!str || typeof str !== 'string') return []
  return str.split(',').map((s) => s.trim()).filter(Boolean)
}

/**
 * Build weekly schedule: assign focus areas to each day based on weak topics,
 * fields with low/no final score, and ordered interests.
 */
function buildSchedule(user, recentActivities = []) {
  const weak = parseList(user.weakTopics || '').map((t) => t.toLowerCase())
  const ordered = parseList(user.orderedInterests || '')
  
  const recentTopics = []
  if (Array.isArray(recentActivities)) {
    for (const act of recentActivities) {
      if (act.eventType === 'resource_viewed' && act.payload) {
        const topic = act.payload.category || act.payload.title
        if (topic) recentTopics.push(topic)
      }
    }
  }
  const uniqueRecent = [...new Set(recentTopics)].slice(0, 3)
  const fp = user.studyStats?.fieldProgress || {}
  const weeklyHours = user.studyStats?.weeklyHours || [0, 0, 0, 0, 0, 0, 0]

  const area = (user.courseArea || '').trim()
  const relevantFields = COURSE_AREA_TO_FIELDS[area] || []

  // Priority list: fields that need work (no final or final < 70%) then weak topics then ordered interests
  const needsWork = []
  FIELD_IDS.forEach((fid) => {
    const p = fp[fid]
    const finalScore = p?.finalScore
    const isRelevantOrStarted = relevantFields.includes(fid) || p != null

    if (isRelevantOrStarted) {
      if (finalScore == null || finalScore < 70) needsWork.push({ id: fid, name: FIELD_NAMES[fid] || fid, score: finalScore })
    }
  })
  const orderedFieldIds = ordered
    .map((o) => {
      const lower = o.toLowerCase()
      const match = FIELD_IDS.find((fid) => FIELD_NAMES[fid]?.toLowerCase() === lower || fid === lower)
      if (match) return match
      if (lower.includes('law')) return 'law'
      if (lower.includes('business') || lower.includes('accounting') || lower.includes('marketing')) return 'business'
      if (lower.includes('machine learning') || lower.includes('ml')) return 'ml'
      if (lower.includes('data science')) return 'ds'
      if (lower.includes('ai') || lower.includes('artificial')) return 'ai'
      return o
    })
    .filter(Boolean)
  const uniqueOrdered = [...new Set(orderedFieldIds)]
  const priorityFields = [...uniqueRecent, ...needsWork.map((f) => f.name), ...uniqueOrdered.map((fid) => FIELD_NAMES[fid] || fid)]
  const deduped = [...new Set(priorityFields)]
  if (deduped.length === 0) deduped.push('Your interests', 'Quizzes & resources')

  const schedule = []
  const hoursPerSlot = Math.max(0.5, Math.min(2, TARGET_WEEKLY_HOURS / 7))
  for (let i = 0; i < 7; i++) {
    const focus = deduped[i % deduped.length]
    const dayHours = weeklyHours[i] || 0
    const suggested = Math.max(0, hoursPerSlot - dayHours)
    schedule.push({
      day: WEEKDAYS[i],
      focus,
      suggestedHours: Math.round(suggested * 2) / 2,
      alreadyLogged: Math.round((dayHours || 0) * 10) / 10,
      reason: suggested > 0 ? (needsWork.length ? 'Prioritise weak / incomplete fields' : 'Stay consistent') : 'You’ve logged time today'
    })
  }
  return schedule
}

/**
 * Build improvement suggestions from fieldProgress, weak topics, and interests.
 */
function buildSuggestions(user, recentActivities = []) {
  const suggestions = []
  const fp = user.studyStats?.fieldProgress || {}
  const weak = parseList(user.weakTopics || '')
  const strong = parseList(user.strongTopics || '')
  
  const recentTopics = []
  if (Array.isArray(recentActivities)) {
    for (const act of recentActivities) {
      if (act.eventType === 'resource_viewed' && act.payload?.category) {
        recentTopics.push(act.payload.category)
      }
    }
  }
  const uniqueRecent = [...new Set(recentTopics)].slice(0, 1)

  if (uniqueRecent.length > 0) {
    suggestions.push({
      type: 'recent_activity',
      message: `You recently explored ${uniqueRecent[0]}. Keep up the momentum!`,
      priority: 1
    })
  }

  const area = (user.courseArea || '').trim()
  const relevantFields = COURSE_AREA_TO_FIELDS[area] || []

  FIELD_IDS.forEach((fid) => {
    const p = fp[fid]
    const name = FIELD_NAMES[fid] || fid
    const finalScore = p?.finalScore
    const proficiency = p?.proficiency

    const isRelevantOrStarted = relevantFields.includes(fid) || p != null
    if (!isRelevantOrStarted) return

    if (finalScore == null) {
      suggestions.push({
        type: 'take_final',
        fieldId: fid,
        fieldName: name,
        message: `You haven’t taken the ${name} final yet. Add it to your plan to track proficiency.`,
        priority: 1
      })
      return
    }
    if (finalScore < 50) {
      suggestions.push({
        type: 'improve',
        fieldId: fid,
        fieldName: name,
        message: `Your ${name} final score is ${finalScore}%. Review resources and retake quizzes to improve.`,
        priority: 1
      })
      return
    }
    if (finalScore < 70) {
      suggestions.push({
        type: 'improve',
        fieldId: fid,
        fieldName: name,
        message: `Your ${name} score is ${finalScore}%. A bit more practice (e.g. retake quizzes) could get you to Advanced.`,
        priority: 2
      })
      return
    }
    if (proficiency && (proficiency === 'Advanced' || proficiency === 'Expert')) {
      suggestions.push({
        type: 'on_track',
        fieldId: fid,
        fieldName: name,
        message: `You’re on track in ${name} (${proficiency}). Consider helping peers or exploring the next field.`,
        priority: 3
      })
    }
  })

  if (weak.length > 0) {
    suggestions.push({
      type: 'weak_topics',
      message: `You marked these as weak: ${weak.slice(0, 5).join(', ')}${weak.length > 5 ? '…' : ''}. Allocate extra time this week.`,
      priority: 1
    })
  }

  const totalHours = user.studyStats?.totalHours ?? 0
  const thisWeek = (user.studyStats?.weeklyHours || []).reduce((a, b) => a + b, 0)
  if (thisWeek < 5 && totalHours > 0) {
    suggestions.push({
      type: 'consistency',
      message: 'This week you’ve logged fewer hours than usual. Try to fit in at least one session.',
      priority: 2
    })
  }

  suggestions.sort((a, b) => (a.priority || 3) - (b.priority || 3))
  return suggestions.slice(0, 10)
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/**
 * Add cohort-based suggestions and optionally adjust schedule using cohort insights.
 */
function applyCohortInsights(schedule, suggestions, user, cohortInsights) {
  if (!cohortInsights || !user) return { schedule, suggestions }

  const area = (user.courseArea || 'Other').trim() || 'Other'
  const cohort = cohortInsights.byCourseArea?.[area] || cohortInsights.global
  const global = cohortInsights.global || {}

  if (cohort && cohort.n > 0) {
    if (cohort.peakDays && cohort.peakDays.length > 0) {
      const topDay = cohort.peakDays[0]
      const dayName = DAY_NAMES[topDay]
      suggestions.push({
        type: 'cohort',
        message: `Students in your field often study most on ${dayName}. Consider matching that rhythm.`,
        priority: 2
      })
    }
    if (cohort.avgTotalHours != null && cohort.avgTotalHours > 0) {
      suggestions.push({
        type: 'cohort',
        message: `Peers in ${area} average ${cohort.avgTotalHours}h total study. Keep building your streak.`,
        priority: 3
      })
    }
  }

  if (global.n > 1 && global.avgWeeklyHours && global.peakDays?.length > 0) {
    suggestions.push({
      type: 'cohort',
      message: 'Based on all users, the busiest study days are ' +
        global.peakDays.slice(0, 2).map((d) => DAY_NAMES[d]).join(' and ') + '.',
      priority: 3
    })
  }

  suggestions.sort((a, b) => (a.priority || 3) - (b.priority || 3))
  return { schedule, suggestions: suggestions.slice(0, 12) }
}

/**
 * Add ML-based "next topic" suggestion when available.
 */
function applyMLSuggestion(suggestions, mlNextTopic, user) {
  if (!mlNextTopic?.fieldId || !mlNextTopic?.fieldName) return suggestions

  const area = (user?.courseArea || '').trim()
  const relevantFields = COURSE_AREA_TO_FIELDS[area] || []
  const p = user?.studyStats?.fieldProgress?.[mlNextTopic.fieldId]
  const isRelevantOrStarted = relevantFields.includes(mlNextTopic.fieldId) || p != null

  // If the user has a specific course area, and this ML suggestion is outside of it (and they haven't started it), ignore it.
  if (relevantFields.length > 0 && !isRelevantOrStarted) return suggestions

  suggestions.unshift({
    type: 'ml',
    fieldId: mlNextTopic.fieldId,
    fieldName: mlNextTopic.fieldName,
    message: `Our ML model suggests focusing on ${mlNextTopic.fieldName} next, based on your progress and similar learners.`,
    priority: 1
  })
  return suggestions.slice(0, 12)
}

/**
 * Generate study plan for a user. Uses cohortInsights and optional ML suggestion.
 * @param {Object} user - User object with profile + studyStats
 * @param {Object} [cohortInsights] - Optional: aggregated stats from buildCohortInsights (Phase 2)
 * @param {{ fieldId: string, fieldName: string }} [mlNextTopic] - Optional: ML-predicted next topic from mlInference
 * @returns {{ schedule: Array, suggestions: Array, generatedAt: string }}
 */
export function generateStudyPlan(user, cohortInsights = null, mlNextTopic = null, recentActivities = []) {
  if (!user) return { schedule: [], suggestions: [], generatedAt: new Date().toISOString() }
  let schedule = buildSchedule(user, recentActivities)
  let suggestions = buildSuggestions(user, recentActivities)
  const applied = applyCohortInsights(schedule, suggestions, user, cohortInsights)
  suggestions = applyMLSuggestion(applied.suggestions, mlNextTopic, user)
  return {
    schedule: applied.schedule,
    suggestions,
    generatedAt: new Date().toISOString()
  }
}
