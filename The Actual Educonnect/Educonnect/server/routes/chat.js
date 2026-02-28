/**
 * EduBot chat API – system help, navigation, resources, issue resolution.
 * Uses optional NLP (Python) for semantic intent + keyword fallback. Polite out-of-scope response.
 */

import express from 'express'
import { learningResources } from '../data/learningResources.js'

const router = express.Router()

const ATLAS_NLP_URL = process.env.ATLAS_NLP_URL || process.env.BERTOPIC_API || 'http://localhost:5001'
const NLP_TIMEOUT_MS = 4000

// System map: routes and features EduBot can reference
const SYSTEM_MAP = {
  routes: [
    { path: '/dashboard', name: 'Dashboard', description: 'Your home: overview, quick actions, study timer, and suggestions.' },
    { path: '/recommendations', name: 'Find Partners', description: 'Find study partners matched to your interests and goals.' },
    { path: '/groups', name: 'Study Groups', description: 'Browse and join study groups or create your own.' },
    { path: '/resources', name: 'Learning Resources', description: 'Courses and materials by topic: AI, ML, Data Science, Law, Business, web, and more.' },
    { path: '/profile', name: 'Profile', description: 'Edit your profile, interests, and study preferences.' },
    { path: '/feedback', name: 'Feedback', description: 'Send feedback or report issues to the team.' },
    { path: '/analytics', name: 'Study Analytics', description: 'Charts and stats for your study time and quiz progress.' },
    { path: '/quiz', name: 'Quizzes', description: 'Take quizzes by field (e.g. AI, ML, NLP) from the quiz hub.' }
  ],
  features: [
    { id: 'timer', name: 'Study Timer', location: 'Dashboard', description: 'Start a focused study session; time is logged to your analytics.' },
    { id: 'partners', name: 'Find Partners', location: 'Find Partners', description: 'Get matched with peers by interests and fields.' },
    { id: 'groups', name: 'Study Groups', location: 'Study Groups', description: 'Join or create groups and use group chat.' },
    { id: 'resources', name: 'Learning Resources', location: 'Resources', description: 'Filter by category (AI, ML, Law, Business, web, cyber, etc.) and open external courses.' },
    { id: 'quizzes', name: 'Quizzes', location: 'Quiz hub', description: 'Practice with quizzes per field; progress is saved.' },
    { id: 'analytics', name: 'Analytics', location: 'Study Analytics', description: 'View study hours and quiz performance over time.' },
    { id: 'feedback', name: 'Feedback', location: 'Feedback', description: 'Submit feedback or report a problem.' }
  ],
  helpTopics: [
    { keywords: ['sign up', 'register', 'account', 'create account', 'registration', 'new account'], path: '/signup', label: 'Sign up' },
    { keywords: ['log in', 'login', 'sign in', 'log in', 'access account'], path: '/login', label: 'Log in' },
    { keywords: ['password', 'forgot password', 'reset password', 'lost password', 'change password'], path: '/login', label: 'Log in (password reset not yet available)' },
    { keywords: ['profile', 'edit profile', 'preferences', 'my profile', 'update profile'], path: '/profile', label: 'Profile' },
    { keywords: ['partner', 'match', 'recommendation', 'study buddy', 'find someone'], path: '/recommendations', label: 'Find Partners' },
    { keywords: ['group', 'study group', 'join group', 'create group', 'group chat'], path: '/groups', label: 'Study Groups' },
    { keywords: ['resource', 'course', 'learn', 'tutorial', 'materials', 'courses', 'law', 'legal', 'business', 'accounting', 'economics'], path: '/resources', label: 'Resources' },
    { keywords: ['quiz', 'test', 'practice', 'quiz hub', 'take a quiz'], path: '/dashboard', label: 'Dashboard (then Quiz hub)' },
    { keywords: ['analytics', 'stats', 'hours', 'progress', 'statistics', 'study time'], path: '/analytics', label: 'Study Analytics' },
    { keywords: ['feedback', 'report', 'bug', 'issue', 'contact', 'complaint'], path: '/feedback', label: 'Feedback' }
  ]
}

