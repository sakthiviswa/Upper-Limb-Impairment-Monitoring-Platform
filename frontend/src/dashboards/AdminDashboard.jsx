/**
 * AdminDashboard.jsx — fully theme-aware via CSS variables
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import DashboardLayout from '../components/layout/DashboardLayout'
import ProfileSettings from '../components/ProfileSettings'
import { useToast } from '../components/ToastProvider'
import {
  Users, Activity, Shield, BarChart2,
  AlertCircle, TrendingUp, CheckCircle,
  User, Mail, Calendar, Clock, Server,
  Database, Cpu, HardDrive,
} from 'lucide-react'

/* ── Atoms ─────────────────────────────────────────────────────────── */

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

function StatCard({ label, value, icon: Icon, color, trend }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: color ? `${color}15` : 'var(--brand-light)',
          border: `1px solid ${color ? `${color}30` : 'var(--brand-border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={17} color={color || 'var(--brand)'} strokeWidth={2} />
        </div>
        {trend != null && (
          <span style={{ fontSize: 11, fontWeight: 700, color: trend >= 0 ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <TrendingUp size={12} strokeWidth={2.5} style={{ transform: trend < 0 ? 'scaleY(-1)' : 'none' }} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, fontWeight: 500 }}>{label}</div>
    </Card>
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

function Table({ columns, rows }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', background: 'var(--bg-card2)', borderBottom: '1px solid var(--border-light)', whiteSpace: 'nowrap' }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Badge({ label, variant = 'default' }) {
  const map = {
    success: { color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)' },
    info:    { color: 'var(--brand)',   bg: 'var(--brand-light)', border: 'var(--brand-border)'  },
    warning: { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'var(--warning-border)' },
    danger:  { color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: 'var(--danger-border)'  },
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
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
      </div>
      <div style={{ height: 5, background: 'var(--border)', borderRadius: 99 }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: color || 'var(--brand)', transition: 'width 0.4s' }} />
      </div>
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────────────── */

export default function AdminDashboard() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [tab, setTab]     = useState('overview')
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setData(r.data.data))
      .catch(() => setError('Failed to load admin dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen />

  if (error) return (
    <DashboardLayout user={user} role="admin" activeTab={tab} onTabChange={setTab}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 10, padding: '12px 16px', color: 'var(--danger)', fontSize: 13 }}>
        <AlertCircle size={15} strokeWidth={2} /> {error}
      </div>
    </DashboardLayout>
  )

  const fallback = data || { totalUsers: 0, doctors: 0, patients: 0, activeSessions: 0, recentUsers: [], systemAlerts: [] }

  return (
    <DashboardLayout user={user} role="admin" activeTab={tab} onTabChange={setTab}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'Sora', sans-serif" }}>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Admin Console</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              <StatCard label="Total Users"      value={fallback.totalUsers}      icon={Users}    color="#3b82f6" trend={12} />
              <StatCard label="Doctors"          value={fallback.doctors}         icon={Activity} color="#10b981" trend={5}  />
              <StatCard label="Patients"         value={fallback.patients}        icon={User}     color="#8b5cf6" trend={18} />
              <StatCard label="Active Sessions"  value={fallback.activeSessions}  icon={Server}   color="#f59e0b" trend={-3} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14 }}>
              {/* Recent users table */}
              <Card noPad>
                <SectionHeader title="Recent Users" subtitle={`${fallback.recentUsers.length} recently joined`} />
                <Table
                  columns={['Name', 'Email', 'Role', 'Joined', 'Status']}
                  rows={(fallback.recentUsers || []).map(u => [
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--bg-card)', flexShrink: 0 }}>
                        {(u.name || '').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() || '?'}
                      </div>
                      {u.name}
                    </span>,
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.email}</span>,
                    <Badge label={u.role} variant={u.role === 'doctor' ? 'info' : u.role === 'patient' ? 'success' : 'warning'} />,
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</span>,
                    <Badge label="Active" variant="success" />,
                  ])}
                />
              </Card>

              {/* Right panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* System health */}
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>System Health</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <MetricBar label="CPU Usage"     value={34} max={100} color="var(--brand)"   />
                    <MetricBar label="Memory"        value={58} max={100} color="var(--success)"  />
                    <MetricBar label="Storage"       value={72} max={100} color="var(--warning)"  />
                    <MetricBar label="DB Connections" value={28} max={100} color="#8b5cf6"        />
                  </div>
                  <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--success)' }}>
                    <CheckCircle size={12} strokeWidth={2.5} /> All systems operational
                  </div>
                </Card>

                {/* Quick stats */}
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Platform Summary</div>
                  {[
                    { label: 'Rehab Sessions Today', value: '24',     icon: Activity  },
                    { label: 'Pending Approvals',     value: '7',      icon: Clock     },
                    { label: 'Avg Session Duration',  value: '28 min', icon: Calendar  },
                    { label: 'Uptime',                value: '99.9%',  icon: Server    },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--border-light)' : 'none' }}>
                      <item.icon size={13} color="var(--text-muted)" strokeWidth={2} />
                      <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{item.value}</span>
                    </div>
                  ))}
                </Card>
              </div>
            </div>

            {/* System alerts */}
            {fallback.systemAlerts?.length > 0 && (
              <Card noPad>
                <SectionHeader title="System Alerts" subtitle={`${fallback.systemAlerts.length} recent alerts`} />
                <div>
                  {fallback.systemAlerts.map((alert, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderBottom: i < fallback.systemAlerts.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      <AlertCircle size={14} color={alert.severity === 'critical' ? 'var(--danger)' : alert.severity === 'warning' ? 'var(--warning)' : 'var(--brand)'} strokeWidth={2} />
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

        {/* ── USERS ── */}
        {tab === 'users' && (
          <>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>User Management</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>All registered users on the platform</p>
            </div>
            <Card noPad>
              <SectionHeader title="All Users" subtitle={`${fallback.totalUsers} total`} />
              <Table
                columns={['User', 'Email', 'Role', 'Joined', 'Status']}
                rows={(fallback.recentUsers || []).map(u => [
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</span>,
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.email}</span>,
                  <Badge label={u.role} variant={u.role === 'doctor' ? 'info' : 'success'} />,
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</span>,
                  <Badge label="Active" variant="success" />,
                ])}
              />
            </Card>
          </>
        )}

        {/* ── ACTIVITY ── */}
        {tab === 'activity' && (
          <>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>System Activity</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Real-time system metrics and logs</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Card>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Resource Usage</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <MetricBar label="CPU"          value={34} max={100} color="var(--brand)"   />
                  <MetricBar label="RAM"          value={58} max={100} color="var(--success)"  />
                  <MetricBar label="Disk"         value={72} max={100} color="var(--warning)"  />
                  <MetricBar label="Network I/O"  value={41} max={100} color="#8b5cf6"         />
                </div>
              </Card>
              <Card>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Activity Log</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { text: 'New doctor registered', time: '2 min ago', icon: User, color: 'var(--brand)' },
                    { text: 'Rehab session completed', time: '5 min ago', icon: Activity, color: 'var(--success)' },
                    { text: 'Patient care request sent', time: '12 min ago', icon: Mail, color: '#8b5cf6' },
                    { text: 'System backup completed', time: '1 hr ago', icon: Database, color: 'var(--text-muted)' },
                    { text: 'High memory alert cleared', time: '2 hr ago', icon: Cpu, color: 'var(--warning)' },
                  ].map((e, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, paddingBottom: 12, borderBottom: i < 4 ? '1px solid var(--border-light)' : 'none' }}>
                      <e.icon size={13} color={e.color} strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{e.text}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{e.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}

        {tab === 'profile'  && <ProfileSettings viewMode={true} />}
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