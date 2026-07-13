/**
 * Sidebar — collapsible role-based navigation
 */
import { useState } from 'react'
import {
  Activity, Users, Home, Play, Clock,
  Settings, ChevronRight, Layers, User, MessageSquare,
  BarChart2, Shield, FlaskConical, ChevronDown, Dumbbell, Pill,
  CalendarDays, PanelLeftClose, PanelLeft,
} from 'lucide-react'
import { useLayout } from '../../context/LayoutContext'

const NAV_ITEMS = {
  patient: [
    { id: 'overview',      label: 'Overview',        icon: Home          },
    { id: 'monitor',       label: 'Rehab Monitor',   icon: Play          },
    { id: 'history',       label: 'Session History', icon: Clock         },
    { id: 'prescriptions', label: 'Prescriptions',   icon: Pill          },
    { id: 'appointments',  label: 'Appointments',    icon: CalendarDays  },
    { id: 'messages',      label: 'Messages',        icon: MessageSquare },
    { id: 'profile',       label: 'Profile',         icon: User          },
    { id: 'settings',      label: 'Settings',        icon: Settings      },
  ],
  doctor: [
    { id: 'overview',     label: 'Overview',    icon: Home          },
    { id: 'patients',     label: 'My Patients', icon: Users         },
    { id: 'appointments', label: 'Appointments', icon: CalendarDays  },
    { id: 'messages',     label: 'Messages',    icon: MessageSquare },
    { id: 'verification', label: 'Verification', icon: Shield       },
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
    { id: 'overview',     label: 'Overview',        icon: Home         },
    { id: 'users',        label: 'User Management', icon: Users        },
    { id: 'appointments', label: 'Appointments',    icon: CalendarDays },
    { id: 'activity',     label: 'System Activity', icon: Activity     },
    { id: 'settings',     label: 'Settings',        icon: Settings     },
    { id: 'profile',      label: 'Profile',         icon: User         },
  ],
}

const ROLE_META = {
  doctor:  { label: 'Physician Portal', Icon: Activity },
  patient: { label: 'Patient Portal',   Icon: User     },
  admin:   { label: 'Admin Console',    Icon: Shield   },
}

const SUB_IDS = ['report_analysis', 'exercise_assignment']

export default function Sidebar({
  role = 'patient',
  activeTab,
  onTabChange,
  unreadMessages = 0,
  pendingAppts = 0,
  unreadNotifs = 0,
}) {
  const { collapsed, mobileOpen, toggleCollapsed, closeMobile } = useLayout()
  const items = NAV_ITEMS[role] || NAV_ITEMS.patient
  const meta = ROLE_META[role] || ROLE_META.patient
  const RoleIcon = meta.Icon
  const [expanded, setExpanded] = useState(SUB_IDS.includes(activeTab))

  const handleNav = (tabId) => {
    onTabChange(tabId)
    closeMobile()
  }

  const sidebarClass = [
    'app-sidebar',
    collapsed ? 'app-sidebar--collapsed' : '',
    mobileOpen ? 'app-sidebar--mobile-open' : '',
  ].filter(Boolean).join(' ')

  return (
    <>
      <div
        className={`app-sidebar-overlay ${mobileOpen ? 'app-sidebar-overlay--visible' : ''}`}
        onClick={closeMobile}
        aria-hidden="true"
      />
      <aside className={sidebarClass}>
        <button
          className="app-sidebar__logo"
          onClick={() => handleNav('overview')}
          title="Go to Dashboard"
          aria-label="Go to Dashboard"
        >
          <div className="app-sidebar__logo-icon">
            <Layers size={22} strokeWidth={2} />
          </div>
          {!collapsed && (
            <div className="app-sidebar__logo-text">
              <div className="app-sidebar__logo-title">RehabMonitor</div>
              <div className="app-sidebar__logo-sub">Upper Limb Recovery</div>
            </div>
          )}
        </button>

        {!collapsed && (
          <div className="app-sidebar__role">
            <span className="ui-badge ui-badge--brand">
              <RoleIcon size={12} strokeWidth={2.5} />
              {meta.label}
            </span>
          </div>
        )}

        <nav className="app-sidebar__nav" aria-label="Main navigation">
          {!collapsed && (
            <div className="app-sidebar__section-label">Navigation</div>
          )}

          {items.map(item => {
            const Icon = item.icon
            const hasSubItems = !!item.subItems
            const isGroupActive = hasSubItems && SUB_IDS.includes(activeTab)
            const isActive = !hasSubItems && activeTab === item.id

            let badge = 0
            if (item.id === 'messages') badge = unreadMessages
            if (item.id === 'appointments') badge = pendingAppts
            if (item.id === 'activity') badge = unreadNotifs

            if (hasSubItems) {
              return (
                <div key={item.id}>
                  <button
                    className={`app-sidebar__item ${isGroupActive ? 'app-sidebar__item--active' : ''}`}
                    onClick={() => !collapsed && setExpanded(v => !v)}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="app-sidebar__item-icon">
                      <Icon size={24} strokeWidth={isGroupActive || expanded ? 2.5 : 2} />
                    </span>
                    {!collapsed && (
                      <>
                        <span className="app-sidebar__item-label">{item.label}</span>
                        <ChevronDown
                          size={16}
                          style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }}
                        />
                      </>
                    )}
                  </button>
                  {!collapsed && expanded && (
                    <div className="app-sidebar__sub">
                      {item.subItems.map(sub => {
                        const SubIcon = sub.icon
                        const isSub = activeTab === sub.id
                        return (
                          <button
                            key={sub.id}
                            className={`app-sidebar__item ${isSub ? 'app-sidebar__item--active' : ''}`}
                            onClick={() => handleNav(sub.id)}
                          >
                            <span className="app-sidebar__item-icon">
                              <SubIcon size={20} strokeWidth={isSub ? 2.5 : 2} />
                            </span>
                            <span className="app-sidebar__item-label">{sub.label}</span>
                            {isSub && <ChevronRight size={14} />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <button
                key={item.id}
                className={`app-sidebar__item ${isActive ? 'app-sidebar__item--active' : ''}`}
                onClick={() => handleNav(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <span className="app-sidebar__item-icon">
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </span>
                {!collapsed && (
                  <>
                    <span className="app-sidebar__item-label">{item.label}</span>
                    {badge > 0 && <span className="app-sidebar__badge">{badge}</span>}
                    {isActive && <ChevronRight size={14} />}
                  </>
                )}
                {collapsed && badge > 0 && (
                  <span className="app-sidebar__badge" style={{ position: 'absolute', top: 6, right: 6, padding: '0 5px' }}>
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="app-sidebar__footer">
          {!collapsed && (
            <div className="text-caption" style={{ marginBottom: 12 }}>
              MedRehab Platform v2.0
            </div>
          )}
          <button
            className="app-sidebar__collapse-btn"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>
      </aside>
    </>
  )
}