// Replies for NLP intents (when Python returns intent + confidence)
const INTENT_REPLIES = {
  hello: {
    text: "Hi! I'm EduBot, your EduConnect assistant. I can help you find features, open resources, or troubleshoot issues. What do you need?",
    actions: [{ path: '/dashboard', label: 'Go to Dashboard' }, { path: '/resources', label: 'Browse Resources' }, { path: '/groups', label: 'Study Groups' }]
  },
  thanks: {
    text: "You're welcome! Ask anytime if you need more help.",
    actions: []
  },
  help: {
    text: "I can help you with:\n\n• **Navigation** – \"Where is X?\" or \"Take me to Resources\"\n• **Features** – \"How do I start a study timer?\" or \"Where are quizzes?\"\n• **Resources** – \"Show me Law courses\", \"Business materials\", \"ML tutorials\", or \"Learning resources\"\n• **Issues** – \"I can't log in\", \"Report a bug\"\n\nI support Computing, Law, Business, and all course areas. Try asking in your own words.",
    actions: SYSTEM_MAP.routes.slice(0, 6).map(r => ({ path: r.path, label: r.name }))
  },
  login: {
    text: 'Use the **Log in** page. Make sure the EduConnect server is running (from the server folder: npm start).',
    actions: [{ path: '/login', label: 'Log in' }]
  },
  signup: {
    text: 'Go to **Sign up** to create an account. The backend must be running for sign up to work.',
    actions: [{ path: '/signup', label: 'Sign up' }]
  },
  password_reset: {
    text: "Password reset isn’t available in this version. Please use your current password. If you’ve lost it, you’d need to create a new account (Sign up) or contact support.",
    actions: [{ path: '/login', label: 'Log in' }, { path: '/signup', label: 'Sign up' }]
  },
  profile: {
    text: 'You can edit your **Profile** (name, interests, preferences) from the Profile page.',
    actions: [{ path: '/profile', label: 'Open Profile' }]
  },
  find_partners: {
    text: '**Find Partners** matches you with peers by interests and goals. Open the page to see recommendations.',
    actions: [{ path: '/recommendations', label: 'Find Partners' }]
  },
  study_groups: {
    text: 'Use **Study Groups** to browse or create groups and use group chat.',
    actions: [{ path: '/groups', label: 'Study Groups' }]
  },
  resources: {
    text: '**Learning Resources** has courses and materials by topic: AI, ML, Data Science, Law, Business, web, and more. Filter by category and open external links.',
    actions: [{ path: '/resources', label: 'Open Resources' }]
  },
  quizzes: {
    text: '**Quizzes** are on the Dashboard (Quiz hub) or by field (e.g. AI, ML). Your progress is saved.',
    actions: [{ path: '/dashboard', label: 'Dashboard' }]
  },
  analytics: {
    text: '**Study Analytics** shows your study hours and quiz progress over time.',
    actions: [{ path: '/analytics', label: 'Study Analytics' }]
  },
  feedback: {
    text: 'Use **Feedback** to send a message to the team or report a problem. We’ll look into it.',
    actions: [{ path: '/feedback', label: 'Send Feedback' }]
  },
  issues: {
    text: "Sorry you're running into trouble. Try **Log in** / **Sign up** if it’s an account issue, or use **Feedback** to describe what’s broken so we can fix it. Password reset isn’t available yet—use your current password.",
    actions: [{ path: '/login', label: 'Log in' }, { path: '/feedback', label: 'Send Feedback' }]
  },
  timer: {
    text: 'The **Study Timer** is on the Dashboard. Start a session there; your time is logged to Analytics.',
    actions: [{ path: '/dashboard', label: 'Dashboard' }]
  },
  navigation_dashboard: {
    text: '**Dashboard** is your home: overview, study timer, and quick links.',
    actions: [{ path: '/dashboard', label: 'Open Dashboard' }]
  },
  navigation_resources: {
    text: '**Learning Resources** has courses and tutorials. Open the page to browse by topic.',
    actions: [{ path: '/resources', label: 'Open Resources' }]
  }
}

