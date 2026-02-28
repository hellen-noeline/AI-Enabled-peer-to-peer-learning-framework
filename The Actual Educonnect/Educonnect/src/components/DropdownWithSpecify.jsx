import React, { useState } from 'react'

const SPECIFY_VALUE = '__specify__'

/**
 * Single-value dropdown with known options + "Specify" that shows a text input.
 * When user selects "Specify", they can type a custom value; that value is reported via onChange.
 */
export function DropdownWithSpecify({
  name,
  label,
  value,
  options = [],
  onChange,
  placeholder = 'Select or specify',
  specifyPlaceholder = 'Type your own...',
  required = false,
  className = '',
  labelClassName = ''
}) {
  const normalizedOptions = Array.isArray(options) ? options : []
  const isSpecify = value && !normalizedOptions.includes(value)
  const [specifyText, setSpecifyText] = useState(isSpecify ? value : '')

  const handleSelectChange = (e) => {
    const v = e.target.value
    if (v === SPECIFY_VALUE) {
      onChange({ target: { name, value: specifyText || '' } })
      return
    }
    onChange({ target: { name, value: v } })
  }

  const handleSpecifyInput = (e) => {
    const v = e.target.value
    setSpecifyText(v)
    onChange({ target: { name, value: v } })
  }

  const displayValue = isSpecify ? SPECIFY_VALUE : (value || '')

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label className={labelClassName}>
          {label}
          {required && ' *'}
        </label>
      )}
      <select
        name={name}
        value={displayValue}
        onChange={handleSelectChange}
        required={required && !isSpecify ? false : required}
        aria-describedby={displayValue === SPECIFY_VALUE ? `${name}-specify` : undefined}
      >
        <option value="">{placeholder}</option>
        {normalizedOptions.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
        <option value={SPECIFY_VALUE}>Other / Specify</option>
      </select>
      {displayValue === SPECIFY_VALUE && (
        <input
          id={`${name}-specify`}
          type="text"
          value={specifyText}
          onChange={handleSpecifyInput}
          placeholder={specifyPlaceholder}
          required={required}
          className="specify-input"
          style={{ marginTop: '0.5rem' }}
        />
      )}
    </div>
  )
}

export default DropdownWithSpecify
