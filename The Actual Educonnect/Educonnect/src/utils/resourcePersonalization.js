/**
 * Maps signup/profile fields to learning resource categories and search terms
 * so non–computing students are not funnelled into the default (CS-first) catalogue order.
 */

export const COMPUTING_CATEGORIES = ['ai', 'ml', 'ds', 'nlp', 'cv', 'dl', 'cyber', 'web', 'mobile']

const AREA_TO_CATEGORIES = {
  'computing & it': [...COMPUTING_CATEGORIES],
  law: ['law'],
  'business & management': ['business'],
  education: ['education'],
  humanities: ['humanities'],
  health: ['health'],
  agriculture: ['agriculture']
}

const AREA_ALIASES = {
  'computing and it': 'computing & it',
  cs: 'computing & it',
  it: 'computing & it',
  'computer science': 'computing & it',
  'information technology': 'computing & it',
  'business and management': 'business & management',
  'medicine': 'health',
  nursing: 'health'
}

// Signup interest labels (lowercase) → resource category ids (same keys as learningResources.category)
const INTEREST_TO_CATEGORIES = {
  'computing & it': [...COMPUTING_CATEGORIES],
  law: ['law'],
  'contract law': ['law'],
  'constitutional law': ['law'],
  'criminal law': ['law'],
  'international law': ['law'],
  'legal writing': ['law'],
  'human rights': ['law', 'humanities'],
  'commercial law': ['law'],
  'business & management': ['business'],
  'accounting & finance': ['business'],
  economics: ['business'],
  marketing: ['business'],
  'human resources': ['business'],
  entrepreneurship: ['business'],
  'supply chain & logistics': ['business'],
  'hospitality & tourism': ['business'],
  education: ['education'],
  humanities: ['humanities'],
  health: ['health'],
  agriculture: ['agriculture'],
  'artificial intelligence': ['ai'],
  'machine learning': ['ml'],
  'data science': ['ds'],
  'natural language processing': ['nlp'],
  'computer vision': ['cv'],
  'deep learning': ['dl'],
  cybersecurity: ['cyber'],
  'web development': ['web'],
  'mobile development': ['mobile'],
  // Extended fields (signup checklist)
  'curriculum & instruction': ['education'],
  'educational psychology': ['education'],
  'special & inclusive education': ['education'],
  'assessment & evaluation': ['education'],
  'educational technology': ['education', 'web'],
  philosophy: ['humanities'],
  'literature & languages': ['humanities'],
  history: ['humanities'],
  'cultural studies': ['humanities'],
  'theology & religious studies': ['humanities'],
  'nursing & midwifery': ['health'],
  'medicine & surgery': ['health'],
  'public health': ['health'],
  pharmacy: ['health'],
  'biomedical sciences': ['health'],
  'animal science': ['agriculture'],
  agronomy: ['agriculture'],
  'agricultural economics': ['agriculture', 'business'],
  'food science & technology': ['agriculture'],
  'environmental management': ['agriculture', 'humanities'],
  'crop production': ['agriculture']
}

const KEYWORDS_BY_CATEGORY = {
  ai: ['ai', 'artificial intelligence', 'reinforcement learning', 'search algorithm'],
  ml: ['machine learning', 'neural network', 'tensorflow', 'pytorch', 'scikit-learn'],
  ds: ['data science', 'data analysis', 'pandas', 'statistics', 'sql'],
  nlp: ['nlp', 'natural language', 'bert', 'gpt', 'text mining'],
  cv: ['computer vision', 'opencv', 'image classification', 'cnn'],
  dl: ['deep learning', 'lstm', 'transformer'],
  cyber: ['cyber', 'cryptography', 'network security'],
  web: ['web development', 'react', 'node', 'javascript', 'html'],
  mobile: ['mobile', 'ios', 'android', 'flutter'],
  law: ['law', 'legal', 'contract', 'constitutional', 'criminal', 'litigation', 'jurisdiction'],
  business: ['business', 'accounting', 'finance', 'economics', 'marketing', 'management', 'entrepreneurship'],
  education: ['education', 'teaching', 'curriculum', 'pedagogy', 'classroom', 'assessment'],
  humanities: ['philosophy', 'literature', 'history', 'humanities', 'writing', 'culture'],
  health: ['nursing', 'health', 'medical', 'clinical', 'anatomy', 'epidemiology'],
  agriculture: ['agriculture', 'farming', 'crop', 'soil', 'agronomy', 'livestock']
}

function normalizeArea(area) {
  return String(area || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function splitList(s) {
  return String(s || '')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)
}

function categoriesFromCourseArea(courseArea) {
  const n = normalizeArea(courseArea)
  if (!n) return []
  const key = AREA_ALIASES[n] || n
  return AREA_TO_CATEGORIES[key] ? [...AREA_TO_CATEGORIES[key]] : []
}

/**
 * Infer resource categories from degree programme title (handles "Other" course area).
 */
export function inferCategoriesFromDegreeProgram(degreeProgram) {
  const t = String(degreeProgram || '').toLowerCase()
  const out = new Set()
  if (!t.trim()) return out

  if (
    /\b(llb|l\.l\.b|laws?|legal)\b/.test(t) ||
    /school of law|faculty of law/.test(t)
  ) {
    out.add('law')
  }
  if (
    /\b(bba|mba|b\.com|commerce|business admin|accounting|economics|marketing|finance|hospitality|supply chain)\b/.test(t) ||
    /college of business|business and management|management sciences/.test(t)
  ) {
    out.add('business')
  }
  if (/education|teaching|pedagogy|b\.ed|bachelor of education/.test(t)) {
    out.add('education')
  }
  if (/nursing|medicine|public health|pharmacy|health sciences|midwifery|clinical/.test(t)) {
    out.add('health')
  }
  if (/agricultur|agronomy|crop|animal science|forestry|food science/.test(t)) {
    out.add('agriculture')
  }
  if (/humanities|social sciences|literature|philosophy|history|divinity|theology|arts\b/.test(t)) {
    out.add('humanities')
  }
  if (
    /computing|computer science|software engineering|information technology|\bit\b|data science|cyber|machine learning|artificial intelligence|bitcs|cis\b/.test(t)
  ) {
    COMPUTING_CATEGORIES.forEach((c) => out.add(c))
  }
  return out
}

function categoriesFromInterestLabel(label) {
  const key = String(label || '').trim().toLowerCase()
  if (!key) return []
  if (INTEREST_TO_CATEGORIES[key]) return [...INTEREST_TO_CATEGORIES[key]]

  const found = new Set()
  Object.entries(KEYWORDS_BY_CATEGORY).forEach(([cat, kws]) => {
    for (const kw of kws) {
      if (key.includes(kw) || kw.includes(key)) {
        found.add(cat)
        break
      }
    }
  })
  return [...found]
}

/**
 * Ordered list of resource category ids preferred for this user (profile + programme).
 */
export function getPreferredCategoriesForUser(user) {
  const set = new Set()
  categoriesFromCourseArea(user?.courseArea).forEach((c) => set.add(c))
  inferCategoriesFromDegreeProgram(user?.degreeProgram).forEach((c) => set.add(c))
  splitList(user?.orderedInterests).forEach((label) => {
    categoriesFromInterestLabel(label).forEach((c) => set.add(c))
  })
  splitList(user?.csInterests).forEach((label) => {
    categoriesFromInterestLabel(label).forEach((c) => set.add(c))
  })
  return [...set]
}

export function userWantsComputingCategories(preferredCategoryList) {
  return preferredCategoryList.some((c) => COMPUTING_CATEGORIES.includes(c))
}
