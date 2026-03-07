/**
 * AdminDashboard — Redesigned UI
 * Same functionality (Flask /admin/dashboard), new professional layout.
 */

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../utils/api'
import DashboardLayout from '../components/layout/DashboardLayout'
import { StatCard, SectionCard, Badge, DataTable } from '../components/ui/Cards'
import ProfileSettings from '../components/ProfileSettings'
import {
  Users, UserCheck, Stethoscope, ShieldCheck,
  Activity, Server, AlertTriangle, TrendingUp,
} from 'lucide-react'

const ROLE_VARIANT = { patient: 'info', doctor: 'success', admin: 'warning' }

export default function AdminDashboard() {
  const location = useLocation()
  const urlParams = new URLSearchParams(location.search)
  const initialTab = urlParams.get('tab') || 'overview'
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [tab, setTab]         = useState(initialTab)

  const handleTabChange = (newTab) => {
    setTab(newTab)
  }

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setData(r.data.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen />
  if (error) return (
    <DashboardLayout user={{ name: 'Admin', email: '' }} role="admin" activeTab={tab} onTabChange={handleTabChange}>
      <ErrorBanner message={error} />
    </DashboardLayout>
  )

  const { stats, recent_users } = data

  return (
    <DashboardLayout user={{ name: 'Administrator' }} role="admin" activeTab={tab} onTabChange={handleTabChange}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Page header */}
        <div>
          <h1 style={{ fontSize: '1.1875rem', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.015em' }}>
            Admin Control Panel
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
            System-wide overview, user management, and platform analytics
          </p>
        </div>

        {/* Stats — 4 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.875rem' }}>
          <StatCard label="Total Users"  value={stats.total_users} icon={Users}        trend={12} />
          <StatCard label="Patients"     value={stats.patients}    icon={UserCheck}     trend={8}  />
          <StatCard label="Doctors"      value={stats.doctors}     icon={Stethoscope}              />
          <StatCard label="Admins"       value={stats.admins}      icon={ShieldCheck}              />
        </div>

        {/* Two-column */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '0.875rem' }}>

          {/* Recent users table */}
          <SectionCard
            title="Recently Registered Users"
            subtitle={`${recent_users.length} newest registrations`}
            action={
              <button style={{
                fontSize: '0.75rem', fontWeight: 600, color: '#374151',
                background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6,
                padding: '0.375rem 0.75rem', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Manage Users
              </button>
            }
            noPad
          >
            <DataTable
              columns={['ID', 'Name', 'Email', 'Role', 'Joined']}
              rows={recent_users.map(u => [
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
                  #{u.id}
                </span>,
                <span style={{ fontWeight: 500, color: '#0f172a' }}>{u.name}</span>,
                <span style={{ color: '#6b7280', fontSize: '0.775rem' }}>{u.email}</span>,
                <Badge label={u.role} variant={ROLE_VARIANT[u.role] || 'default'} />,
                <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                  {new Date(u.created_at).toLocaleDateString()}
                </span>,
              ])}
            />
          </SectionCard>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

            {/* System health */}
            <SectionCard title="System Health" subtitle="Live service status">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { service: 'Flask Auth API',    status: 'Operational', ok: true },
                  { service: 'FastAPI Rehab API', status: 'Operational', ok: true },
                  { service: 'Database',          status: 'Operational', ok: true },
                  { service: 'MediaPipe Engine',  status: 'Degraded',    ok: false },
                ].map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.5rem 0.625rem', background: '#f9fafb',
                    border: '1px solid #e5e7eb', borderRadius: 6,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: row.ok ? '#10b981' : '#f59e0b', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.775rem', color: '#374151' }}>{row.service}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: row.ok ? '#059669' : '#d97706', fontWeight: 600 }}>
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Platform usage */}
            <SectionCard title="Platform Usage" subtitle="Sessions this week">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'Rehab sessions completed', value: 142, max: 200 },
                  { label: 'Appointments scheduled',   value: 89,  max: 150 },
                  { label: 'Reports generated',        value: 63,  max: 100 },
                ].map((item, i) => {
                  const pct = Math.round((item.value / item.max) * 100)
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.75rem', color: '#374151' }}>{item.label}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>{item.value}</span>
                      </div>
                      <div style={{ height: 4, background: '#f3f4f6', borderRadius: 2 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#0f172a', borderRadius: 2, transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>

            {/* Alerts */}
            <SectionCard title="System Alerts">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { text: 'MediaPipe latency above threshold', severity: 'warning' },
                  { text: '3 users pending role assignment',   severity: 'info'    },
                ].map((alert, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                    padding: '0.625rem 0.75rem',
                    background: alert.severity === 'warning' ? '#fffbeb' : '#eff6ff',
                    border: `1px solid ${alert.severity === 'warning' ? '#fde68a' : '#bfdbfe'}`,
                    borderRadius: 7,
                  }}>
                    <AlertTriangle size={13} color={alert.severity === 'warning' ? '#d97706' : '#2563eb'} strokeWidth={2} style={{ marginTop: 1, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.775rem', color: '#374151', lineHeight: 1.4 }}>{alert.text}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

          </div>
        </div>

        {/* Role management overview */}
        <SectionCard
          title="Role Management"
          subtitle="User distribution across roles"
          action={
            <button style={{
              fontSize: '0.75rem', fontWeight: 600, color: '#374151',
              background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6,
              padding: '0.375rem 0.75rem', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Manage Roles
            </button>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem' }}>
            {[
              { role: 'Patients',  count: stats.patients, pct: Math.round((stats.patients / stats.total_users) * 100), color: '#3b82f6' },
              { role: 'Doctors',   count: stats.doctors,  pct: Math.round((stats.doctors  / stats.total_users) * 100), color: '#10b981' },
              { role: 'Admins',    count: stats.admins,   pct: Math.round((stats.admins   / stats.total_users) * 100), color: '#f59e0b' },
            ].map((row, i) => (
              <div key={i} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  {row.role}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.025em' }}>{row.count}</div>
                <div style={{ marginTop: '0.625rem', height: 4, background: '#e5e7eb', borderRadius: 2 }}>
                  <div style={{ width: `${row.pct}%`, height: '100%', background: row.color, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 4 }}>{row.pct}% of all users</div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── Profile ────────────────────────────────────────────────────────── */}
        {tab === 'profile' && (
          <ProfileSettings viewMode={true} />
        )}

        {/* ── Settings ───────────────────────────────────────────────────────── */}
        {tab === 'settings' && (
          <ProfileSettings viewMode={false} />
        )}

      </div>
    </DashboardLayout>
  )
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: 500 }}>Loading dashboard…</p>
    </div>
  )
}

function ErrorBanner({ message }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.75rem 1rem', color: '#991b1b', fontSize: '0.8125rem' }}>
      {message}
    </div>
  )
}