/**
 * Recommend learning resources based on topics discussed in group chat.
 * Uses keyword matching to map chat content to resource categories.
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
  mobile: ['mobile', 'ios', 'android', 'swift', 'kotlin', 'react native', 'flutter']
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
 * Get recommended resources based on group chat messages.
 * @param {Array} messages - Chat messages with { text }
 * @param {number} limit - Max resources to return (default 5)
 * @returns {Array} Recommended resource objects
 */
export function getRecommendedResourcesFromChat(messages, limit = 5) {
  const topCategories = extractCategoriesFromMessages(messages)
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
