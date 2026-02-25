/**
 * Background NLP service – runs topic modelling without user interaction.
 * Collects documents from feedback/chats and calls BERTopic API.
 */

const BERTOPIC_API = 'http://localhost:5000'
const STORAGE_GROUP_CHAT = 'EduConnect_groupChat'
const STORAGE_DM_CHAT = 'EduConnect_dmChat'
const STORAGE_CACHED_TOPICS = 'EduConnect_cachedTopics'
const CACHE_MAX_AGE_MS = 30 * 60 * 1000 // 30 minutes

/** Collect documents from feedback, group chats, and personal chats */
export function collectDocumentsForTopics() {
  const documents = []
  const sources = { feedback: 0, groupChat: 0, dmChat: 0 }

  const allFeedback = JSON.parse(localStorage.getItem('EduConnect_feedback') || '[]')
  allFeedback.forEach((f) => {
    const text = `${f.subject || ''} ${f.message || ''}`.trim()
    if (text.length > 10) {
      documents.push(text)
      sources.feedback++
    }
  })

  const groupChats = JSON.parse(localStorage.getItem(STORAGE_GROUP_CHAT) || '{}')
  Object.values(groupChats).forEach((messages) => {
    (messages || []).forEach((msg) => {
      const text = (msg.text || '').trim()
      if (text.length > 10) {
        documents.push(text)
        sources.groupChat++
      }
    })
  })

  const dmChats = JSON.parse(localStorage.getItem(STORAGE_DM_CHAT) || '{}')
  Object.values(dmChats).forEach((messages) => {
    (messages || []).forEach((msg) => {
      const text = (msg.text || '').trim()
      if (text.length > 10) {
        documents.push(text)
        sources.dmChat++
      }
    })
  })

  return { documents, sources }
}

/** Get cached topics if valid */
export function getCachedTopics() {
  try {
    const cached = JSON.parse(localStorage.getItem(STORAGE_CACHED_TOPICS) || 'null')
    if (!cached?.topics) return null
    const age = Date.now() - (new Date(cached.lastUpdated || 0)).getTime()
    if (age > CACHE_MAX_AGE_MS) return null
    return cached
  } catch {
    return null
  }
}

/** Store topics in cache */
function setCachedTopics(data) {
  try {
    localStorage.setItem(
      STORAGE_CACHED_TOPICS,
      JSON.stringify({
        topics: data.topics || [],
        documentTopics: data.document_topics || [],
        sources: data.sources || {},
        lastUpdated: new Date().toISOString(),
      })
    )
  } catch (e) {
    console.warn('NLP: failed to cache topics', e)
  }
}

/**
 * Run topic modelling in the background. Safe to call often – throttled by cache.
 * @returns {Promise<{ topics: array, sources: object } | null>}
 */
export async function runTopicModellingInBackground() {
  const { documents, sources } = collectDocumentsForTopics()

  if (documents.length < 2) {
    return null
  }

  const cached = getCachedTopics()
  if (cached) {
    return { topics: cached.topics, sources: cached.sources || sources }
  }

  try {
    const res = await fetch(`${BERTOPIC_API}/api/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documents }),
    })
    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Topic modelling failed')
    }

    setCachedTopics({
      topics: data.topics || [],
      document_topics: data.document_topics || [],
      sources,
    })

    return { topics: data.topics || [], sources }
  } catch (err) {
    console.warn('NLP background: backend may be offline', err.message)
    return null
  }
}
