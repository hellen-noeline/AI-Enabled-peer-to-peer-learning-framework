import React, { useCallback } from 'react'
import { useTextToSpeech } from '../hooks/useTextToSpeech'
import '../styles/AudioReader.css'

const MAIN_SELECTOR = 'main#main-content, main[role="main"], [data-audio-main]'

export function AudioReader() {
  const { readElement, stop, speaking, supported } = useTextToSpeech()

  const handleToggle = useCallback(() => {
    if (speaking) {
      stop()
      return
    }
    const main = document.querySelector(MAIN_SELECTOR)
    if (main) {
      readElement(main)
    } else {
      readElement(document.body)
    }
  }, [speaking, stop, readElement])

  if (!supported) return null

  return (
    <div className="audio-reader" role="region" aria-label="Page audio">
      <button
        type="button"
        className={'audio-reader-btn ' + (speaking ? 'speaking' : '')}
        onClick={handleToggle}
        aria-label={speaking ? 'Stop reading' : 'Listen to this page'}
        aria-pressed={speaking}
        title={speaking ? 'Stop reading' : 'Listen to this page (text-to-speech)'}
      >
        <span className="audio-reader-icon" aria-hidden="true">
          {speaking ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </span>
        <span className="audio-reader-label">{speaking ? 'Stop' : 'Listen'}</span>
      </button>
      <div className="audio-reader-status" aria-live="polite" aria-atomic="true">
        {speaking ? 'Reading page aloud…' : ''}
      </div>
    </div>
  )
}
