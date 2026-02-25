import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from './AuthContext'

const StudyContext = createContext()

const INACTIVITY_PAUSE_MS = 5 * 60 * 1000 // 5 minutes
const MIN_STUDY_SECONDS = 5 * 60 // Only record progress if 5+ min of actual study (Cisco-style)

export function useStudy() {
  const context = useContext(StudyContext)
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider')
  }
  return context
}

export function StudyProvider({ children }) {
  const { user, recordManualStudySession } = useAuth()
  const [sessionTimer, setSessionTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timerStartTime, setTimerStartTime] = useState(null)
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0)
  const [pausedByInactivity, setPausedByInactivity] = useState(false)

  const lastActivityRef = useRef(Date.now())
  const accumulatedSecondsRef = useRef(0)
  const timerStartTimeRef = useRef(null)
  const isTimerRunningRef = useRef(false)

  // Reset study state when user logs out
  useEffect(() => {
    if (!user) {
      setIsTimerRunning(false)
      setTimerStartTime(null)
      setAccumulatedSeconds(0)
      setSessionTimer(0)
      setPausedByInactivity(false)
    }
  }, [user])

  accumulatedSecondsRef.current = accumulatedSeconds
  timerStartTimeRef.current = timerStartTime
  isTimerRunningRef.current = isTimerRunning

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
    setPausedByInactivity(false)
  }, [])

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach((e) => window.addEventListener(e, updateActivity))
    return () => events.forEach((e) => window.removeEventListener(e, updateActivity))
  }, [updateActivity])

  const startStudySession = useCallback(() => {
    setIsTimerRunning(true)
    setTimerStartTime(Date.now())
    setPausedByInactivity(false)
  }, [])

  useEffect(() => {
    if (!isTimerRunning || !timerStartTime) return
    const check = setInterval(() => {
      const inactiveMs = Date.now() - lastActivityRef.current
      if (inactiveMs >= INACTIVITY_PAUSE_MS) {
        const elapsedThisRun = Math.floor((Date.now() - timerStartTime) / 1000)
        setAccumulatedSeconds((prev) => {
          const newAcc = prev + elapsedThisRun
          setSessionTimer(newAcc)
          return newAcc
        })
        setIsTimerRunning(false)
        setTimerStartTime(null)
        setPausedByInactivity(true)
      }
    }, 30000)
    return () => clearInterval(check)
  }, [isTimerRunning, timerStartTime])

  useEffect(() => {
    let interval = null
    if (isTimerRunning && timerStartTime !== null) {
      interval = setInterval(() => {
        const elapsedThisRun = Math.floor((Date.now() - timerStartTime) / 1000)
        setSessionTimer(accumulatedSeconds + elapsedThisRun)
      }, 1000)
    } else if (!isTimerRunning && accumulatedSeconds > 0) {
      setSessionTimer(accumulatedSeconds)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning, timerStartTime, accumulatedSeconds])

  useEffect(() => {
    return () => {
      let totalSeconds = accumulatedSecondsRef.current
      if (isTimerRunningRef.current && timerStartTimeRef.current) {
        totalSeconds += Math.floor((Date.now() - timerStartTimeRef.current) / 1000)
      }
      if (totalSeconds >= MIN_STUDY_SECONDS) {
        recordManualStudySession(totalSeconds / 3600)
      }
    }
  }, [recordManualStudySession])

  const stopStudySession = useCallback(() => {
    let totalSeconds = accumulatedSecondsRef.current
    if (isTimerRunningRef.current && timerStartTimeRef.current) {
      totalSeconds += Math.floor((Date.now() - timerStartTimeRef.current) / 1000)
    }
    if (totalSeconds >= MIN_STUDY_SECONDS) {
      recordManualStudySession(totalSeconds / 3600)
    }
    setIsTimerRunning(false)
    setTimerStartTime(null)
    setAccumulatedSeconds(0)
    setSessionTimer(0)
    setPausedByInactivity(false)
  }, [recordManualStudySession])

  const value = {
    sessionTimer,
    isTimerRunning,
    accumulatedSeconds,
    pausedByInactivity,
    startStudySession,
    stopStudySession,
    updateActivity,
  }

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>
}
