/**
 * Sidebar.jsx — updated with Appointments nav items
 *
 * Changes:
 *  - Patient: new "Appointments" nav item (CalendarDays icon)
 *  - Doctor:  new "Appointments" nav item (CalendarDays icon)
 *  - Both show a badge when there are pending appointment notifications
 */

import { useState } from 'react'
import {
  Activity, Users, Home, Play, Clock, FileText,
  Settings, ChevronRight, Heart, User, MessageSquare,
  BarChart2, Shield, FlaskConical, ChevronDown, Dumbbell, Pill,
  CalendarDays,
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const NAV_ITEMS = {
  patient: [
    { id: 'overview',      label: 'Overview',        icon: Home          },
    { id: 'monitor',       label: 'Rehab Monitor',   icon: Play          },
    { id: 'history',       label: 'Session History', icon: Clock         },
    { id: 'prescriptions', label: 'Prescriptions',   icon: Pill          },
    { id: 'appointments',  label: 'Appointments',    icon: CalendarDays  },   // ← NEW
    { id: 'messages',      label: 'Messages',        icon: MessageSquare },
    { id: 'profile',       label: 'Profile',         icon: User          },
    { id: 'settings',      label: 'Settings',        icon: Settings      },
  ],
  doctor: [
    { id: 'overview',     label: 'Overview',    icon: Home          },
    { id: 'patients',     label: 'My Patients', icon: Users         },
    { id: 'appointments', label: 'Appointments', icon: CalendarDays  },   // ← NEW
    { id: 'messages',     label: 'Messages',    icon: MessageSquare },
    {
      id: 'analysis_assignment',
      label: 'Analysis & Assignment',
      icon: FlaskConical,
      subItems: [
        { id: 'report_analysis',     label: 'Report Analysis',    icon: BarChart2 },
        { id: 'exercise_assignment', label: 'Exercise Assignment', icon: Dumbbell  },
      ],
    },
    { id: 'profile',  label: 'Profile',  icon: User     },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
  admin: [
    { id: 'overview', label: 'Overview',        icon: Home     },
    { id: 'users',    label: 'User Management', icon: Users    },
    { id: 'activity', label: 'System Activity', icon: Activity },
    { id: 'settings', label: 'Settings',        icon: Settings },
    { id: 'profile',  label: 'Profile',         icon: User     },
  ],
}

const ROLE_META = {
  doctor:  { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', label: 'Physician Portal', Icon: Activity },
  patient: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', label: 'Patient Portal',   Icon: User     },
  admin:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', label: 'Admin Console',    Icon: Shield   },
}

const SUB_IDS = ['report_analysis', 'exercise_assignment']

/**
 * Props:
 *  role              – 'patient' | 'doctor' | 'admin'
 *  activeTab         – current active tab id
 *  onTabChange       – (tabId: string) => void
 *  unreadMessages    – number badge on Messages
 *  pendingAppts      – number badge on Appointments (pending requests for doctor,
 *                      or unread appt notifications for patient)
 */
export default function Sidebar({ role = 'patient', activeTab, onTabChange, unreadMessages = 0, pendingAppts = 0 }) {
  const { isDark } = useTheme()
  const items      = NAV_ITEMS[role] || NAV_ITEMS.patient
  const meta       = ROLE_META[role] || ROLE_META.patient
  const RoleIcon   = meta.Icon
  const [expanded, setExpanded] = useState(SUB_IDS.includes(activeTab))

  const btnStyle = (active) => ({
    display: 'flex', alignItems: 'center', gap: '0.625rem',
    width: '100%', padding: '0.5625rem 0.75rem', borderRadius: 7,
    border: 'none', cursor: 'pointer', fontSize: '0.8125rem',
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
    background: active ? 'var(--sidebar-active-bg)' : 'transparent',
    textAlign: 'left', fontFamily: 'inherit',
    transition: 'background 0.12s, color 0.12s',
    marginBottom: 2, position: 'relative',
  })

  const hoverOn  = (e, active) => { if (!active) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' } }
  const hoverOff = (e, active) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text)' } }

  return (
    <aside style={{
      width: 232, minHeight: '100vh', background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, zIndex: 40,
      fontFamily: "'Sora', sans-serif",
      boxShadow: isDark ? '1px 0 0 rgba(255,255,255,0.04)' : '1px 0 0 #f1f5f9',
    }}>

      {/* Logo */}
      <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: isDark ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : '#0f172a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isDark ? '0 0 12px rgba(59,130,246,0.4)' : 'none',
        }}>
          <Heart size={15} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>MedRehab</div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Platform</div>
        </div>
      </div>

      {/* Role badge */}
      <div style={{ padding: '0.625rem 1rem', borderBottom: '1px solid var(--border-light)' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
          fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`,
          borderRadius: 4, padding: '0.25rem 0.5rem',
        }}>
          <RoleIcon size={9} strokeWidth={2.5} /> {meta.label}
        </span>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0.5rem 0.75rem', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.09em', textTransform: 'uppercase', padding: '0.5rem 0.5rem 0.375rem' }}>
          Navigation
        </div>

        {items.map(item => {
          const Icon          = item.icon
          const hasSubItems   = !!item.subItems
          const isGroupActive = hasSubItems && SUB_IDS.includes(activeTab)
          const isActive      = !hasSubItems && activeTab === item.id

          // badge logic
          let badge = 0
          if (item.id === 'messages')     badge = unreadMessages
          if (item.id === 'appointments') badge = pendingAppts

          /* expandable group */
          if (hasSubItems) return (
            <div key={item.id}>
              <button
                onClick={() => setExpanded(v => !v)}
                style={btnStyle(isGroupActive)}
                onMouseEnter={e => hoverOn(e, isGroupActive)}
                onMouseLeave={e => hoverOff(e, isGroupActive)}
              >
                {isGroupActive && <ActivePill />}
                <Icon size={15} strokeWidth={isGroupActive || expanded ? 2.5 : 1.75} color={isGroupActive || expanded ? 'var(--sidebar-icon-active)' : 'var(--sidebar-icon)'} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                <ChevronDown size={12} color="var(--text-muted)" strokeWidth={2} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
              </button>
              {expanded && (
                <div style={{ marginLeft: 16, paddingLeft: 10, borderLeft: '1px solid var(--border-light)', marginBottom: 4 }}>
                  {item.subItems.map(sub => {
                    const SubIcon = sub.icon
                    const isSub   = activeTab === sub.id
                    return (
                      <button key={sub.id} onClick={() => onTabChange(sub.id)}
                        style={{ ...btnStyle(isSub), fontSize: '0.775rem', marginBottom: 1 }}
                        onMouseEnter={e => hoverOn(e, isSub)}
                        onMouseLeave={e => hoverOff(e, isSub)}
                      >
                        {isSub && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 2, height: 14, borderRadius: 99, background: 'var(--brand)' }} />}
                        <SubIcon size={13} strokeWidth={isSub ? 2.5 : 1.75} color={isSub ? 'var(--sidebar-icon-active)' : 'var(--sidebar-icon)'} style={{ flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{sub.label}</span>
                        {isSub && <ChevronRight size={10} color="var(--text-muted)" strokeWidth={2} />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )

          /* regular item */
          return (
            <button key={item.id} onClick={() => onTabChange(item.id)}
              style={btnStyle(isActive)}
              onMouseEnter={e => hoverOn(e, isActive)}
              onMouseLeave={e => hoverOff(e, isActive)}
            >
              {isActive && <ActivePill />}
              <Icon size={15} strokeWidth={isActive ? 2.5 : 1.75} color={isActive ? 'var(--sidebar-icon-active)' : 'var(--sidebar-icon)'} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {badge > 0 && (
                <span style={{ background: '#dc2626', color: '#fff', borderRadius: 10, padding: '0.05rem 0.35rem', fontSize: '0.6rem', fontWeight: 700, lineHeight: 1.4 }}>
                  {badge}
                </span>
              )}
              {isActive && <ChevronRight size={12} color="var(--text-muted)" strokeWidth={2} />}
            </button>
          )
        })}
      </nav>

      <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>MedRehab Platform v2.0</div>
      </div>
    </aside>
  )
}

function ActivePill() {
  return <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, borderRadius: 99, background: 'var(--brand)' }} />
}