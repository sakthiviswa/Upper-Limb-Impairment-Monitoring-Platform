/**
 * Navbar.jsx
 * - Left side: removed MedRehab text, role dashboard breadcrumb
 * - Right side: avatar is clickable → dropdown with Profile, Settings, Sign Out
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

/* ─── CSS variables ─────────────────────────────────────────────────── */
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
    --nb-dropdown-bg: #ffffff;
    --nb-dropdown-border: #e2e8f0;
    --nb-dropdown-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06);
    --nb-dropdown-hover: #f8fafc;
    --nb-dropdown-danger-hover: #fff1f2;
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
    --nb-dropdown-bg: #161b22;
    --nb-dropdown-border: rgba(255,255,255,0.1);
    --nb-dropdown-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3);
    --nb-dropdown-hover: rgba(255,255,255,0.05);
    --nb-dropdown-danger-hover: rgba(220,38,38,0.1);
  }
  *, *::before, *::after {
    transition: background-color 0.25s ease, border-color 0.25s ease, color 0.18s ease, box-shadow 0.25s ease;
  }
  [data-theme="dark"] body,
  [data-theme="dark"] #root > div {
    background: #0a0e17 !important;
    color: #f0f6fc;
  }
  [data-theme="dark"] main {
    background: #0a0e17 !important;
  }
`

const DROPDOWN_CSS = `
  @keyframes nb-dropdown-in {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)   scale(1);    }
  }
  .nb-dropdown-menu {
    animation: nb-dropdown-in 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .nb-dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px 14px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    text-align: left;
    border-radius: 6px;
    transition: background 0.12s ease, color 0.12s ease;
  }
  .nb-dropdown-item:hover {
    background: var(--nb-dropdown-hover);
  }
  .nb-dropdown-item.danger {
    color: #ef4444;
  }
  .nb-dropdown-item.danger:hover {
    background: var(--nb-dropdown-danger-hover);
  }
  .nb-avatar-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 6px;
    border-radius: 8px;
    transition: background 0.15s ease;
    font-family: inherit;
  }
  .nb-avatar-btn:hover {
    background: var(--nb-dropdown-hover);
  }
`

/* ─── Role pill ────────────────────────────────────────────────────── */
const ROLE_META = {
  doctor:  { label: 'Doctor',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)'  },
  patient: { label: 'Patient', color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)'  },
  admin:   { label: 'Admin',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)'   },
}

/* ─── Icons ─────────────────────────────────────────────────────────── */
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

function MoonIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function UserIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function SettingsIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

function LogOutIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

function ChevronDownIcon({ size = 12, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

/* ─── Theme toggle ──────────────────────────────────────────────────── */
function ThemeToggle() {
  const { isDark, toggle } = useTheme()
  const [hovered, setHovered] = useState(false)

  return (
    <>
      <style>{`
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
        <div className="nb-track" style={{ background: isDark ? '#1d4ed8' : '#e2e8f0' }}>
          <div className="nb-thumb" style={{
            transform: isDark ? 'translateX(16px)' : 'translateX(0px)',
            background: isDark ? '#0d1117' : '#fff',
          }}>
            <div className="nb-icon-wrap">
              {isDark ? <MoonIcon size={9} color="#60a5fa" /> : <SunIcon size={9} color="#f59e0b" />}
            </div>
          </div>
        </div>
        <span style={{ color: isDark ? '#60a5fa' : '#64748b', letterSpacing: '0.02em', fontWeight: 600, minWidth: 30 }}>
          {isDark ? 'Dark' : 'Light'}
        </span>
      </button>
    </>
  )
}

/* ─── Avatar ────────────────────────────────────────────────────────── */
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
      letterSpacing: '-0.02em', userSelect: 'none',
    }}>
      {initials}
    </div>
  )
}