// Category keywords for learning resource recommendations
const CATEGORY_KEYWORDS = {
  ai: ['ai', 'artificial intelligence', 'reinforcement', 'rl '],
  ml: ['machine learning', 'ml', 'neural network', 'tensorflow', 'pytorch', 'scikit', 'sklearn'],
  dl: ['deep learning', 'dl', 'cnn', 'rnn', 'lstm', 'neural network'],
  nlp: ['nlp', 'natural language', 'language processing', 'text mining', 'transformers', 'bert', 'spacy'],
  ds: ['data science', 'data analysis', 'python', 'pandas', 'sql', 'statistics', 'visualization'],
  web: ['web', 'react', 'node', 'frontend', 'backend', 'full stack', 'javascript'],
  cyber: ['cyber', 'security', 'network security', 'owasp', 'ethical hacking'],
  cv: ['computer vision', 'vision', 'opencv', 'image', 'cnn'],
  mobile: ['mobile', 'android', 'ios', 'swift', 'kotlin', 'flutter', 'app development'],
  law: ['law', 'legal', 'contract', 'constitutional', 'criminal', 'human rights', 'litigation', 'court', 'jurisdiction', 'commercial law', 'legal writing', 'international law'],
  business: ['business', 'accounting', 'finance', 'economics', 'marketing', 'hr', 'human resources', 'management', 'entrepreneurship', 'hospitality', 'logistics', 'supply chain', 'microeconomics', 'macroeconomics']
}

const CATEGORY_LABELS = {
  ai: 'AI',
  ml: 'Machine Learning',
  dl: 'Deep Learning',
  nlp: 'NLP',
  ds: 'Data Science',
  web: 'Web Development',
  cyber: 'Cybersecurity',
  cv: 'Computer Vision',
  mobile: 'Mobile Development',
  law: 'Law',
  business: 'Business & Management'
}

const RECOMMEND_TRIGGERS = ['recommend', 'suggest', 'give me', 'find me', 'want to learn', 'learn about', 'course on', 'tutorial for', 'best course', 'something for', 'what should i', 'content for', 'resource for', 'courses for', 'learning material', 'anything for', 'options for', 'link to', 'direct me to']

function getCategoriesFromMessage(message) {
  const t = normalize(message)
  const tokens = tokenize(message)
  const categories = []
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matched = keywords.some(kw => t.includes(kw) || tokens.some(tok => tok.includes(kw.replace(/\s/g, '')) || kw.includes(tok)))
    if (matched) categories.push(cat)
  }
  return categories
}

function getDifficultyFromMessage(message) {
  const t = normalize(message)
  if (t.includes('beginner') || t.includes('easy') || t.includes('intro') || t.includes('starting')) return 'Beginner'
  if (t.includes('advanced') || t.includes('expert')) return 'Advanced'
  if (t.includes('intermediate') || t.includes('mid')) return 'Intermediate'
  return null
}

