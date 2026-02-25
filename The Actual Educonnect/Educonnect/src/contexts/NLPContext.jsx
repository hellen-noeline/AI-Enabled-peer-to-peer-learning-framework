import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getCachedTopics, runTopicModellingInBackground } from '../utils/nlpBackgroundService'

const NLPContext = createContext()

export function useNLP() {
  const context = useContext(NLPContext)
  if (!context) {
    throw new Error('useNLP must be used within an NLPProvider')
  }
  return context
}

export function NLPProvider({ children }) {
  const { user } = useAuth()
  const [topics, setTopics] = useState([])
  const [sources, setSources] = useState(null)
  const [loading, setLoading] = useState(false)

  const refreshTopics = useCallback(async () => {
    if (!user) return
    const cached = getCachedTopics()
    if (cached?.topics?.length) {
      setTopics(cached.topics)
      setSources(cached.sources || {})
    }
    setLoading(true)
    const result = await runTopicModellingInBackground()
    setLoading(false)
    if (result) {
      setTopics(result.topics)
      setSources(result.sources || {})
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    refreshTopics()
  }, [user, refreshTopics])

  const value = {
    topics,
    sources,
    loading,
    refreshTopics,
  }

  return <NLPContext.Provider value={value}>{children}</NLPContext.Provider>
}
