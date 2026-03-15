/**
 * AdminDashboard.jsx — fully theme-aware via CSS variables
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth }     from '../context/AuthContext'
import api             from '../utils/api'
import DashboardLayout from '../components/layout/DashboardLayout'
import ProfileSettings from '../components/ProfileSettings'
import { useToast }    from '../components/ToastProvider'
import {
  Users, Activity, AlertCircle, TrendingUp, TrendingDown, CheckCircle,
  User, Mail, Clock, Database, Cpu,
  CalendarDays, Video, MapPin, RefreshCw, Stethoscope,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────
   LIVE APPOINTMENT HOOK
───────────────────────────────────────────────────────────────────── */
function useLiveAppointments() {
  const [stats,  setStats]  = useState(null)
  const [loaded, setLoaded] = useState(false)

  const fetch = useCallback(() => {
    api.get('/appointments')
      .then(r => {
        const list = r.data.appointments || []
        setStats({
          total:     list.length,
          pending:   list.filter(a => a.status === 'pending').length,
          confirmed: list.filter(a => a.status === 'confirmed').length,
          declined:  list.filter(a => a.status === 'declined').length,
          cancelled: list.filter(a => a.status === 'cancelled').length,
          online:    list.filter(a => a.type === 'online').length,
          offline:   list.filter(a => a.type === 'offline').length,
          recent:    [...list]
            .sort((a, b) => new Date(b.created_at || b.appointment_date) - new Date(a.created_at || a.appointment_date))
            .slice(0, 10),
        })
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { apptStats: stats, apptLoaded: loaded, refetchAppts: fetch }
}

/* ─────────────────────────────────────────────────────────────────────
   ATOMS
───────────────────────────────────────────────────────────────────── */
function Card({ children, style = {}, noPad }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, boxShadow: 'var(--shadow-sm)',
      padding: noPad ? 0 : '1.25rem', overflow: 'hidden', ...style,
    }}>
      {children}
    </div>
  )
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, trend, loading, onClick }) {
  return (
    <Card
      style={{ cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 0.15s' }}
      onClick={onClick}
      onMouseEnter={onClick ? e => e.currentTarget.style.boxShadow = 'var(--shadow-md)' : undefined}
      onMouseLeave={onClick ? e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)' : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: color ? `${color}15` : 'var(--brand-light)',
          border: `1px solid ${color ? `${color}30` : 'var(--brand-border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={17} color={color || 'var(--brand)'} strokeWidth={2} />
        </div>
        {trend != null && (
          <span style={{ fontSize: 11, fontWeight: 700, color: trend >= 0 ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: 3 }}>
            {trend >= 0 ? <TrendingUp size={12} strokeWidth={2.5} /> : <TrendingDown size={12} strokeWidth={2.5} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {loading ? (
        <div style={{ width: 52, height: 28, borderRadius: 6, background: 'var(--border)', marginBottom: 6, animation: 'shimmer 1.2s ease-in-out infinite' }} />
      ) : (
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value ?? '—'}</div>
      )}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, fontWeight: 500 }}>{label}</div>
    </Card>
  )
}

function Badge({ label, variant = 'default' }) {
  const map = {
    success: { color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)' },
    info:    { color: 'var(--brand)',   bg: 'var(--brand-light)', border: 'var(--brand-border)'  },
    warning: { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'var(--warning-border)' },
    danger:  { color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: 'var(--danger-border)'  },
    purple:  { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)' },
    default: { color: 'var(--text-secondary)', bg: 'var(--bg-card2)', border: 'var(--border)' },
  }
  const s = map[variant] || map.default
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />
      {label}
    </span>
  )
}

function MetricBar({ label, value, max, color }) {
  const pct      = Math.min(100, Math.round((value / (max || 1)) * 100))
  const barColor = color || (pct >= 80 ? 'var(--danger)' : pct >= 60 ? 'var(--warning)' : 'var(--success)')
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 99 }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: barColor, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

function DonutRing({ value, max, color, size = 56, stroke = 6 }) {
  const pct  = Math.min(100, max ? Math.round((value / max) * 100) : 0)
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x={size/2} y={size/2 + 5} textAnchor="middle"
        style={{ fontSize: 13, fontWeight: 700, fill: 'var(--text-primary)', fontFamily: 'inherit' }}
      >
        {pct}%
      </text>
    </svg>
  )
}

function SplitBar({ leftLabel, leftVal, rightLabel, rightVal, leftColor, rightColor }) {
  const total   = (leftVal + rightVal) || 1
  const leftPct = Math.round((leftVal / total) * 100)
  return (
    <div>
      <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', gap: 2, marginBottom: 8 }}>
        <div style={{ width: `${leftPct}%`, background: leftColor, borderRadius: '99px 0 0 99px', minWidth: leftVal > 0 ? 4 : 0, transition: 'width 0.5s ease' }} />
        <div style={{ flex: 1, background: rightColor, borderRadius: '0 99px 99px 0', transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
        <span><span style={{ color: leftColor,  fontWeight: 700 }}>{leftVal}</span>  {leftLabel}  ({leftPct}%)</span>
        <span><span style={{ color: rightColor, fontWeight: 700 }}>{rightVal}</span> {rightLabel} ({100 - leftPct}%)</span>
      </div>
    </div>
  )
}

function UserInitials({ name, size = 28 }) {
  const initials = (name || '').split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase() || '?'
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, background: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: 'var(--bg-card)', flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function RefreshBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', boxShadow: 'var(--shadow-sm)' }}>
      <RefreshCw size={13} strokeWidth={2} /> Refresh
    </button>
  )
}

/* ─────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { user }      = useAuth()
  const { showToast } = useToast()

  const [tab,     setTab]     = useState('overview')
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const { apptStats, apptLoaded, refetchAppts } = useLiveAppointments()

  const loadDashboard = useCallback(() => {
    api.get('/admin/dashboard')
      .then(r => {
        const raw = r.data.data
        setData({
          totalUsers:           raw?.stats?.total_users     ?? 0,
          doctors:              raw?.stats?.doctors         ?? 0,
          patients:             raw?.stats?.patients        ?? 0,
          admins:               raw?.stats?.admins          ?? 0,
          activeSessions:       raw?.stats?.active_sessions ?? 0,
          recentUsers:          Array.isArray(raw?.recent_users)  ? raw.recent_users  : [],
          systemAlerts:         Array.isArray(raw?.system_alerts) ? raw.system_alerts : [],
          unread_notifications: raw?.unread_notifications         ?? 0,
        })
      })
      .catch(() => setError('Failed to load admin dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  const d = {
    totalUsers:     data?.totalUsers     ?? 0,
    doctors:        data?.doctors        ?? 0,
    patients:       data?.patients       ?? 0,
    activeSessions: data?.activeSessions ?? 0,
    recentUsers:    data?.recentUsers    ?? [],
    systemAlerts:   data?.systemAlerts   ?? [],
  }

  const totalAppts   = apptStats?.pending    ?? 0
  const unreadNotifs = data?.unread_notifications ?? 0

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (loading) return <LoadingScreen />
  if (error) return (
    <DashboardLayout user={user} role="admin" activeTab={tab} onTabChange={setTab} pendingAppts={totalAppts} unreadNotifs={unreadNotifs}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 10, padding: '12px 16px', color: 'var(--danger)', fontSize: 13 }}>
        <AlertCircle size={15} strokeWidth={2} /> {error}
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout user={user} role="admin" activeTab={tab} onTabChange={setTab} pendingAppts={totalAppts} unreadNotifs={unreadNotifs}>
      <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, fontFamily: "'Sora', sans-serif" }}>

        {/* ══════════════ OVERVIEW ══════════════ */}
        {tab === 'overview' && (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                  {greeting}, {user?.name?.split(' ')[0]}
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <RefreshBtn onClick={() => { loadDashboard(); refetchAppts() }} />
            </div>

            {/* ── 3-stat row: Total Users, Doctors, Patients only ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              <StatCard label="Total Users" value={d.totalUsers} icon={Users}       color="#3b82f6" trend={12} onClick={() => setTab('users')} />
              <StatCard label="Doctors"     value={d.doctors}   icon={Stethoscope} color="#10b981" trend={5}  onClick={() => setTab('users')} />
              <StatCard label="Patients"    value={d.patients}  icon={User}        color="#8b5cf6" trend={18} onClick={() => setTab('users')} />
            </div>

            {/* ── Main grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 316px', gap: 16 }}>

              {/* Recent Users table */}
              <Card noPad>
                <SectionHeader
                  title="Recent Users"
                  subtitle={`${d.recentUsers.length} recently joined`}
                  action={
                    <button onClick={() => setTab('users')} style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)', background: 'var(--brand-light)', border: '1px solid var(--brand-border)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      View All
                    </button>
                  }
                />
                {d.recentUsers.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No users yet.</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr>
                          {['User', 'Role', 'Joined', 'Status'].map(h => (
                            <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', background: 'var(--bg-card2)', borderBottom: '1px solid var(--border-light)', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {d.recentUsers.map((u, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '11px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                <UserInitials name={u.name} />
                                <div>
                                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{u.name}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '11px 16px' }}>
                              <Badge label={u.role} variant={u.role === 'doctor' ? 'info' : u.role === 'patient' ? 'success' : 'warning'} />
                            </td>
                            <td style={{ padding: '11px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
                              {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </td>
                            <td style={{ padding: '11px 16px' }}><Badge label="Active" variant="success" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* User breakdown donut rings */}
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>User Breakdown</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[
                      { label: 'Doctors',  value: d.doctors,  color: '#10b981' },
                      { label: 'Patients', value: d.patients, color: '#8b5cf6' },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <DonutRing value={item.value} max={d.totalUsers} color={item.color} size={54} stroke={6} />
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{item.label} of {d.totalUsers} total</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Appointment breakdown */}
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Appointments</div>
                  {!apptLoaded ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[1,2,3,4].map(i => <div key={i} style={{ height: 11, borderRadius: 4, background: 'var(--border)', animation: 'shimmer 1.2s ease-in-out infinite' }} />)}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                      {[
                        { label: 'Confirmed', value: apptStats?.confirmed ?? 0, color: '#10b981' },
                        { label: 'Pending',   value: apptStats?.pending   ?? 0, color: '#f59e0b' },
                        { label: 'Declined',  value: apptStats?.declined  ?? 0, color: '#ef4444' },
                        { label: 'Cancelled', value: apptStats?.cancelled ?? 0, color: '#6b7280' },
                      ].map(item => {
                        const pct = apptStats?.total ? Math.round((item.value / apptStats.total) * 100) : 0
                        return (
                          <div key={item.label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</span>
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{item.value}</span>
                            </div>
                            <div style={{ height: 5, background: 'var(--border)', borderRadius: 99 }}>
                              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: item.color, transition: 'width 0.5s ease' }} />
                            </div>
                          </div>
                        )
                      })}
                      <div style={{ paddingTop: 10, borderTop: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Type split</div>
                        <SplitBar
                          leftLabel="Online"     leftVal={apptStats?.online  ?? 0} leftColor="#3b82f6"
                          rightLabel="In-Clinic" rightVal={apptStats?.offline ?? 0} rightColor="#8b5cf6"
                        />
                      </div>
                    </div>
                  )}
                </Card>

                {/* System health */}
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>System Health</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <MetricBar label="CPU Usage"      value={34} max={100} color="var(--brand)"  />
                    <MetricBar label="Memory"         value={58} max={100} color="#8b5cf6"        />
                    <MetricBar label="Storage"        value={72} max={100} color="var(--warning)" />
                    <MetricBar label="DB Connections" value={28} max={100} color="#06b6d4"        />
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--success)' }}>
                    <CheckCircle size={12} strokeWidth={2.5} /> All systems operational
                  </div>
                </Card>
              </div>
            </div>

            {/* ── System Alerts ── */}
            {d.systemAlerts.length > 0 && (
              <Card noPad>
                <SectionHeader title="System Alerts" subtitle={`${d.systemAlerts.length} recent alert${d.systemAlerts.length !== 1 ? 's' : ''}`} />
                <div>
                  {d.systemAlerts.map((alert, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < d.systemAlerts.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: alert.severity === 'critical' ? 'var(--danger-bg)' : alert.severity === 'warning' ? 'var(--warning-bg)' : 'var(--brand-light)',
                        border: `1px solid ${alert.severity === 'critical' ? 'var(--danger-border)' : alert.severity === 'warning' ? 'var(--warning-border)' : 'var(--brand-border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <AlertCircle size={14} color={alert.severity === 'critical' ? 'var(--danger)' : alert.severity === 'warning' ? 'var(--warning)' : 'var(--brand)'} strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{alert.message}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(alert.timestamp).toLocaleString()}</div>
                      </div>
                      <Badge label={alert.severity || 'info'} variant={alert.severity === 'critical' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'info'} />
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {/* ══════════════ USERS ══════════════ */}
        {tab === 'users' && (
          <>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>User Management</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>All registered users on the platform</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
              <StatCard label="Total Users" value={d.totalUsers} icon={Users}       color="#3b82f6" />
              <StatCard label="Doctors"     value={d.doctors}   icon={Stethoscope} color="#10b981" />
              <StatCard label="Patients"    value={d.patients}  icon={User}        color="#8b5cf6" />
            </div>

            <Card noPad>
              <SectionHeader title="All Registered Users" subtitle={`${d.totalUsers} total · ${d.recentUsers.length} shown`} />
              {d.recentUsers.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No users found.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        {['User', 'Email', 'Role', 'Joined', 'Status'].map(h => (
                          <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', background: 'var(--bg-card2)', borderBottom: '1px solid var(--border-light)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {d.recentUsers.map((u, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '12px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <UserInitials name={u.name} />
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: 12 }}>{u.email}</td>
                          <td style={{ padding: '12px 20px' }}>
                            <Badge label={u.role} variant={u.role === 'doctor' ? 'info' : u.role === 'patient' ? 'success' : 'warning'} />
                          </td>
                          <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: 12 }}>
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </td>
                          <td style={{ padding: '12px 20px' }}><Badge label="Active" variant="success" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}

        {/* ══════════════ APPOINTMENTS ══════════════ */}
        {tab === 'appointments' && (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Appointments</h1>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Platform-wide appointment overview</p>
              </div>
              <RefreshBtn onClick={refetchAppts} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
              {[
                { label: 'Total',     value: apptStats?.total,     icon: CalendarDays, color: '#f59e0b' },
                { label: 'Confirmed', value: apptStats?.confirmed, icon: CheckCircle,  color: '#10b981' },
                { label: 'Pending',   value: apptStats?.pending,   icon: Clock,        color: '#ef4444' },
                { label: 'Online',    value: apptStats?.online,    icon: Video,        color: '#3b82f6' },
                { label: 'In-Clinic', value: apptStats?.offline,   icon: MapPin,       color: '#8b5cf6' },
              ].map(item => (
                <StatCard key={item.label} label={item.label} value={item.value} icon={item.icon} color={item.color} loading={!apptLoaded} />
              ))}
            </div>

            <Card noPad>
              <SectionHeader title="Recent Appointments" subtitle={`Showing ${(apptStats?.recent || []).length} most recent`} />
              {!apptLoaded ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  <RefreshCw size={18} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <div>Loading…</div>
                </div>
              ) : (apptStats?.recent || []).length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No appointments yet.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        {['Patient', 'Doctor', 'Date', 'Type', 'Duration', 'Status'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', background: 'var(--bg-card2)', borderBottom: '1px solid var(--border-light)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(apptStats?.recent || []).map((a, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '11px 16px', fontWeight: 500, color: 'var(--text-primary)' }}>{a.patient_name || '—'}</td>
                          <td style={{ padding: '11px 16px', color: 'var(--text-secondary)', fontSize: 12 }}>{a.doctor_name  || '—'}</td>
                          <td style={{ padding: '11px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
                            {a.appointment_date ? new Date(a.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </td>
                          <td style={{ padding: '11px 16px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: a.type === 'online' ? '#3b82f6' : '#8b5cf6' }}>
                              {a.type === 'online' ? <Video size={11} strokeWidth={2} /> : <MapPin size={11} strokeWidth={2} />}
                              {a.type === 'online' ? 'Online' : 'In-Clinic'}
                            </span>
                          </td>
                          <td style={{ padding: '11px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={11} strokeWidth={2} /> {a.duration_mins} min
                            </div>
                          </td>
                          <td style={{ padding: '11px 16px' }}>
                            <Badge
                              label={a.status ? (a.status.charAt(0).toUpperCase() + a.status.slice(1)) : '—'}
                              variant={{ confirmed: 'success', pending: 'warning', declined: 'danger', cancelled: 'default' }[a.status] || 'default'}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}

        {/* ══════════════ ACTIVITY ══════════════ */}
        {tab === 'activity' && (
          <>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>System Activity</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Real-time infrastructure metrics and event log</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Card>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Resource Usage</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <MetricBar label="CPU"         value={34} max={100} color="var(--brand)"   />
                  <MetricBar label="RAM"         value={58} max={100} color="#8b5cf6"        />
                  <MetricBar label="Disk"        value={72} max={100} color="var(--warning)" />
                  <MetricBar label="Network I/O" value={41} max={100} color="#06b6d4"        />
                </div>
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--success)' }}>
                  <CheckCircle size={12} strokeWidth={2.5} /> All systems operational
                </div>
              </Card>

              <Card>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Activity Log</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { text: 'New doctor registered',     time: '2 min ago',  Icon: Stethoscope, color: 'var(--brand)'     },
                    { text: 'Rehab session completed',   time: '5 min ago',  Icon: Activity,    color: 'var(--success)'   },
                    { text: 'Appointment confirmed',     time: '9 min ago',  Icon: CalendarDays,color: '#10b981'           },
                    { text: 'Patient care request sent', time: '12 min ago', Icon: Mail,        color: '#8b5cf6'           },
                    { text: 'System backup completed',   time: '1 hr ago',   Icon: Database,    color: 'var(--text-muted)' },
                    { text: 'High memory alert cleared', time: '2 hr ago',   Icon: Cpu,         color: 'var(--warning)'    },
                  ].map((e, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 12, borderBottom: i < 5 ? '1px solid var(--border-light)' : 'none' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${e.color}15`, border: `1px solid ${e.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <e.Icon size={13} color={e.color} strokeWidth={2} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{e.text}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{e.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Live platform numbers strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {[
                { label: 'Registered Doctors',   value: d.doctors,                icon: Stethoscope,  color: '#10b981' },
                { label: 'Registered Patients',  value: d.patients,               icon: User,         color: '#8b5cf6' },
                { label: 'Total Appointments',   value: apptStats?.total  ?? '—', icon: CalendarDays, color: '#f59e0b' },
                { label: 'Pending Appointments', value: apptStats?.pending ?? '—', icon: Clock,        color: '#ef4444' },
              ].map(item => {
                const Icon = item.icon
                return (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: `${item.color}15`, border: `1px solid ${item.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} color={item.color} strokeWidth={2} />
                    </div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{item.label}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {tab === 'profile'  && <ProfileSettings viewMode={true}  />}
        {tab === 'settings' && <ProfileSettings viewMode={false} />}
      </div>
    </DashboardLayout>
  )
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-app)', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Loading admin console…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}