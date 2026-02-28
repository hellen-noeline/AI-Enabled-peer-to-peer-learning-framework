import React, { useState, useRef, useEffect } from 'react'

const SPECIFY_VALUE = '__specify__'

/**
 * Multi-value field: display tags, add from dropdown (with "Other / Specify") or by typing.
 * Values are stored as comma-separated string; onChange(name, commaSeparatedString).
 * Optional onSuggest: when user adds a value not in options, call onSuggest(field, value) to teach the model.
 */
export function TagsInputWithDropdown({
  name,
  label,
  value = '',
  options = [],
  onChange,
  onSuggest,
  placeholder = 'Add from list or type below',
  specifyPlaceholder = 'Type your own and press Enter',
  required = false,
  className = ''
}) {
  const normalizedOptions = Array.isArray(options) ? options : []
  const items = value
    ? value.split(',').map((s) => s.trim()).filter(Boolean)
    : []
  const [inputValue, setInputValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showSpecify, setShowSpecify] = useState(false)
  const [specifyText, setSpecifyText] = useState('')
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false)
        setShowSpecify(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const updateItems = (newItems) => {
    const str = newItems.join(', ')
    onChange({ target: { name, value: str } })
  }

  const addItem = (item) => {
    const trimmed = (item || '').trim()
    if (!trimmed) return
    if (items.includes(trimmed)) return
    const newItems = [...items, trimmed]
    updateItems(newItems)
    if (!normalizedOptions.includes(trimmed) && onSuggest) {
      onSuggest(name, trimmed)
    }
    setInputValue('')
    setShowDropdown(false)
    setShowSpecify(false)
    setSpecifyText('')
  }

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index)
    updateItems(newItems)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      addItem(inputValue.trim())
    }
  }

  const handleSpecifyKeyDown = (e) => {
    if (e.key === 'Enter' && specifyText.trim()) {
      e.preventDefault()
      addItem(specifyText.trim())
    }
  }

  const availableOptions = normalizedOptions.filter((o) => !items.includes(o))

  return (
    <div className={`form-group full-width ${className}`} ref={containerRef}>
      {label && (
        <label>
          {label}
          {required && ' *'}
        </label>
      )}
      <div className="tags-input-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="tag-chip"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.5rem',
              background: '#eee',
              borderRadius: '9999px',
              fontSize: '0.875rem'
            }}
          >
            {item}
            <button
              type="button"
              onClick={() => removeItem(index)}
              aria-label={`Remove ${item}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
            >
              ×
            </button>
          </span>
        ))}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '120px' }}>
          <input
            type="text"
            value={showSpecify ? '' : inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setShowSpecify(false)
              setShowDropdown(!!e.target.value)
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={{ width: '100%', minWidth: '120px' }}
          />
          {showDropdown && (
            <ul
              className="tags-dropdown"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                margin: 0,
                padding: '0.25rem 0',
                listStyle: 'none',
                background: '#fff',
                border: '1px solid #ccc',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 10,
                maxHeight: '200px',
                overflowY: 'auto'
              }}
            >
              {availableOptions
                .filter((o) => !inputValue || o.toLowerCase().includes(inputValue.toLowerCase()))
                .slice(0, 15)
                .map((opt) => (
                  <li key={opt}>
                    <button
                      type="button"
                      onClick={() => addItem(opt)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.5rem 0.75rem',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {opt}
                    </button>
                  </li>
                ))}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setShowDropdown(false)
                    setShowSpecify(true)
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                    color: '#6366f1'
                  }}
                >
                  Other / Specify
                </button>
              </li>
            </ul>
          )}
          {showSpecify && (
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={specifyText}
                onChange={(e) => setSpecifyText(e.target.value)}
                onKeyDown={handleSpecifyKeyDown}
                placeholder={specifyPlaceholder}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => { if (specifyText.trim()) addItem(specifyText.trim()) }}
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TagsInputWithDropdown
