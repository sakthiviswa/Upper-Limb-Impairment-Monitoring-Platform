/**
 * Navbar — sticky top bar with search, notifications, profile
 */
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, Settings, LogOut, User, Menu, Sun, Moon,
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useLayout } from '../../context/LayoutContext'
import { Avatar, SearchBar } from '../ui'

const ROLE_LABELS = {
  doctor: 'Doctor Dashboard',
  patient: 'Patient Dashboard',
  admin: 'Admin Dashboard',
}

function ThemeToggle() {
  const { isDark, toggle } = useTheme()
  return (
    <button
      className="app-navbar__icon-btn"
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}

function ProfileDropdown({ user, role, onSignOut, onNotifications }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const displayName = user?.name || user?.email?.split('@')[0] || 'User'

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleItem = (tab) => {
    setOpen(false)
    navigate(`/${role}/dashboard?tab=${tab}`)
    window.dispatchEvent(new CustomEvent('navbar:tabchange', { detail: { tab } }))
  }

  const handleSignOut = () => {
    setOpen(false)
    onSignOut?.()
    navigate('/login')
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="app-navbar__profile-btn"
        onClick={() => setOpen(v => !v)}
        aria-label="Open profile menu"
        aria-expanded={open}
      >
        <Avatar name={user?.name || user?.email || 'U'} size={36} />
        <div className="app-navbar__profile-info">
          <div className="app-navbar__profile-name">{displayName}</div>
          {user?.email && <div className="app-navbar__profile-email">{user.email}</div>}
        </div>
      </button>

      {open && (
        <div className="app-navbar__dropdown" role="menu">
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-light)', marginBottom: 4 }}>
            <div className="text-heading" style={{ fontSize: 14 }}>{displayName}</div>
            {user?.email && <div className="text-caption">{user.email}</div>}
          </div>
          <button className="app-navbar__dropdown-item" onClick={() => handleItem('profile')} role="menuitem">
            <User size={18} /> Profile
          </button>
          <button className="app-navbar__dropdown-item" onClick={() => handleItem('settings')} role="menuitem">
            <Settings size={18} /> Settings
          </button>
          <button className="app-navbar__dropdown-item" onClick={onNotifications} role="menuitem">
            <Bell size={18} /> Notifications
          </button>
          <div style={{ height: 1, background: 'var(--border-light)', margin: '4px 0' }} />
          <button className="app-navbar__dropdown-item app-navbar__dropdown-item--danger" onClick={handleSignOut} role="menuitem">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

export default function Navbar({
  user,
  role,
  onSignOut,
  unreadNotifs = 0,
  onNotifications,
  searchValue = '',
  onSearchChange,
}) {
  const { collapsed, toggleMobile } = useLayout()
  const sidebarWidth = collapsed
    ? 'var(--sidebar-collapsed-width)'
    : 'var(--sidebar-width)'

  return (
    <header
      className="app-navbar"
      style={{ left: sidebarWidth }}
    >
      <div className="app-navbar__inner">
        <div className="app-navbar__left">
          <button
            className="app-navbar__menu-btn"
            onClick={toggleMobile}
            aria-label="Toggle navigation menu"
          >
            <Menu size={22} />
          </button>
          <div className="text-secondary" style={{ fontWeight: 600, fontSize: 14 }}>
            {ROLE_LABELS[role] || 'Dashboard'}
          </div>
        </div>

        <div className="app-navbar__center">
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            placeholder="Search patients, sessions, reports…"
          />
        </div>

        <div className="app-navbar__right">
          <button
            className="app-navbar__icon-btn"
            onClick={onNotifications}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadNotifs > 0 && <span className="app-navbar__notif-dot" />}
          </button>

          <button
            className="app-navbar__icon-btn"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('navbar:tabchange', { detail: { tab: 'settings' } }))
            }}
            title="Settings"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>

          <ThemeToggle />

          <div className="app-navbar__divider" />

          <ProfileDropdown
            user={user}
            role={role}
            onSignOut={onSignOut}
            onNotifications={onNotifications}
          />
        </div>
      </div>
    </header>
  )
}
