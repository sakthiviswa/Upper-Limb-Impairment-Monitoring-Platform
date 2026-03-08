/**
 * Sidebar.jsx — fully theme-aware via CSS variables
 */

import {
  Activity, Users, Home, Play, Clock, FileText,
  Settings, ChevronRight, Heart, User, MessageSquare,
  BarChart2, Shield,
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const NAV_ITEMS = {
  patient: [
    { id: 'overview',  label: 'Overview',        icon: Home },
    { id: 'monitor',   label: 'Rehab Monitor',   icon: Play },
    { id: 'history',   label: 'Session History', icon: Clock },
    { id: 'messages',  label: 'Messages',        icon: MessageSquare },
    { id: 'profile',   label: 'Profile',         icon: User },
    { id: 'settings',  label: 'Settings',        icon: Settings },
  ],
  doctor: [
    { id: 'overview',  label: 'Overview',        icon: Home },
    { id: 'patients',  label: 'My Patients',     icon: Users },
    { id: 'messages',  label: 'Messages',        icon: MessageSquare },
    { id: 'reports',   label: 'Reports',         icon: FileText },
    { id: 'analytics', label: 'Analytics',       icon: BarChart2 },
    { id: 'profile',   label: 'Profile',         icon: User },
    { id: 'settings',  label: 'Settings',        icon: Settings },
  ],
  admin: [
    { id: 'overview',  label: 'Overview',        icon: Home },
    { id: 'users',     label: 'User Management', icon: Users },
    { id: 'activity',  label: 'System Activity', icon: Activity },
    { id: 'settings',  label: 'Settings',        icon: Settings },
    { id: 'profile',   label: 'Profile',         icon: User },
  ],
}

const ROLE_COLORS = {
  doctor:  { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.2)'  },
  patient: { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)'  },
  admin:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)'   },
}

export default function Sidebar({ role = 'patient', activeTab, onTabChange, unreadMessages = 0 }) {
  const { isDark } = useTheme()
  const items = NAV_ITEMS[role] || NAV_ITEMS.patient
  const roleColor = ROLE_COLORS[role] || ROLE_COLORS.patient

  return (
    <aside style={{
      width: 232,
      minHeight: '100vh',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0,
      zIndex: 40,
      fontFamily: "'Sora', sans-serif",
      boxShadow: isDark ? '1px 0 0 rgba(255,255,255,0.04)' : '1px 0 0 #f1f5f9',
    }}>

      {/* Logo */}
      <div style={{
        padding: '1.25rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '0.625rem',
      }}>
        <div style={{
          width: 34, height: 34,
          background: isDark ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : '#0f172a',
          borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: isDark ? '0 0 12px rgba(59,130,246,0.4)' : 'none',
        }}>
          <Heart size={15} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            MedRehab
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Platform
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div style={{ padding: '0.625rem 1rem', borderBottom: '1px solid var(--border-light)' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
          fontSize: '0.6rem', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: roleColor.color,
          background: roleColor.bg,
          border: `1px solid ${roleColor.border}`,
          borderRadius: 4, padding: '0.25rem 0.5rem',
        }}>
          {role === 'patient'
            ? <><User size={9} strokeWidth={2.5} /> Patient Portal</>
            : role === 'doctor'
            ? <><Activity size={9} strokeWidth={2.5} /> Physician Portal</>
            : <><Shield size={9} strokeWidth={2.5} /> Admin Console</>
          }
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.5rem 0.75rem', overflowY: 'auto' }}>
        <div style={{
          fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)',
          letterSpacing: '0.09em', textTransform: 'uppercase',
          padding: '0.5rem 0.5rem 0.375rem',
        }}>
          Navigation
        </div>

        {items.map(item => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          const badge = item.id === 'messages' ? unreadMessages : 0

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                width: '100%', padding: '0.5625rem 0.75rem',
                borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                textAlign: 'left', fontFamily: 'inherit',
                transition: 'background 0.12s, color 0.12s',
                marginBottom: 2, position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-hover)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--sidebar-text)'
                }
              }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  width: 3, height: 18, borderRadius: 99,
                  background: 'var(--brand)',
                }} />
              )}
              <Icon
                size={15}
                strokeWidth={isActive ? 2.5 : 1.75}
                color={isActive ? 'var(--sidebar-icon-active)' : 'var(--sidebar-icon)'}
                style={{ flexShrink: 0 }}
              />
              <span style={{ flex: 1 }}>{item.label}</span>
              {badge > 0 && (
                <span style={{
                  background: '#dc2626', color: '#fff',
                  borderRadius: 10, padding: '0.05rem 0.35rem',
                  fontSize: '0.6rem', fontWeight: 700, lineHeight: 1.4,
                }}>
                  {badge}
                </span>
              )}
              {isActive && <ChevronRight size={12} color="var(--text-muted)" strokeWidth={2} />}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>MedRehab Platform v2.0</div>
      </div>
    </aside>
  )
}