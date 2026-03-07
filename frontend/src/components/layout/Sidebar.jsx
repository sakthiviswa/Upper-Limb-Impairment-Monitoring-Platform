/**
 * Sidebar
 * - Only Lucide React icons
 * - No emoji
 * - Standard colors
 * - unreadMessages badge on Messages tab
 *
 * Place at: src/components/layout/Sidebar.jsx
 */

import {
  Activity, Users, Home, Play, Clock, FileText,
  Settings, ChevronRight, Heart, User, MessageSquare,
  BarChart2, Shield,
} from 'lucide-react'

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

export default function Sidebar({
  role = 'patient',
  activeTab,
  onTabChange,
  unreadMessages = 0,
  unreadNotifications = 0,
}) {
  const items = NAV_ITEMS[role] || NAV_ITEMS.patient

  return (
    <aside style={{
      width: 232,
      minHeight: '100vh',
      background: '#fff',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0,
      zIndex: 40,
      fontFamily: "'Sora', sans-serif",
    }}>

      {/* Logo */}
      <div style={{ padding: '1.375rem 1.25rem', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 32, height: 32, background: '#0f172a',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Heart size={15} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
              MedRehab
            </div>
            <div style={{ fontSize: '0.6rem', color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Platform
            </div>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div style={{ padding: '0.625rem 1.25rem', borderBottom: '1px solid #f3f4f6' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
          fontSize: '0.6rem', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: role === 'doctor' ? '#2563eb' : role === 'admin' ? '#7c3aed' : '#16a34a',
          background: role === 'doctor' ? '#eff6ff' : role === 'admin' ? '#faf5ff' : '#f0fdf4',
          border: `1px solid ${role === 'doctor' ? '#bfdbfe' : role === 'admin' ? '#ddd6fe' : '#bbf7d0'}`,
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
      <nav style={{ flex: 1, padding: '0.625rem 0.75rem' }}>
        <div style={{
          fontSize: '0.6rem', fontWeight: 700, color: '#9ca3af',
          letterSpacing: '0.09em', textTransform: 'uppercase',
          padding: '0.5rem 0.5rem 0.375rem',
        }}>
          Navigation
        </div>

        {items.map(item => {
          const Icon     = item.icon
          const isActive = activeTab === item.id
          const badge    = item.id === 'messages' ? unreadMessages : 0

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                width: '100%', padding: '0.5625rem 0.75rem',
                borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#0f172a' : '#6b7280',
                background: isActive ? '#f1f5f9' : 'transparent',
                textAlign: 'left', fontFamily: 'inherit',
                transition: 'background 0.12s, color 0.12s',
                marginBottom: 1,
                position: 'relative',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#374151' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280' } }}
            >
              <Icon
                size={15}
                strokeWidth={isActive ? 2.5 : 1.75}
                color={isActive ? '#0f172a' : '#9ca3af'}
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
              {isActive && <ChevronRight size={12} color="#94a3b8" strokeWidth={2} />}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: '0.675rem', color: '#9ca3af' }}>MedRehab Platform v2.0</div>
      </div>
    </aside>
  )
}