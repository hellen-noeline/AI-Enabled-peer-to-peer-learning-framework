import React, { createContext, useContext, useState, useEffect } from 'react'
import { signupApi, loginApi, updateUserApi } from '../api/authApi'

const AuthContext = createContext()

// Emails that receive admin role when signing up or logging in.
// To create an admin: sign up with admin@educonnect.com (or add your email here)
const ADMIN_EMAILS = ['admin@educonnect.com']

function isAdminEmail(email) {
  if (!email) return false
  return ADMIN_EMAILS.some(e => e.toLowerCase().trim() === String(email).toLowerCase().trim())
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load user from localStorage on mount - restore session so returning users stay logged in
    const storedUser = localStorage.getItem('EduConnect_user')
    if (storedUser) {
      let parsedUser = JSON.parse(storedUser)
      // Sync with users list to get latest profile/stats (in case of updates)
      const users = JSON.parse(localStorage.getItem('EduConnect_users') || '[]')
      const latestUser = users.find(u => u.id === parsedUser?.id)
      if (latestUser) {
        parsedUser = latestUser
        if (!parsedUser.role) {
          parsedUser = { ...parsedUser, role: isAdminEmail(parsedUser.email) ? 'admin' : 'user' }
          const idx = users.findIndex(u => u.id === parsedUser.id)
          if (idx >= 0) {
            users[idx] = parsedUser
            localStorage.setItem('EduConnect_users', JSON.stringify(users))
          }
          localStorage.setItem('EduConnect_user', JSON.stringify(parsedUser))
        }
      }
      setUser(parsedUser)
      if (parsedUser) {
        initializeSessionTracking(parsedUser)
      }
    }
    setLoading(false)
  }, [])

  // Only active study intervals (Dashboard timer: Start → Stop, with 5min inactivity pause)
  // are logged via recordManualStudySession. No automatic time logging for credible analytics.

  const initializeSessionTracking = (userData) => {
    const now = new Date()
    let updatedUser = resetWeeklyHoursIfNewWeek(userData)
    if (updatedUser !== userData) {
      updateUserInStorage(updatedUser)
      userData = updatedUser
    }
    const lastLogin = userData.lastLoginTime ? new Date(userData.lastLoginTime) : null
    if (!lastLogin || !isSameDay(now, lastLogin)) {
      updateLastLoginOnly(userData)
    }
  }

  const isSameDay = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  const getDayOfWeek = (date) => {
    // Returns 0-6 (Sunday-Saturday), but we want Monday=0, Sunday=6
    const day = date.getDay()
    return day === 0 ? 6 : day - 1
  }

  const getWeekStart = (date) => {
    // Get Monday of the current week
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    return new Date(d.setDate(diff))
  }

  const isSameWeek = (date1, date2) => {
    const week1 = getWeekStart(date1)
    const week2 = getWeekStart(date2)
    return week1.getTime() === week2.getTime()
  }

  const resetWeeklyHoursIfNewWeek = (userData) => {
    const now = new Date()
    const lastWeekReset = userData.lastWeekReset ? new Date(userData.lastWeekReset) : null
    
    if (!lastWeekReset || !isSameWeek(now, lastWeekReset)) {
      // New week - reset weekly hours
      return {
        ...userData,
        lastWeekReset: now.toISOString(),
        studyStats: {
          ...userData.studyStats,
          weeklyHours: [0, 0, 0, 0, 0, 0, 0]
        }
      }
    }
    return userData
  }

  // Update last login only; do not touch studyStats (analytics = active study intervals only).
  const updateLastLoginOnly = (userData) => {
    const updatedUser = {
      ...userData,
      lastLoginTime: new Date().toISOString()
    }
    updateUserInStorage(updatedUser)
    setUser(updatedUser)
  }

  const updateUserInStorage = (updatedUser) => {
    localStorage.setItem('EduConnect_user', JSON.stringify(updatedUser))
    
    // Update in users list
    const users = JSON.parse(localStorage.getItem('EduConnect_users') || '[]')
    const userIndex = users.findIndex(u => u.id === updatedUser.id)
    if (userIndex !== -1) {
      users[userIndex] = updatedUser
      localStorage.setItem('EduConnect_users', JSON.stringify(users))
    }
    // Sync studyStats to backend for admin quiz assessments
    if (updatedUser?.studyStats && updatedUser?.id) {
      updateUserApi(updatedUser.id, { studyStats: updatedUser.studyStats })
    }
  }

  const signup = async (userData) => {
    try {
      const newUser = await signupApi(userData)
      syncUserToLocalStorage(newUser)
      setUser(newUser)
      setShowWelcome(true)
      return newUser
    } catch (err) {
      throw err
    }
  }

  const syncUserToLocalStorage = (u) => {
    const users = JSON.parse(localStorage.getItem('EduConnect_users') || '[]')
    const idx = users.findIndex(x => x.id === u.id)
    if (idx >= 0) users[idx] = u
    else users.push(u)
    localStorage.setItem('EduConnect_users', JSON.stringify(users))
    localStorage.setItem('EduConnect_user', JSON.stringify(u))
  }

  const login = async (email, password) => {
    try {
      const userToSet = await loginApi(email, password)
      if (!userToSet) return null
      const role = userToSet.role || (isAdminEmail(userToSet.email) ? 'admin' : 'user')
      const userWithRole = { ...userToSet, role }
      const afterReset = resetWeeklyHoursIfNewWeek(userWithRole)
      if (afterReset !== userWithRole) {
        updateUserInStorage(afterReset)
      }
      syncUserToLocalStorage(afterReset)
      setUser(afterReset)
      setShowWelcome(true)
      return afterReset
    } catch (err) {
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem('EduConnect_user')
    setUser(null)
    setShowWelcome(false)
  }

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData }
    updateUserInStorage(updatedUser)
    setUser(updatedUser)
  }

  const updateStudyStats = (stats) => {
    updateUser({
      studyStats: {
        ...user.studyStats,
        ...stats
      }
    })
  }

  // Record field quiz/final – scores, proficiency from final test.
  const recordFieldProgress = (fieldId, quizId, score, isFinal) => {
    if (!user) return

    const currentStats = user.studyStats || {
      totalHours: 0,
      weeklyHours: [0, 0, 0, 0, 0, 0, 0],
      sessionsCompleted: 0,
      studyProgress: 0,
      quizCompletions: {},
      quizzesPassed: 0,
      fieldProgress: {}
    }

    const fieldProgress = { ...(currentStats.fieldProgress || {}) }
    if (!fieldProgress[fieldId]) {
      fieldProgress[fieldId] = { quizScores: {}, finalScore: null, proficiency: null }
    }
    fieldProgress[fieldId] = { ...fieldProgress[fieldId] }

    const scorePercent = Math.round(score * 100)
    const passed = score >= 0.7
    const wasPassedBefore = isFinal
      ? !!fieldProgress[fieldId].proficiency
      : (fieldProgress[fieldId].quizScores?.[quizId] || 0) >= 70

    if (isFinal) {
      fieldProgress[fieldId].finalScore = scorePercent
      fieldProgress[fieldId].proficiency = scorePercent >= 90 ? 'Expert' : scorePercent >= 70 ? 'Advanced' : scorePercent >= 50 ? 'Intermediate' : 'Beginner'
    } else {
      fieldProgress[fieldId].quizScores = { ...fieldProgress[fieldId].quizScores, [quizId]: scorePercent }
    }

    const now = new Date()
    const dayOfWeek = getDayOfWeek(now)
    const updatedWeeklyHours = [...(currentStats.weeklyHours || [0, 0, 0, 0, 0, 0, 0])]
    let totalHours = currentStats.totalHours || 0
    let sessionsCompleted = currentStats.sessionsCompleted || 0

    if (passed && !wasPassedBefore) {
      const creditHours = 0.25
      updatedWeeklyHours[dayOfWeek] = (updatedWeeklyHours[dayOfWeek] || 0) + creditHours
      totalHours += creditHours
      sessionsCompleted += 1
    }

    const weeklyTotal = updatedWeeklyHours.reduce((a, b) => a + b, 0)
    const weeklyGoal = 20
    const studyProgress = Math.min(Math.round((weeklyTotal / weeklyGoal) * 100), 100)

    updateUser({
      studyStats: {
        ...currentStats,
        totalHours: parseFloat(totalHours.toFixed(2)),
        weeklyHours: updatedWeeklyHours.map(h => parseFloat(h.toFixed(2))),
        sessionsCompleted,
        studyProgress,
        fieldProgress
      }
    })
  }

  // Record quiz completion – verifiable study progress (legacy resource-based).
  const recordQuizCompletion = (resourceId, score, passed) => {
    if (!user) return

    const currentStats = user.studyStats || {
      totalHours: 0,
      weeklyHours: [0, 0, 0, 0, 0, 0, 0],
      sessionsCompleted: 0,
      studyProgress: 0,
      quizCompletions: {},
      quizzesPassed: 0
    }

    const quizCompletions = { ...currentStats.quizCompletions }
    const wasPassedBefore = quizCompletions[resourceId]?.passed
    quizCompletions[resourceId] = { score, passed, completedAt: new Date().toISOString() }
    const quizzesPassed = Object.values(quizCompletions).filter(q => q.passed).length

    // Passing a quiz (first time only) grants 0.25h verified study credit
    const now = new Date()
    const dayOfWeek = getDayOfWeek(now)
    const updatedWeeklyHours = [...(currentStats.weeklyHours || [0, 0, 0, 0, 0, 0, 0])]
    let totalHours = currentStats.totalHours || 0
    let sessionsCompleted = currentStats.sessionsCompleted || 0
    if (passed && !wasPassedBefore) {
      const creditHours = 0.25
      updatedWeeklyHours[dayOfWeek] = (updatedWeeklyHours[dayOfWeek] || 0) + creditHours
      totalHours += creditHours
      sessionsCompleted += 1
    }
    const weeklyTotal = updatedWeeklyHours.reduce((a, b) => a + b, 0)
    const weeklyGoal = 20
    const studyProgress = Math.min(Math.round((weeklyTotal / weeklyGoal) * 100), 100)

    updateUser({
      studyStats: {
        ...currentStats,
        totalHours: parseFloat(totalHours.toFixed(2)),
        weeklyHours: updatedWeeklyHours.map(h => parseFloat(h.toFixed(2))),
        sessionsCompleted,
        studyProgress,
        quizCompletions,
        quizzesPassed
      }
    })
  }

  // Single source for study analytics: only active intervals (Start Studying → Stop, with 5min inactivity pause).
  const recordManualStudySession = (hours) => {
    if (!user) return

    const currentStats = user.studyStats || {
      totalHours: 0,
      weeklyHours: [0, 0, 0, 0, 0, 0, 0],
      sessionsCompleted: 0,
      studyProgress: 0,
      quizCompletions: {},
      quizzesPassed: 0
    }

    const now = new Date()
    const dayOfWeek = getDayOfWeek(now)
    
    const updatedWeeklyHours = [...currentStats.weeklyHours]
    updatedWeeklyHours[dayOfWeek] = (updatedWeeklyHours[dayOfWeek] || 0) + hours

    const totalHours = currentStats.totalHours + hours
    const weeklyTotal = updatedWeeklyHours.reduce((a, b) => a + b, 0)
    const weeklyGoal = 20
    const studyProgress = Math.min(Math.round((weeklyTotal / weeklyGoal) * 100), 100)

    updateUser({
      studyStats: {
        ...currentStats,
        totalHours: parseFloat(totalHours.toFixed(2)),
        weeklyHours: updatedWeeklyHours.map(h => parseFloat(h.toFixed(2))),
        sessionsCompleted: (currentStats.sessionsCompleted || 0) + 1,
        studyProgress: studyProgress
      }
    })
  }

  const value = {
    user,
    isAdmin: user?.role === 'admin',
    isAdminEmail,
    signup,
    login,
    logout,
    updateUser,
    updateStudyStats,
    recordManualStudySession,
    recordQuizCompletion,
    recordFieldProgress,
    showWelcome,
    setShowWelcome,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

