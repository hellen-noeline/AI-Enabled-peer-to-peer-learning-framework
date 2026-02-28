/**
 * Recommend learning resources based on topics discussed in group chat.
 * Uses keyword matching to map chat content to resource categories.
 * When user is provided, favors categories from orderedInterests and courseArea.
 */

import { learningResources } from '../data/learningResources'

// Keywords that map to resource categories (case-insensitive)
const KEYWORDS_BY_CATEGORY = {
  ai: ['ai', 'artificial intelligence', 'reinforcement learning', 'rl', 'q-learning', 'search algorithm', 'heuristic', 'a*', 'policy gradient'],
  ml: ['machine learning', 'ml', 'neural network', 'tensorflow', 'pytorch', 'keras', 'supervised', 'unsupervised', 'regression', 'classification', 'gradient descent', 'overfitting'],
  dl: ['deep learning', 'cnn', 'rnn', 'lstm', 'transformer', 'attention'],
  ds: ['data science', 'data analysis', 'python', 'pandas', 'numpy', 'visualization', 'd3', 'statistics', 'analytics'],
  nlp: ['nlp', 'natural language', 'language model', 'bert', 'gpt', 'sentiment', 'text mining', 'tokenization'],
  cv: ['computer vision', 'image', 'opencv', 'object detection', 'recognition'],
  cyber: ['cybersecurity', 'security', 'hacking', 'cryptography', 'network security', 'penetration'],
  web: ['web', 'javascript', 'react', 'node', 'frontend', 'backend', 'html', 'css', 'api'],
  mobile: ['mobile', 'ios', 'android', 'swift', 'kotlin', 'react native', 'flutter'],
  law: ['law', 'legal', 'contract', 'constitutional', 'criminal', 'human rights', 'litigation', 'court', 'jurisdiction'],
  business: ['business', 'accounting', 'finance', 'economics', 'marketing', 'hr', 'human resources', 'management', 'entrepreneurship', 'hospitality', 'logistics', 'supply chain']
}

// Map user interest/courseArea labels to resource categories (for profile-based bias)
const INTEREST_TO_CATEGORY = {
  'law': 'law', 'contract law': 'law', 'constitutional law': 'law', 'criminal law': 'law',
  'international law': 'law', 'legal writing': 'law', 'human rights': 'law', 'commercial law': 'law',
  'business & management': 'business', 'accounting & finance': 'business', 'economics': 'business',
  'marketing': 'business', 'human resources': 'business', 'entrepreneurship': 'business',
  'supply chain & logistics': 'business', 'hospitality & tourism': 'business',
  'computing & it': 'ai', 'artificial intelligence': 'ai', 'machine learning': 'ml', 'data science': 'ds',
  'natural language processing': 'nlp', 'computer vision': 'cv', 'deep learning': 'dl',
  'cybersecurity': 'cyber', 'web development': 'web', 'mobile development': 'mobile'
}

function extractCategoriesFromMessages(messages) {
  const scores = {}
  const combinedText = (messages || [])
    .map((m) => (m.text || '').toLowerCase())
    .join(' ')

  if (!combinedText.trim()) return []

  Object.entries(KEYWORDS_BY_CATEGORY).forEach(([category, keywords]) => {
    let count = 0
    keywords.forEach((kw) => {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      const matches = combinedText.match(regex)
      if (matches) count += matches.length
    })
    if (count > 0) scores[category] = count
  })

  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat)
}

/**
 * Get preferred categories from user profile (orderedInterests + courseArea).
 * Used to bias recommendations toward the user's declared interests.
 */
function getPreferredCategoriesFromUser(user) {
  if (!user) return []
  const categories = []
  const area = (user.courseArea || '').toLowerCase().trim()
  if (INTEREST_TO_CATEGORY[area]) categories.push(INTEREST_TO_CATEGORY[area])
  const ordered = (user.orderedInterests || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  ordered.forEach((interest) => {
    const cat = INTEREST_TO_CATEGORY[interest]
    if (cat && !categories.includes(cat)) categories.push(cat)
  })
  const additional = (user.csInterests || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  additional.forEach((interest) => {
    const cat = INTEREST_TO_CATEGORY[interest]
    if (cat && !categories.includes(cat)) categories.push(cat)
  })
  return categories
}

/**
 * Get recommended resources based on group chat messages.
 * When user is provided, categories from user's interests are favored first.
 * @param {Array} messages - Chat messages with { text }
 * @param {number} limit - Max resources to return (default 5)
 * @param {Object} user - Optional user with orderedInterests, courseArea, csInterests (for bias)
 * @returns {Array} Recommended resource objects
 */
export function getRecommendedResourcesFromChat(messages, limit = 5, user = null) {
  const fromChat = extractCategoriesFromMessages(messages)
  const fromUser = getPreferredCategoriesFromUser(user)
  const topCategories = [...fromUser, ...fromChat.filter((c) => !fromUser.includes(c))]

  if (topCategories.length === 0) return []

  const seen = new Set()
  const result = []

  for (const category of topCategories) {
    const resources = learningResources.filter((r) => r.category === category)
    for (const res of resources) {
      if (!seen.has(res.id)) {
        seen.add(res.id)
        result.push(res)
        if (result.length >= limit) return result
      }
    }
  }

  return result
}
