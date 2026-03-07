import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

/* ── Role metadata ─────────────────────────────────────────────────────────── */
const ROLE_META = {
  patient: { color: '#0891B2', bg: '#E0F2FE', label: 'Patient',  icon: '🧑‍🦱' },
  doctor:  { color: '#0D9488', bg: '#CCFBF1', label: 'Doctor',   icon: '👨‍⚕️' },
  admin:   { color: '#7C3AED', bg: '#EDE9FE', label: 'Admin',    icon: '🛡️'  },
}

/* ── Nav links per role ────────────────────────────────────────────────────── */
const NAV_LINKS = {
  patient: [{ to: '/patient/dashboard',  label: 'Dashboard' }],
  doctor:  [{ to: '/doctor/dashboard',   label: 'Dashboard' }],
  admin:   [{ to: '/admin/dashboard',    label: 'Dashboard' }],
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location         = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* Close on route change */
  useEffect(() => setMenuOpen(false), [location])

  const role    = user?.role
  const meta    = ROLE_META[role] || {}
  const links   = NAV_LINKS[role] || []
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <header style={S.root}>
      <nav style={S.inner}>

        {/* ── Brand ─────────────────────────────────────────────────────────── */}
        <Link to="/" style={S.brand}>
          <div style={S.brandIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={S.brandText}>RehabMonitor</span>
        </Link>

        {/* ── Centre nav links ───────────────────────────────────────────────── */}
        {user && links.length > 0 && (
          <div style={S.navLinks}>
            {links.map(({ to, label }) => {
              const active = location.pathname.startsWith(to)
              return (
                <Link key={to} to={to}
                  style={{ ...S.navLink, ...(active ? S.navLinkActive : {}) }}>
                  {label}
                  {active && <span style={S.activeBar} />}
                </Link>
              )
            })}
          </div>
        )}

        {/* ── Right side ────────────────────────────────────────────────────── */}
        <div style={S.right}>
          {user ? (
            <>
              {/* Role badge */}
              <span style={{ ...S.roleBadge, color: meta.color, background: meta.bg }}>
                {meta.icon} {meta.label}
              </span>

              {/* Divider */}
              <div style={S.divider} />

              {/* User avatar + dropdown */}
              <div style={{ position: 'relative' }} ref={menuRef}>
                <button
                  style={S.avatarBtn}
                  onClick={() => setMenuOpen(v => !v)}
                  aria-label="User menu"
                  aria-expanded={menuOpen}
                >
                  <div style={S.avatar}>{initials}</div>
                  <div style={S.userInfo}>
                    <span style={S.userName}>{user.name}</span>
                    <span style={S.userEmail}>{user.email}</span>
                  </div>
                  <svg style={{ ...S.chevron, transform: menuOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                    width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9l6 6 6-6" stroke="#94A3B8" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Dropdown menu */}
                {menuOpen && (
                  <div style={S.dropdown}>
                    {/* User card inside dropdown */}
                    <div style={S.dropUser}>
                      <div style={{ ...S.avatar, width: 40, height: 40, fontSize: '.95rem' }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '.875rem', color: '#0F172A' }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: '.75rem', color: '#64748B', marginTop: '.1rem' }}>
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <div style={S.dropDivider} />

                    {/* Menu items */}
                    <DropItem icon={<ProfileIcon />} label="View Profile"   onClick={() => { navigate('/profile'); setMenuOpen(false); }} />
                    <DropItem icon={<SettingsIcon />} label="Settings"    onClick={() => { navigate('/profile/settings'); setMenuOpen(false); }} />
                    {/* you can re-enable help docs here if needed */}

                    <div style={S.dropDivider} />

                    {/* Logout */}
                    <button className="logoutBtn" style={S.logoutBtn} onClick={logout}>
                      <LogoutIcon />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Not logged in */
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <Link to="/login"  style={S.ghostBtn}>Sign in</Link>
              <Link to="/signup" style={S.solidBtn}>Get started</Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}

/* ── Dropdown item ─────────────────────────────────────────────────────────── */
function DropItem({ icon, label, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      className="dropItem"
      style={{ ...S.dropItem, ...(hover ? S.dropItemHover : {}) }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span style={{ color: '#64748B', display: 'flex' }}>{icon}</span>
      {label}
    </button>
  )
}

/* ── Inline SVG icons ──────────────────────────────────────────────────────── */
const ProfileIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)
const SettingsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)
const HelpIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)
const LogoutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

/* ── Styles ─────────────────────────────────────────────────────────────────── */
const S = {
  root: {
    position: 'sticky', top: 0, zIndex: 200,
    background: '#fff',
    borderBottom: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(37,99,235,0.06)',
  },
  inner: {
    maxWidth: 1280, margin: '0 auto',
    height: 64,
    padding: '0 1.5rem',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '1.5rem',
  },

  /* Brand */
  brand: {
    display: 'flex', alignItems: 'center', gap: '.6rem',
    textDecoration: 'none', flexShrink: 0,
  },
  brandIcon: {
    width: 34, height: 34, borderRadius: 9,
    background: 'linear-gradient(135deg, #1D4ED8, #0EA5E9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(37,99,235,.35)',
  },
  brandText: {
    fontSize: '1.05rem', fontWeight: 700, color: '#0F172A',
    letterSpacing: '-.3px',
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  },

  /* Centre links */
  navLinks: { display: 'flex', alignItems: 'center', gap: '.25rem', flex: 1, justifyContent: 'center' },
  navLink: {
    position: 'relative',
    padding: '.45rem .875rem',
    borderRadius: 8,
    fontSize: '.875rem', fontWeight: 500,
    color: '#64748B', textDecoration: 'none',
    transition: 'color .15s, background .15s',
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  },
  navLinkActive: { color: '#2563EB', background: '#EFF6FF', fontWeight: 600 },
  activeBar: {
    position: 'absolute', bottom: -1, left: '50%',
    transform: 'translateX(-50%)',
    width: 20, height: 2, borderRadius: 2,
    background: '#2563EB',
  },

  /* Right cluster */
  right: { display: 'flex', alignItems: 'center', gap: '.875rem', flexShrink: 0 },
  divider: { width: 1, height: 28, background: '#E2E8F0' },

  /* Role badge */
  roleBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '.3rem',
    padding: '.3rem .75rem',
    borderRadius: 20, fontSize: '.75rem', fontWeight: 600,
    textTransform: 'capitalize',
    border: '1px solid transparent',
  },

  /* Avatar button */
  avatarBtn: {
    display: 'flex', alignItems: 'center', gap: '.625rem',
    background: 'none', border: '1px solid #E2E8F0',
    borderRadius: 10, padding: '.35rem .625rem .35rem .35rem',
    cursor: 'pointer', transition: 'border-color .15s, background .15s',
    fontFamily: 'inherit',
  },
  avatar: {
    width: 32, height: 32, borderRadius: 8,
    background: 'linear-gradient(135deg, #2563EB, #0EA5E9)',
    color: '#fff', fontSize: '.78rem', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, letterSpacing: '.5px',
  },
  userInfo: {
    display: 'flex', flexDirection: 'column',
    textAlign: 'left', lineHeight: 1.2,
  },
  userName: {
    fontSize: '.8125rem', fontWeight: 600, color: '#0F172A',
    maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  userEmail: {
    fontSize: '.7rem', color: '#94A3B8',
    maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  chevron: { transition: 'transform .2s', flexShrink: 0 },

  /* Dropdown */
  dropdown: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    width: 240,
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 14,
    boxShadow: '0 4px 6px -2px rgba(0,0,0,0.05), 0 16px 48px -8px rgba(0,0,0,0.12)',
    overflow: 'hidden',
    zIndex: 300,
    animation: 'fadeSlideDown .18s ease',
  },
  dropUser: {
    display: 'flex', alignItems: 'center', gap: '.75rem',
    padding: '1rem',
    background: '#F8FAFC',
  },
  dropDivider: { height: 1, background: '#F1F5F9', margin: '0' },
  dropItem: {
    width: '100%', display: 'flex', alignItems: 'center', gap: '.625rem',
    padding: '.625rem 1rem',
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '.8125rem', color: '#374151', fontWeight: 500,
    textAlign: 'left', fontFamily: 'inherit',
    transition: 'background .12s',
  },
  dropItemHover: { background: '#F8FAFC' },
  logoutBtn: {
    width: '100%', display: 'flex', alignItems: 'center', gap: '.625rem',
    padding: '.625rem 1rem',
    margin: '0', border: 'none',
    background: 'none', cursor: 'pointer',
    fontSize: '.8125rem', color: '#DC2626', fontWeight: 600,
    textAlign: 'left', fontFamily: 'inherit',
    transition: 'background .12s',
  },

  /* Not logged in */
  ghostBtn: {
    padding: '.45rem 1rem', borderRadius: 8,
    border: '1px solid #E2E8F0', background: '#fff',
    color: '#374151', fontSize: '.875rem', fontWeight: 500,
    textDecoration: 'none', transition: 'border-color .15s',
  },
  solidBtn: {
    padding: '.45rem 1rem', borderRadius: 8,
    background: '#2563EB', color: '#fff',
    fontSize: '.875rem', fontWeight: 600,
    textDecoration: 'none',
    boxShadow: '0 2px 8px rgba(37,99,235,.35)',
    transition: 'background .15s',
  },
}