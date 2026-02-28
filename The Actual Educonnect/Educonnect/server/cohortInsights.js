/**
 * Build cohort insights from users (study_stats) and activity_events.
 * Used to personalise study plan with "students like you" stats.
 */

/**
 * @param {object} db - sql.js database (with .prepare().all())
 * @returns {object} cohortInsights: { byCourseArea: { [area]: { avgWeeklyHours, peakDays, quizCountByField, n } }, global: { ... } }
 */
export function buildCohortInsights(db) {
  if (!db) return { byCourseArea: {}, global: {} }

  const byCourseArea = {}
  let globalTotalHours = 0
  let globalUserCount = 0
  const globalWeeklySum = [0, 0, 0, 0, 0, 0, 0]
  const fieldQuizCount = {}

  try {
    const users = db.prepare(
      'SELECT id, course_area, study_stats FROM users WHERE role = ?'
    ).all('user')

    for (const row of users) {
      const area = (row.course_area || 'Other').trim() || 'Other'
      if (!byCourseArea[area]) {
        byCourseArea[area] = {
          n: 0,
          weeklySum: [0, 0, 0, 0, 0, 0, 0],
          totalHoursSum: 0,
          quizByField: {}
        }
      }
      const cohort = byCourseArea[area]
      cohort.n += 1
      globalUserCount += 1

      let stats = null
      try {
        stats = row.study_stats ? JSON.parse(row.study_stats) : null
      } catch (_) {}
      if (stats) {
        const wh = stats.weeklyHours || [0, 0, 0, 0, 0, 0, 0]
        for (let i = 0; i < 7; i++) {
          cohort.weeklySum[i] += wh[i] || 0
          globalWeeklySum[i] += wh[i] || 0
        }
        cohort.totalHoursSum += stats.totalHours || 0
        globalTotalHours += stats.totalHours || 0
        const fp = stats.fieldProgress || {}
        for (const [fid, data] of Object.entries(fp)) {
          cohort.quizByField[fid] = (cohort.quizByField[fid] || 0) + 1
          fieldQuizCount[fid] = (fieldQuizCount[fid] || 0) + 1
        }
      }
    }

    // Averages per cohort
    const result = { byCourseArea: {}, global: {} }
    for (const [area, cohort] of Object.entries(byCourseArea)) {
      const n = cohort.n || 1
      result.byCourseArea[area] = {
        n,
        avgWeeklyHours: cohort.weeklySum.map((s) => Math.round((s / n) * 100) / 100),
        avgTotalHours: Math.round((cohort.totalHoursSum / n) * 100) / 100,
        peakDays: cohort.weeklySum
          .map((s, i) => ({ day: i, sum: s }))
          .sort((a, b) => b.sum - a.sum)
          .slice(0, 3)
          .map((x) => x.day),
        quizByField: cohort.quizByField
      }
    }
    const gN = globalUserCount || 1
    result.global = {
      n: globalUserCount,
      avgWeeklyHours: globalWeeklySum.map((s) => Math.round((s / gN) * 100) / 100),
      avgTotalHours: Math.round((globalTotalHours / gN) * 100) / 100,
      peakDays: globalWeeklySum
        .map((s, i) => ({ day: i, sum: s }))
        .sort((a, b) => b.sum - a.sum)
        .slice(0, 3)
        .map((x) => x.day),
      quizByField: fieldQuizCount
    }

    // Activity events: quiz_completed counts by field (optional)
    try {
      const events = db.prepare(
        "SELECT payload FROM activity_events WHERE event_type = ?"
      ).all('quiz_completed')
      const fieldCount = {}
      for (const row of events) {
        try {
          const p = row.payload ? JSON.parse(row.payload) : {}
          const fid = p.fieldId || p.field_id
          if (fid) fieldCount[fid] = (fieldCount[fid] || 0) + 1
        } catch (_) {}
      }
      result.global.activityQuizByField = fieldCount
    } catch (_) {}

    return result
  } catch (e) {
    console.warn('Cohort insights build failed:', e.message)
    return { byCourseArea: {}, global: {} }
  }
}