function handleLearningResourceRecommendation(message) {
  const t = normalize(message)
  if (t.includes('where') && (t.includes('resource') || t.includes('course'))) return null
  if (t.includes('how do i') && (t.includes('access') || t.includes('find') || t.includes('get to'))) return null
  const isAskingForRecommendation = RECOMMEND_TRIGGERS.some(trigger => t.includes(trigger))
  const hasTopicOrGeneric = t.includes('course') || t.includes('learn') || t.includes('resource') || t.includes('tutorial') || getCategoriesFromMessage(message).length > 0
  if (!isAskingForRecommendation && !hasTopicOrGeneric) return null

  const categories = getCategoriesFromMessage(message)
  const difficulty = getDifficultyFromMessage(message)
  let pool = learningResources

  if (categories.length > 0) {
    pool = pool.filter(r => categories.includes(r.category))
  }
  if (difficulty) {
    pool = pool.filter(r => r.difficulty === difficulty)
  }
  if (pool.length === 0) pool = learningResources
  pool = pool.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0))
  const top = pool.slice(0, 5)

  const categoryLabel = categories.length === 1
    ? (CATEGORY_LABELS[categories[0]] || categories[0])
    : 'your topic'

  const lines = top.map((r, i) => `${i + 1}. **${r.title}** (${r.provider}) – ${r.difficulty}, ${r.duration || 'Self-paced'}. ${(r.description || '').slice(0, 80)}…`)
  const text = `Here are some learning resources for **${categoryLabel}**:\n\n${lines.join('\n\n')}\n\nClick any link below to open the course, or browse all resources in the app.`
  const actions = top.map(r => ({ label: `${r.title} (${r.provider})`, url: r.link }))
  actions.push({ path: '/resources', label: 'Browse all resources' })
  return { text, actions }
}

// Soft hints: words that suggest a topic even when we didn’t match a full intent (for suggestions when we can’t help exactly).
const SOFT_HINT_WORDS = [
  { words: ['course', 'learn', 'tutorial', 'material', 'video', 'class', 'topic', 'ai', 'ml', 'web', 'code', 'law', 'legal', 'business', 'accounting', 'economics', 'contract', 'marketing'], path: '/resources', label: 'Learning Resources', hint: 'browse courses and materials (CS, Law, Business)' },
  { words: ['partner', 'buddy', 'match', 'someone', 'study with', 'peer', 'recommend'], path: '/recommendations', label: 'Find Partners', hint: 'find study partners' },
  { words: ['group', 'team', 'chat', 'together', 'join'], path: '/groups', label: 'Study Groups', hint: 'join or create study groups' },
  { words: ['quiz', 'test', 'practice', 'exam', 'question'], path: '/dashboard', label: 'Quizzes', hint: 'take quizzes by topic' },
  { words: ['timer', 'focus', 'session', 'study time', 'minutes', 'pomodoro'], path: '/dashboard', label: 'Study Timer', hint: 'start a study session' },
  { words: ['progress', 'stats', 'hours', 'analytics', 'chart', 'time'], path: '/analytics', label: 'Study Analytics', hint: 'see your study stats' },
  { words: ['profile', 'edit', 'preference', 'name', 'interest'], path: '/profile', label: 'Profile', hint: 'edit your profile' },
  { words: ['feedback', 'report', 'bug', 'problem', 'issue', 'contact', 'tell', 'complaint'], path: '/feedback', label: 'Feedback', hint: 'send feedback or report an issue' }
]

function getSoftHintSuggestions(message) {
  const tokens = tokenize(message)
  if (tokens.length === 0) return []
  const out = []
  for (const { words, path, label, hint } of SOFT_HINT_WORDS) {
    const matched = words.some(w => {
      const tw = w.toLowerCase()
      return tokens.some(t => t.includes(tw) || tw.includes(t))
    })
    if (matched) out.push({ path, label, hint })
  }
  return out.slice(0, 3) // at most 3 hint-based suggestions
}

const SUGGESTION_LINES = {
  '/dashboard': '**Dashboard** – Start a study session, see your overview, or open the Quiz hub.',
  '/resources': '**Learning Resources** – Browse courses and materials by topic (AI, ML, Law, Business, web, etc.).',
  '/recommendations': '**Find Partners** – Get matched with study partners by interests and goals.',
  '/groups': '**Study Groups** – Join or create a group and use group chat.',
  '/profile': '**Profile** – Edit your profile, interests, and preferences.',
  '/analytics': '**Study Analytics** – View your study hours and quiz progress.',
  '/feedback': '**Feedback** – Tell us what you need; we’ll try to help or add it to our list.'
}

