/**
 * ML inference for "next topic to study" in Node.
 * Uses model_export.json produced by scripts/train_next_topic_model.py.
 * Feature vector must match the Python training script exactly.
 */

import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MODEL_PATH = path.join(__dirname, 'model_export.json')

const FIELD_IDS = ['ai', 'ml', 'ds', 'nlp', 'cv', 'cyber', 'web', 'law', 'business']
const COURSE_AREAS = ['Computing & IT', 'Law', 'Business & Management', 'Other']

let cachedExport = null

function parseList(str) {
  if (!str || typeof str !== 'string') return []
  return str.split(',').map((s) => s.trim()).filter(Boolean)
}

/**
 * Build feature vector from user object. Must match Python build_feature_vector.
 */
function buildFeatureVector(user) {
  const area = (user.courseArea || '').trim() || 'Other'
  const areaIdx = COURSE_AREAS.indexOf(area) >= 0 ? COURSE_AREAS.indexOf(area) : COURSE_AREAS.indexOf('Other')
  const areaOneHot = COURSE_AREAS.map((_, i) => (i === areaIdx ? 1.0 : 0.0))

  const ordered = parseList(user.orderedInterests || '')
  const weak = parseList(user.weakTopics || '')
  const strong = parseList(user.strongTopics || '')

  const nInterests = Math.min(ordered.length, 20) / 20.0
  const nWeak = Math.min(weak.length, 10) / 10.0
  const nStrong = Math.min(strong.length, 10) / 10.0

  const fp = user.studyStats?.fieldProgress || {}
  let totalHours = Number(user.studyStats?.totalHours) || 0
  totalHours = Math.min(totalHours, 200) / 100.0

  const fieldScores = FIELD_IDS.map((fid) => {
    const p = fp[fid] || {}
    let score = p.finalScore != null ? Number(p.finalScore) : 0
    return Math.min(Math.max(score, 0), 100) / 100.0
  })

  return [...areaOneHot, nInterests, nWeak, nStrong, totalHours, ...fieldScores]
}

/**
 * Apply scaler: (x - mean) / scale
 */
function scale(features, mean, scaleArr) {
  return features.map((x, i) => {
    const m = mean[i] ?? 0
    const s = scaleArr[i] > 1e-8 ? scaleArr[i] : 1.0
    return (x - m) / s
  })
}

/**
 * Softmax and return argmax class index.
 */
function softmaxArgmax(logits) {
  const max = Math.max(...logits)
  const exp = logits.map((x) => Math.exp(x - max))
  const sum = exp.reduce((a, b) => a + b, 0)
  const probs = exp.map((e) => e / sum)
  let best = 0
  for (let i = 1; i < probs.length; i++) {
    if (probs[i] > probs[best]) best = i
  }
  return best
}

/**
 * Load model export from disk (cached).
 */
function loadModelExport() {
  if (cachedExport) return cachedExport
  if (!existsSync(MODEL_PATH)) return null
  try {
    cachedExport = JSON.parse(readFileSync(MODEL_PATH, 'utf8'))
    return cachedExport
  } catch (e) {
    console.warn('ML model load failed:', e.message)
    return null
  }
}

/**
 * Predict next topic (field_id) for a user. Returns null if model not available.
 */
export function predictNextTopic(user) {
  if (!user) return null
  const export_ = loadModelExport()
  if (!export_ || export_.modelType !== 'logistic_multinomial') return null

  const features = buildFeatureVector(user)
  if (features.length !== export_.featureNames.length) return null

  const mean = export_.scaler?.mean ?? []
  const scaleArr = export_.scaler?.scale ?? features.map(() => 1.0)
  const scaled = scale(features, mean, scaleArr)

  const coef = export_.coefficients
  const intercept = export_.intercept
  const classes = export_.classes || FIELD_IDS
  const logits = intercept.map((b, k) => {
    let sum = b
    for (let i = 0; i < scaled.length; i++) sum += (coef[k][i] ?? 0) * scaled[i]
    return sum
  })

  const idx = softmaxArgmax(logits)
  return classes[idx] || null
}
