/**
 * AuthInput — standard healthcare form input (right auth panel)
 */

import { useState } from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function AuthInput({
  label, name, type = 'text', placeholder,
  value, onChange, error, autoComplete,
  icon, required = false,
}) {
  const [showPwd, setShowPwd] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPwd ? 'text' : 'password') : type

  const inputClass = [
    'auth-input',
    icon ? 'auth-input--with-icon' : '',
    isPassword ? 'auth-input--with-toggle' : '',
    error ? 'auth-input--error' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className="auth-field">
      <label htmlFor={name} className="auth-label">
        {label}
        {required && <span className="auth-label-required"> *</span>}
      </label>

      <div className="auth-input-wrap">
        {icon && <div className="auth-input-icon">{icon}</div>}

        <input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className={inputClass}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPwd(v => !v)}
            className="auth-input-toggle"
            tabIndex={-1}
            aria-label={showPwd ? 'Hide password' : 'Show password'}
          >
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && (
        <p className="auth-field-error">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  )
}

export function EmailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="M2 7l10 7 10-7" strokeLinecap="round" />
    </svg>
  )
}

export function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
    </svg>
  )
}

export function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
    </svg>
  )
}
