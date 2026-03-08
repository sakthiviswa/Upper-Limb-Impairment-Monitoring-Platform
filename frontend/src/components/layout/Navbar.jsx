/**
 * Navbar.jsx
 * Top navigation bar with animated dark / light theme toggle.
 * Reads theme from ThemeContext and applies CSS-variable-driven styles.
 */

import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'

/* ─── CSS variables injected once ─────────────────────────────────── */
const THEME_CSS = `
  :root, [data-theme="light"] {
    --nb-bg:          #ffffff;
    --nb-border:      #e8edf2;
    --nb-shadow:      0 1px 0 rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04);
    --nb-text:        #0f172a;
    --nb-sub:         #64748b;
    --nb-badge-bg:    #f1f5f9;
    --nb-badge-text:  #475569;
    --nb-toggle-bg:   #f1f5f9;
    --nb-toggle-border: #e2e8f0;
    --nb-avatar-ring: #e2e8f0;
    --nb-divider:     #f1f5f9;
  }
  [data-theme="dark"] {
    --nb-bg:          #0d1117;
    --nb-border:      rgba(255,255,255,0.07);
    --nb-shadow:      0 1px 0 rgba(255,255,255,0.04), 0 2px 16px rgba(0,0,0,0.4);
    --nb-text:        #f0f6fc;
    --nb-sub:         #7d8590;
    --nb-badge-bg:    rgba(255,255,255,0.06);
    --nb-badge-text:  #8b949e;
    --nb-toggle-bg:   rgba(255,255,255,0.06);
    --nb-toggle-border: rgba(255,255,255,0.1);
    --nb-avatar-ring: rgba(255,255,255,0.12);
    --nb-divider:     rgba(255,255,255,0.06);
  }
  /* Smooth theme transition */
  *, *::before, *::after {
    transition: background-color 0.25s ease, border-color 0.25s ease, color 0.18s ease, box-shadow 0.25s ease;
  }
  /* Dashboard bg adapts */
  [data-theme="dark"] body,
  [data-theme="dark"] #root > div {
    background: #0a0e17 !important;
    color: #f0f6fc;
  }
  [data-theme="dark"] main {
    background: #0a0e17 !important;
  }
`

/* ─── Role pill colors ─────────────────────────────────────────────── */
const ROLE_META = {
  doctor:  { label: 'Doctor',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)'  },
  patient: { label: 'Patient', color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)'  },
  admin:   { label: 'Admin',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)'   },
}

/* ─── Sun icon ─────────────────────────────────────────────────────── */
function SunIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1"  x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1"  y1="12" x2="3"  y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
    </svg>
  )
}

/* ─── Moon icon ────────────────────────────────────────────────────── */
function MoonIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