/* ─── Profile Dropdown ──────────────────────────────────────────────── */
function ProfileDropdown({ user, role, onSignOut }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { isDark } = useTheme()
  const navigate = useNavigate()

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const displayName = user?.name || user?.email?.split('@')[0] || 'User'

  // Navigate to /{role}/dashboard?tab=profile (or settings)
  // Also fires a custom event so the already-mounted dashboard updates
  // its tab state without needing a full page remount.
  const handleItem = (tab) => {
    setOpen(false)
    navigate(`/${role}/dashboard?tab=${tab}`)
    window.dispatchEvent(new CustomEvent('navbar:tabchange', { detail: { tab } }))
  }

  // Sign out → /login
  const handleSignOut = () => {
    setOpen(false)
    if (onSignOut) onSignOut()
    navigate('/login')
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="nb-avatar-btn"
        onClick={() => setOpen(v => !v)}
        aria-label="Open profile menu"
      >
        <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--nb-text)', letterSpacing: '-0.01em' }}>
            {displayName}
          </div>
          {user?.email && (
            <div style={{ fontSize: 11, color: 'var(--nb-sub)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          )}
        </div>
        <Avatar name={user?.name || user?.email || 'U'} size={32} />
        <div style={{ marginLeft: 2, color: 'var(--nb-sub)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <ChevronDownIcon size={12} color="var(--nb-sub)" />
        </div>
      </button>

      {open && (
        <div
          className="nb-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            minWidth: 200,
            background: 'var(--nb-dropdown-bg)',
            border: '1px solid var(--nb-dropdown-border)',
            borderRadius: 10,
            boxShadow: 'var(--nb-dropdown-shadow)',
            padding: '6px',
            zIndex: 200,
          }}
        >
          {/* User info header */}
          <div style={{
            padding: '8px 12px 10px',
            borderBottom: '1px solid var(--nb-divider)',
            marginBottom: 4,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--nb-text)' }}>{displayName}</div>
            {user?.email && (
              <div style={{ fontSize: 11, color: 'var(--nb-sub)', marginTop: 1 }}>{user.email}</div>
            )}
          </div>

          {/* Profile */}
          <button
            className="nb-dropdown-item"
            onClick={() => handleItem('profile')}
            style={{ color: 'var(--nb-text)' }}
          >
            <UserIcon size={14} color="var(--nb-sub)" />
            Profile
          </button>

          {/* Settings */}
          <button
            className="nb-dropdown-item"
            onClick={() => handleItem('settings')}
            style={{ color: 'var(--nb-text)' }}
          >
            <SettingsIcon size={14} color="var(--nb-sub)" />
            Settings
          </button>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--nb-divider)', margin: '4px 0' }} />

          {/* Sign out */}
          <button
            className="nb-dropdown-item danger"
            onClick={handleSignOut}
          >
            <LogOutIcon size={14} color="#ef4444" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════ NAVBAR ═══════════════════════════════════
 * Props:
 *   user      – { name, email }
 *   role      – 'patient' | 'doctor' | 'admin'
 *   onSignOut – () => void  — optional cleanup (e.g. clear localStorage) before /login redirect
 *
 * Profile → navigates to /{role}/dashboard?tab=profile  + fires navbar:tabchange event
 * Settings → navigates to /{role}/dashboard?tab=settings + fires navbar:tabchange event
 * Sign Out → calls onSignOut() then navigates to /login
 */
export default function Navbar({ user, role, onSignOut }) {
  const roleMeta = ROLE_META[role] || ROLE_META.patient

  return (
    <>
      <style>{THEME_CSS}</style>
      <style>{DROPDOWN_CSS}</style>

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

        {/* ── Left: role badge only ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
        </div>

        {/* ── Right: toggle + profile dropdown ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Vertical divider */}
          <div style={{ width: 1, height: 22, background: 'var(--nb-border)' }} />

          {/* Profile dropdown */}
          <ProfileDropdown user={user} role={role} onSignOut={onSignOut} />
        </div>
      </nav>
    </>
  )
}