function getOutOfScopeReply(message, nlpIntent = null, nlpConfidence = 0) {
  const softHints = getSoftHintSuggestions(message || '')
  const suggestedActions = []
  const usedPaths = new Set()

  // If NLP had a low-confidence intent (e.g. 0.25–0.44), suggest it first as "you might have been looking for"
  if (nlpIntent && nlpIntent !== 'out_of_scope' && nlpConfidence >= 0.25 && INTENT_REPLIES[nlpIntent]?.actions?.length) {
    const first = INTENT_REPLIES[nlpIntent].actions[0]
    if (first && !usedPaths.has(first.path)) {
      suggestedActions.push({ path: first.path, label: first.label })
      usedPaths.add(first.path)
    }
  }

  if (softHints.length > 0) {
    softHints.forEach(s => {
      if (!usedPaths.has(s.path)) {
        suggestedActions.push({ path: s.path, label: s.label })
        usedPaths.add(s.path)
      }
    })
  }

  const generalOrder = ['/dashboard', '/resources', '/recommendations', '/groups', '/feedback']
  for (const path of generalOrder) {
    if (!usedPaths.has(path) && SUGGESTION_LINES[path]) {
      suggestedActions.push({ path, label: path === '/dashboard' ? 'Dashboard' : path === '/resources' ? 'Learning Resources' : path === '/recommendations' ? 'Find Partners' : path === '/groups' ? 'Study Groups' : 'Feedback' })
      usedPaths.add(path)
    }
  }

  const intro = softHints.length > 0
    ? "I couldn’t find an exact match for your question. Based on what you said, you might be looking for:\n\n"
    : "I couldn’t find a clear match for that. Here are suggestions that might help you:\n\n"

  const suggestionsBlock = suggestedActions
    .map(a => SUGGESTION_LINES[a.path] || `**${a.label}** – Try this for what you need.`)
    .filter(Boolean)
    .map(line => `• ${line}`)
    .join('\n\n')

  const text = intro + suggestionsBlock + "\n\nTry one of the links below, or rephrasing your question. You can also ask **\"What can you help with?\"** for more options. If you need something that isn’t in the app, use **Feedback** to tell the team."

  return {
    text,
    actions: suggestedActions.length > 0 ? suggestedActions : [
      { path: '/dashboard', label: 'Dashboard' },
      { path: '/resources', label: 'Resources' },
      { path: '/recommendations', label: 'Find Partners' },
      { path: '/feedback', label: 'Send Feedback' }
    ]
  }
}

function normalize(s) {
  return (s || '').toLowerCase().trim().replace(/\s+/g, ' ')
}

// Light tokenization: split on non-letters/numbers, drop very short and common words
const STOP_WORDS = new Set(['a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'it', 'its', 'i', 'me', 'my', 'we', 'us', 'this', 'that', 'and', 'or', 'but', 'if', 'then', 'so'])
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t))
}

function matchIntent(message, intentList) {
  const text = normalize(message)
  const tokens = tokenize(message)
  for (const entry of intentList) {
    const keywords = entry.keywords || []
    const normKeywords = keywords.map(k => normalize(k))
    if (normKeywords.some(kw => text.includes(kw))) return entry
    if (normKeywords.some(kw => tokenize(kw).some(t => tokens.includes(t)))) return entry
  }
  return null
}

function handleHello(message) {
  const t = normalize(message)
  if (/^(hi|hey|hello|howdy|yo|hiya|greetings?)\s*!*\.*$/i.test(t) || t === '') {
    return {
      text: "Hi! I'm EduBot, your EduConnect assistant. I can help you find features, open resources, or troubleshoot issues. What do you need?",
      actions: [{ path: '/dashboard', label: 'Go to Dashboard' }, { path: '/resources', label: 'Browse Resources' }, { path: '/groups', label: 'Study Groups' }]
    }
  }
  return null
}