/* ─── Animated toggle pill ─────────────────────────────────────────── */
function ThemeToggle() {
  const { isDark, toggle } = useTheme()
  const [hovered, setHovered] = useState(false)

  return (
    <>
      <style>{`
        @keyframes nb-sun-spin  { from{transform:rotate(-30deg) scale(0.7);opacity:0} to{transform:rotate(0deg) scale(1);opacity:1} }
        @keyframes nb-moon-drop { from{transform:translateY(-4px) scale(0.7);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
        @keyframes nb-thumb-slide-r { from{transform:translateX(0)} to{transform:translateX(22px)} }
        @keyframes nb-thumb-slide-l { from{transform:translateX(22px)} to{transform:translateX(0)} }
        .nb-theme-toggle { cursor:pointer; display:flex; align-items:center; gap:8px; padding:6px 12px 6px 8px; border-radius:99px; border:1px solid var(--nb-toggle-border); background:var(--nb-toggle-bg); font-family:inherit; font-size:12px; font-weight:600; color:var(--nb-sub); user-select:none; position:relative; overflow:hidden; }
        .nb-theme-toggle::before { content:''; position:absolute; inset:0; border-radius:99px; opacity:0; transition:opacity 0.2s; background:radial-gradient(circle at 50% 50%, rgba(59,130,246,0.12), transparent 70%); }
        .nb-theme-toggle:hover::before { opacity:1; }
        .nb-track { width:36px; height:20px; border-radius:99px; position:relative; flex-shrink:0; transition:background 0.3s ease; }
        .nb-thumb { position:absolute; top:2px; left:2px; width:16px; height:16px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 4px rgba(0,0,0,0.2); transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1), background 0.3s; }
        .nb-icon-wrap { display:flex; align-items:center; justify-content:center; }
      `}</style>

      <button
        className="nb-theme-toggle"
        onClick={toggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {/* Track */}
        <div
          className="nb-track"
          style={{ background: isDark ? '#1d4ed8' : '#e2e8f0' }}
        >
          {/* Thumb */}
          <div
            className="nb-thumb"
            style={{
              transform: isDark ? 'translateX(16px)' : 'translateX(0px)',
              background: isDark ? '#0d1117' : '#fff',
            }}
          >
            <div className="nb-icon-wrap">
              {isDark
                ? <MoonIcon size={9} color="#60a5fa" />
                : <SunIcon  size={9} color="#f59e0b" />
              }
            </div>
          </div>
        </div>

        {/* Label */}
        <span style={{
          color: isDark ? '#60a5fa' : '#64748b',
          letterSpacing: '0.02em',
          fontWeight: 600,
          minWidth: 30,
        }}>
          {isDark ? 'Dark' : 'Light'}
        </span>
      </button>
    </>
  )
}

/* ─── Avatar initials ──────────────────────────────────────────────── */
function Avatar({ name, size = 30 }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color: '#fff',
      flexShrink: 0, boxShadow: '0 0 0 2px var(--nb-avatar-ring)',
      letterSpacing: '-0.02em',
      userSelect: 'none',
    }}>
      {initials}
    </div>
  )
}

/* ═══════════════════════════ NAVBAR ═══════════════════════════════════ */
export default function Navbar({ user, role }) {
  const roleMeta = ROLE_META[role] || ROLE_META.patient

  return (
    <>
      {/* Inject theme CSS once */}
      <style>{THEME_CSS}</style>

      <nav style={{
        position: 'fixed', top: 0, left: 240, right: 0, height: 56,
        zIndex: 100,
        display: 'flex', alignItems: 'center',
        padding: '0 24px',
        justifyContent: 'space-between',
        background: 'var(--nb-bg)',
        borderBottom: '1px solid var(--nb-border)',
        boxShadow: 'var(--nb-shadow)',
      }}>

        {/* ── Left: breadcrumb / page title ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Pulse dot */}
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: roleMeta.color,
            boxShadow: `0 0 0 2px ${roleMeta.bg}`,
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: 14, fontWeight: 600,
            color: 'var(--nb-text)',
            letterSpacing: '-0.01em',
          }}>
            MedRehab
          </span>
          <span style={{ color: 'var(--nb-divider)', fontSize: 18, fontWeight: 300, lineHeight: 1 }}>/</span>
          <span style={{
            fontSize: 13, fontWeight: 500, color: 'var(--nb-sub)',
            textTransform: 'capitalize',
          }}>
            {role} Dashboard
          </span>
        </div>

        {/* ── Right: controls ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Vertical divider */}
          <div style={{ width: 1, height: 22, background: 'var(--nb-border)' }} />

          {/* Role badge */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 99,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: roleMeta.color,
            background: roleMeta.bg,
            border: `1px solid ${roleMeta.border}`,
          }}>
            {roleMeta.label}
          </span>

          {/* Vertical divider */}
          <div style={{ width: 1, height: 22, background: 'var(--nb-border)' }} />

          {/* User info + avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--nb-text)', letterSpacing: '-0.01em' }}>
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </div>
              {user?.email && (
                <div style={{ fontSize: 11, color: 'var(--nb-sub)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              )}
            </div>
            <Avatar name={user?.name || user?.email || 'U'} size={32} />
          </div>
        </div>
      </nav>
    </>
  )
}