import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Text-to-speech hook using the Web Speech API.
 * Gives blind and low-vision users structured audio of page content.
 */
export function useTextToSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const utteranceRef = useRef(null)
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null
  const supported = !!synth

  const stop = useCallback(() => {
    if (synth) {
      synth.cancel()
      setSpeaking(false)
      setPaused(false)
    }
  }, [synth])

  const speak = useCallback((text, options = {}) => {
    if (!synth || !text || typeof text !== 'string') return
    const trimmed = text.trim()
    if (!trimmed) return

    stop()

    const utterance = new SpeechSynthesisUtterance(trimmed)
    utterance.rate = options.rate ?? 1
    utterance.pitch = options.pitch ?? 1
    utterance.volume = options.volume ?? 1
    if (options.lang) utterance.lang = options.lang

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    utteranceRef.current = utterance
    synth.speak(utterance)
  }, [synth, stop])

  /** Read an element's content aloud in reading order (structured for screen-reader users). */
  const readElement = useCallback((element) => {
    if (!synth || !element) return
    stop()
    const raw = (element.innerText || element.textContent || '').trim()
    if (!raw) return
    const paragraphs = raw.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    if (paragraphs.length === 0) {
      speak(raw)
      return
    }
    setSpeaking(true)
    let i = 0
    const speakNext = () => {
      if (i >= paragraphs.length) {
        setSpeaking(false)
        return
      }
      const u = new SpeechSynthesisUtterance(paragraphs[i])
      i++
      u.rate = 1
      u.volume = 1
      u.onend = () => setTimeout(speakNext, 320)
      u.onerror = () => setSpeaking(false)
      synth.speak(u)
    }
    speakNext()
  }, [synth, stop, speak])

  useEffect(() => {
    return () => stop()
  }, [stop])

  return { speak, readElement, stop, speaking, paused, supported }
}