function handleHelp(message) {
  const t = normalize(message)
  if (!t || t.includes('help') || t.includes('what can you') || t.includes('what do you') || t.includes('how do i') || t.includes('how can i') || t.includes('what are you') || t.includes('capabilities')) {
    return {
      text: "I can help you with:\n\n• **Navigation** – \"Where is X?\" or \"Take me to Resources\"\n• **Features** – \"How do I start a study timer?\" or \"Where are quizzes?\"\n• **Resources** – \"Show me Law courses\", \"Business materials\", \"ML tutorials\", or \"Learning resources\" (CS, Law, Business, and more)\n• **Issues** – \"I can't log in\", \"Report a bug\"\n\nTry asking in your own words.",
      actions: SYSTEM_MAP.routes.slice(0, 6).map(r => ({ path: r.path, label: r.name }))
    }
  }
  return null
}

function handleNavigation(message) {
  const t = normalize(message)
  for (const topic of SYSTEM_MAP.helpTopics) {
    if (topic.keywords.some(kw => t.includes(normalize(kw)))) {
      return {
        text: `You can use **${topic.label}** for that. I've added a shortcut below.`,
        actions: [{ path: topic.path, label: topic.label }]
      }
    }
  }
  for (const route of SYSTEM_MAP.routes) {
    if (t.includes(normalize(route.name)) || t.includes(normalize(route.path.replace(/\//g, ' ')))) {
      return {
        text: `**${route.name}** – ${route.description}`,
        actions: [{ path: route.path, label: `Open ${route.name}` }]
      }
    }
  }
  if (t.includes('dashboard') || t.includes('home')) {
    return { text: 'Dashboard is your home. It shows your overview, study timer, and quick links.', actions: [{ path: '/dashboard', label: 'Open Dashboard' }] }
  }
  if (t.includes('resource') || t.includes('course') || t.includes('learn')) {
    return { text: 'Learning Resources has courses and tutorials by category (AI, ML, web, etc.).', actions: [{ path: '/resources', label: 'Open Resources' }] }
  }
  if (t.includes('group') || t.includes('partner') || t.includes('match')) {
    return {
      text: 'Use **Find Partners** for matching and **Study Groups** to join or create groups.',
      actions: [{ path: '/recommendations', label: 'Find Partners' }, { path: '/groups', label: 'Study Groups' }]
    }
  }
  return null
}

function handleIssues(message) {
  const t = normalize(message)
  if (t.includes("can't") || t.includes('cannot') || t.includes('can not') || t.includes('not working') || t.includes('broken') || t.includes('error') || t.includes('bug') || t.includes('failed') || t.includes('stuck')) {
    return {
      text: "Sorry you're running into trouble. Try:\n\n• **Log in / Sign up** – Use the Log in or Sign up page; the backend server must be running.\n• **Something broken?** – Go to **Feedback** and describe the issue; we'll look into it.\n• **Forgot password?** – Password reset isn’t available yet; use your current password.",
      actions: [{ path: '/login', label: 'Log in' }, { path: '/feedback', label: 'Send Feedback' }]
    }
  }
  if (t.includes('forgot') && t.includes('password')) {
    return {
      text: "Password reset isn’t available in this version. Please use your current password. If you’ve lost it, you’d need to create a new account (Sign up) or contact support.",
      actions: [{ path: '/login', label: 'Log in' }, { path: '/signup', label: 'Sign up' }]
    }
  }
  if (t.includes('login') || t.includes('sign in') || t.includes('log in')) {
    return { text: 'Use the **Log in** page. Make sure the EduConnect server is running (from the server folder: npm start).', actions: [{ path: '/login', label: 'Log in' }] }
  }
  if (t.includes('sign up') || t.includes('register')) {
    return { text: 'Go to **Sign up** to create an account. The backend must be running for sign up to work.', actions: [{ path: '/signup', label: 'Sign up' }] }
  }
  return null
}

function handleResources(message) {
  const t = normalize(message)
  const categories = ['ai', 'ml', 'dl', 'nlp', 'ds', 'web', 'cyber', 'cv', 'mobile', 'law', 'business']
  const found = categories.filter(c => t.includes(c))
  if (found.length > 0) {
    const labels = found.map(c => CATEGORY_LABELS[c] || c).join(', ')
    return {
      text: `You can browse **Learning Resources** and filter by category (e.g. ${labels}). Open the Resources page to see courses and materials.`,
      actions: [{ path: '/resources', label: 'Open Resources' }]
    }
  }
  if (t.includes('resource') || t.includes('course') || t.includes('tutorial') || t.includes('learn') || t.includes('law') || t.includes('legal') || t.includes('business') || t.includes('accounting')) {
    return {
      text: '**Learning Resources** has courses and materials by topic: AI, ML, Data Science, Law, Business & Management, web dev, cybersecurity, and more. Filter by category and open external links.',
      actions: [{ path: '/resources', label: 'Open Resources' }]
    }
  }
  return null
}

function handleFeatures(message) {
  const t = normalize(message)
  for (const f of SYSTEM_MAP.features) {
    if (t.includes(normalize(f.name)) || (f.id && t.includes(f.id))) {
      return {
        text: `**${f.name}** – ${f.description} You’ll find it under **${f.location}**.`,
        actions: [{ path: SYSTEM_MAP.routes.find(r => r.name === f.location)?.path || '/dashboard', label: `Open ${f.location}` }]
      }
    }
  }
  if (t.includes('timer') || t.includes('study session')) {
    return { text: 'The **Study Timer** is on the Dashboard. Start a session there; your time is logged to Analytics.', actions: [{ path: '/dashboard', label: 'Dashboard' }] }
  }
  if (t.includes('quiz')) {
    return { text: '**Quizzes** are available from the Dashboard (Quiz hub) or by going to a field (e.g. AI, ML). Your progress is saved.', actions: [{ path: '/dashboard', label: 'Dashboard' }] }
  }
  return null
}

function handleThanks(message) {
  const t = normalize(message)
  if (/^(thanks?|thank you|ty|thx)\s*!*\.*$/i.test(t) || t.includes('thank you') || t.includes('appreciate it')) {
    return { text: "You're welcome! Ask anytime if you need more help." }
  }
  return null
}

function getReplyFromKeywordHandlers(message) {
  return (
    handleHello(message) ||
    handleThanks(message) ||
    handleLearningResourceRecommendation(message) ||
    handleHelp(message) ||
    handleIssues(message) ||
    handleNavigation(message) ||
    handleResources(message) ||
    handleFeatures(message)
  )
}

async function getReplyWithNLP(message) {
  if (!message || typeof message !== 'string') {
    return {
      text: "Send me a message and I'll try to help. You can ask where something is, how to do something, or report an issue.",
      actions: [{ path: '/feedback', label: 'Feedback' }]
    }
  }

  let nlpIntent = null
  let nlpConfidence = 0

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), NLP_TIMEOUT_MS)
    const res = await fetch(`${ATLAS_NLP_URL}/api/nlp/atlas-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
      signal: controller.signal
    })
    clearTimeout(timeout)
    if (res.ok) {
      const data = await res.json()
      nlpIntent = data.intent
      nlpConfidence = Number(data.confidence) || 0
    }
  } catch (_) {
    // NLP service unavailable or timeout – fall back to keywords
  }

  if (nlpIntent && nlpIntent !== 'out_of_scope' && nlpConfidence >= 0.45 && INTENT_REPLIES[nlpIntent]) {
    return INTENT_REPLIES[nlpIntent]
  }

  const keywordReply = getReplyFromKeywordHandlers(message)
  if (keywordReply) return keywordReply

  return getOutOfScopeReply(message, nlpIntent, nlpConfidence)
}

router.post('/', async (req, res) => {
  try {
    const { message } = req.body || {}
    const reply = await getReplyWithNLP(message)
    res.json({
      reply: reply.text,
      actions: reply.actions || []
    })
  } catch (err) {
    console.error('EduBot chat error:', err)
    res.status(500).json({
      reply: "Something went wrong on my side. Please try again or use Feedback to report the issue.",
      actions: [{ path: '/feedback', label: 'Send Feedback' }]
    })
  }
})

export default router
