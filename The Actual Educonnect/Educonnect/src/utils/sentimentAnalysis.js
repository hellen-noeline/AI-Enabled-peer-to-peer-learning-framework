/**
 * Sentiment analysis using DistilBERT via Transformers.js.
 * Runs in-browser using @xenova/transformers (ONNX).
 */

let classifierPromise = null

async function getClassifier() {
  if (!classifierPromise) {
    const { pipeline } = await import('@xenova/transformers')
    classifierPromise = pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english')
  }
  return classifierPromise
}

/**
 * Analyze sentiment of text. Returns { label: 'POSITIVE'|'NEGATIVE', score: 0-1 }
 */
export async function analyzeSentiment(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return { label: 'NEUTRAL', score: 0.5 }
  }
  try {
    const classifier = await getClassifier()
    const result = await classifier(text.trim().slice(0, 512))
    const r = Array.isArray(result) ? result[0] : result
    return {
      label: r?.label || 'NEUTRAL',
      score: r?.score ?? 0.5
    }
  } catch (err) {
    console.warn('Sentiment analysis failed:', err)
    return { label: 'NEUTRAL', score: 0.5 }
  }
}
