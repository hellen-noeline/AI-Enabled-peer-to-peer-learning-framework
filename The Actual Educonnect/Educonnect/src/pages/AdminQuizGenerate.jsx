import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLearningFields } from '../contexts/LearningFieldsContext'
import { generateQuizField } from '../api/quizApi'
import AdminNavigation from '../components/AdminNavigation'
import '../styles/AdminDashboard.css'

function AdminQuizGenerate() {
  const { isAdmin } = useAuth()
  const { refreshGenerated } = useLearningFields()
  const navigate = useNavigate()
  const [fieldId, setFieldId] = useState('')
  const [fieldName, setFieldName] = useState('')
  const [description, setDescription] = useState('')
  const [resourceIds, setResourceIds] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  if (!isAdmin) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)
    const id = fieldId.trim().toLowerCase().replace(/\s+/g, '-')
    const name = fieldName.trim()
    if (!id || !name) {
      setError('Field ID and Field name are required.')
      return
    }
    setLoading(true)
    try {
      const body = {
        fieldId: id,
        fieldName: name,
        description: description.trim() || undefined,
        resourceIds: resourceIds.trim() ? resourceIds.split(/[\s,]+/).map((n) => parseInt(n, 10)).filter((n) => !Number.isNaN(n)) : []
      }
      const data = await generateQuizField(body)
      setResult(data)
      await refreshGenerated()
    } catch (err) {
      setError(err.message || 'Generation failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!result) return
    const text = JSON.stringify(result, null, 2)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="admin-dashboard-container">
      <AdminNavigation />
      <div className="admin-dashboard-content">
        <div className="admin-dashboard-header">
          <h1>AI Quiz Generator</h1>
          <p>Generate a full learning field (3 quizzes + final test) using OpenAI. It is saved automatically and will appear on the frontend (Resources, Quiz hub) right away—no manual copy-paste.</p>
        </div>

        <form onSubmit={handleGenerate} style={{ maxWidth: '480px', marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Field ID (e.g. <code>agriculture</code>)</label>
            <input
              type="text"
              value={fieldId}
              onChange={(e) => setFieldId(e.target.value)}
              placeholder="agriculture"
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Field name (e.g. Agriculture)</label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="Agriculture"
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sustainable farming, crop science, agribusiness..."
              rows={2}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Resource IDs (optional, comma-separated)</label>
            <input
              type="text"
              value={resourceIds}
              onChange={(e) => setResourceIds(e.target.value)}
              placeholder="67, 68, 69"
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          {error && <p style={{ color: '#ef4444', marginBottom: '0.5rem' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', cursor: loading ? 'wait' : 'pointer' }}>
            {loading ? 'Generating… (can take 1–2 min)' : 'Generate full field'}
          </button>
        </form>

        {result && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <h2 style={{ margin: 0 }}>Saved and live</h2>
              <span style={{ color: '#10B981', fontSize: '0.9rem' }}>— It’s already on the app (Resources / Quiz).</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>JSON (optional copy)</h3>
              <button type="button" onClick={handleCopy} style={{ padding: '0.25rem 0.75rem' }}>
                {copied ? 'Copied!' : 'Copy JSON'}
              </button>
            </div>
            <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '1rem', borderRadius: '8px', overflow: 'auto', maxHeight: '60vh', fontSize: '12px' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <p style={{ marginTop: '1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
          Requires <code>OPENAI_API_KEY</code> in <code>server/.env</code>. Same key as the chat LLM. Generation uses tokens and may incur cost.
        </p>
      </div>
    </div>
  )
}

export default AdminQuizGenerate
