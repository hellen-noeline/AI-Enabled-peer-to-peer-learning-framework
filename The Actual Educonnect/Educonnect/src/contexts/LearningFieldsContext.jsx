/**
 * Provides learningFields = static (quizData) + AI-generated (from server).
 * Generated fields are saved when you use Admin → Generate Quizzes and appear on the frontend automatically.
 */
import React, { createContext, useContext, useState, useEffect } from 'react'
import { learningFields as staticFields, categoryToField as staticCategoryToField } from '../data/quizData'
import { getGeneratedFields } from '../api/quizApi'

const LearningFieldsContext = createContext(null)

export function useLearningFields() {
  const ctx = useContext(LearningFieldsContext)
  if (!ctx) throw new Error('useLearningFields must be used within LearningFieldsProvider')
  return ctx
}

function buildResourceToField(fields) {
  const out = {}
  fields.forEach((field) => {
    (field.resourceIds || []).forEach((rid) => {
      out[rid] = field
    })
  })
  return out
}

function buildCategoryToField(fields) {
  const out = { ...staticCategoryToField }
  fields.forEach((f) => {
    if (f.id) out[f.id] = f.id
  })
  return out
}

export function LearningFieldsProvider({ children }) {
  const [generated, setGenerated] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getGeneratedFields()
      .then(setGenerated)
      .catch(() => setGenerated([]))
  }, [])

  const generatedIds = new Set((generated || []).map((f) => f.id))
  const staticOnly = (staticFields || []).filter((f) => !generatedIds.has(f.id))
  const learningFields = [...staticOnly, ...(generated || [])]
  const resourceToField = buildResourceToField(learningFields)
  const categoryToField = buildCategoryToField(learningFields)

  const refreshGenerated = () => {
    setLoading(true)
    return getGeneratedFields()
      .then(setGenerated)
      .catch(() => setGenerated([]))
      .finally(() => setLoading(false))
  }

  const value = {
    learningFields,
    resourceToField,
    categoryToField,
    loading,
    refreshGenerated
  }

  return (
    <LearningFieldsContext.Provider value={value}>
      {children}
    </LearningFieldsContext.Provider>
  )
}
