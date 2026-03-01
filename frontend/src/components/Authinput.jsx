/**
 * AuthInput.jsx
 * =============
 * Reusable input with leading icon, error state, and
 * optional show/hide password toggle.
 */

import { useState } from 'react'

export default function AuthInput({
  label, name, type = 'text', placeholder,
  value, onChange, error, autoComplete,
  icon, required = false,
}) {
  const [showPwd, setShowPwd] = useState(false)
  const isPassword = type === 'password'
  const inputType  = isPassword ? (showPwd ? 'text' : 'password') : type

  return (
    <div style={S.group}>
      <label htmlFor={name} style={S.label}>
        {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
      </label>

      <div style={{ position: 'relative' }}>
        {/* Leading icon */}
        {icon && (
          <div style={S.iconLeft}>
            {icon}
          </div>
        )}

        <input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          style={{
            ...S.input,
            ...(error ? S.inputError : {}),
            paddingLeft: icon ? '2.75rem' : '1rem',
            paddingRight: isPassword ? '2.75rem' : '1rem',
          }}
          onFocus={e => { e.target.style.borderColor = error ? '#EF4444' : '#2563EB'; e.target.style.boxShadow = error ? '0 0 0 3px rgba(239,68,68,.12)' : '0 0 0 3px rgba(37,99,235,.12)' }}
          onBlur={e  => { e.target.style.borderColor = error ? '#EF4444' : '#CBD5E1'; e.target.style.boxShadow = 'none' }}
        />

        {/* Show/hide toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPwd(v => !v)}
            style={S.eyeBtn}
            tabIndex={-1}
            aria-label={showPwd ? 'Hide password' : 'Show password'}
          >
            {showPwd ? <EyeOff /> : <Eye />}
          </button>
        )}
      </div>

      {error && (
        <p style={S.errTxt}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

/* ── Icons ──────────────────────────────────────────────────────────────────── */
export function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="3" stroke="#94A3B8" strokeWidth="2"/>
      <path d="M2 7l10 7 10-7" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="#94A3B8" strokeWidth="2"/>
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="#94A3B8" strokeWidth="2"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function Eye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#94A3B8" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3" stroke="#94A3B8" strokeWidth="2"/>
    </svg>
  )
}

function EyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────────── */
const S = {
  group: { marginBottom: '1.125rem' },
  label: {
    display: 'block',
    fontSize: '.8125rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '.4rem',
    letterSpacing: '.01em',
  },
  input: {
    width: '100%',
    height: 46,
    border: '1.5px solid #CBD5E1',
    borderRadius: 10,
    fontSize: '.9375rem',
    color: '#0F172A',
    background: '#FAFAFA',
    outline: 'none',
    transition: 'border-color .18s, box-shadow .18s, background .18s',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: '#EF4444',
    background: '#FFF5F5',
  },
  iconLeft: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  eyeBtn: {
    position: 'absolute',
    right: '.875rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: 0,
    color: '#94A3B8',
  },
  errTxt: {
    display: 'flex',
    alignItems: 'center',
    gap: '.3rem',
    marginTop: '.35rem',
    fontSize: '.775rem',
    color: '#EF4444',
    fontWeight: 500,
  },
}