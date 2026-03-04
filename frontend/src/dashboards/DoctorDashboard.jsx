/**
 * DoctorDashboard — with patient request notifications + accept/decline
 * All original functionality preserved; added Notifications tab and pending patients panel.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import DashboardLayout from '../components/layout/DashboardLayout'
import { StatCard, SectionCard, Badge, DataTable } from '../components/ui/Cards'
import NotificationsPanel from '../components/NotificationsPanel'
import {
  Users, ClipboardList, Activity, CheckCircle, MessageSquare,
  Bell, AlertCircle, UserPlus,
} from 'lucide-react'

const TYPE_VARIANT = {
  'Check-up':     'success',
  'Follow-up':    'info',
  'Consultation': 'purple',
}

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [data, setData]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [tab, setTab]               = useState('overview')
  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingPatients, setPendingPatients] = useState([])
  const [acting, setActing]         = useState({})

  useEffect(() => {
    api.get('/doctor/dashboard')
      .then(r => {
        setData(r.data.data)
        setUnreadCount(r.data.data.unread_notifications || 0)
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (tab === 'patients') {
      api.get('/doctor/pending-patients')
        .then(r => setPendingPatients(r.data.patients || []))
        .catch(console.error)
    }
  }, [tab])

  const handleAccept = async (patientId, patientName) => {
    setActing(prev => ({ ...prev, [patientId]: 'accepting' }))
    try {
      await api.post(`/doctor/accept-patient/${patientId}`)
      setPendingPatients(prev => prev.filter(p => p.id !== patientId))
      setData(prev => prev ? { ...prev, today_patients: (prev.today_patients || 0) + 1, pending_reviews: Math.max(0, (prev.pending_reviews || 1) - 1) } : prev)
      alert(`✅ You have accepted ${patientName} as your patient.`)
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to accept patient.')
    } finally {
      setActing(prev => ({ ...prev, [patientId]: null }))
    }
  }

  const handleDecline = async (patientId, patientName) => {
    setActing(prev => ({ ...prev, [patientId]: 'declining' }))
    try {
      await api.post(`/doctor/decline-patient/${patientId}`)
      setPendingPatients(prev => prev.filter(p => p.id !== patientId))
      alert(`Patient ${patientName} has been declined.`)
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to decline patient.')
    } finally {
      setActing(prev => ({ ...prev, [patientId]: null }))
    }
  }

  if (loading) return <LoadingScreen />
  if (error) return (
    <DashboardLayout user={user} role="doctor" activeTab={tab} onTabChange={setTab}>
      <ErrorBanner message={error} />
    </DashboardLayout>
  )

  return (
    <DashboardLayout user={user} role="doctor" activeTab={tab} onTabChange={setTab}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Overview ────────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <>
            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h1 style={{ fontSize: '1.1875rem', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.015em' }}>
                  Physician Overview
                </h1>
                <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <button
                  onClick={() => setTab('patients')}
                  style={{
                    position: 'relative',
                    background: '#fff', border: '1px solid #e5e7eb',
                    borderRadius: 8, padding: '0.5rem 0.875rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem',
                    fontSize: '0.8125rem', color: '#374151',
                  }}
                >
                  <UserPlus size={14} />
                  Patient Requests
                  {data?.pending_reviews > 0 && (
                    <span style={{ background: '#ef4444', color: '#fff', borderRadius: 10, padding: '0.05rem 0.35rem', fontSize: '0.65rem', fontWeight: 700 }}>
                      {data.pending_reviews}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setTab('notifications')}
                  style={{
                    position: 'relative',
                    background: '#fff', border: '1px solid #e5e7eb',
                    borderRadius: 8, padding: '0.5rem 0.75rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem',
                    fontSize: '0.8125rem', color: '#374151',
                  }}
                >
                  <Bell size={14} />
                  {unreadCount > 0 && (
                    <span style={{ background: '#ef4444', color: '#fff', borderRadius: 10, padding: '0.05rem 0.35rem', fontSize: '0.65rem', fontWeight: 700 }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem' }}>
              <StatCard label="My Patients"        value={data.today_patients}   icon={Users} />
              <StatCard label="Pending Requests"   value={data.pending_reviews}  icon={ClipboardList} trend={-5} />
              <StatCard label="Scheduled Sessions" value={data.schedule.length}  icon={Activity} />
            </div>

            {/* Two-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '0.875rem' }}>
              <SectionCard title="Today's Schedule" subtitle={`${data.schedule.length} appointments`} noPad>
                <DataTable
                  columns={['Time', 'Patient', 'Appointment Type']}
                  rows={data.schedule.map((s) => [
                    <span style={{ fontWeight: 600, color: '#0f172a', fontVariantNumeric: 'tabular-nums', fontSize: '0.8125rem' }}>{s.time}</span>,
                    <span style={{ fontWeight: 500, color: '#374151' }}>{s.patient}</span>,
                    <Badge label={s.type} variant={TYPE_VARIANT[s.type] || 'default'} />,
                  ])}
                />
              </SectionCard>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <SectionCard title="Pending Actions" subtitle="Requires your review">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {[
                      { label: 'Patient requests',          count: data.pending_reviews, icon: UserPlus,      variant: 'warning', onClick: () => setTab('patients') },
                      { label: 'Patient feedback requests', count: 2,                    icon: MessageSquare, variant: 'info' },
                      { label: 'Sessions to approve',       count: 1,                    icon: CheckCircle,   variant: 'default' },
                    ].map((item, i) => {
                      const Icon = item.icon
                      return (
                        <div
                          key={i}
                          onClick={item.onClick}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.625rem 0.75rem',
                            background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 7,
                            cursor: item.onClick ? 'pointer' : 'default',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Icon size={13} color="#6b7280" strokeWidth={1.75} />
                            <span style={{ fontSize: '0.775rem', color: '#374151' }}>{item.label}</span>
                          </div>
                          <Badge label={String(item.count)} variant={item.variant} />
                        </div>
                      )
                    })}
                  </div>
                </SectionCard>

                <SectionCard title="Notifications" subtitle="Recent alerts">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                      { text: 'Patient Sarah M. completed rehab session', time: '12 min ago', dot: '#10b981' },
                      { text: 'New angle detection report uploaded',       time: '1 hr ago',  dot: '#3b82f6' },
                      { text: 'Appointment request from James L.',         time: '3 hr ago',  dot: '#f59e0b' },
                    ].map((n, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.625rem', paddingBottom: '0.5rem', borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none' }}>
                        <div style={{ paddingTop: 5 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: n.dot, flexShrink: 0 }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.775rem', color: '#374151', lineHeight: 1.4 }}>{n.text}</div>
                          <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 2 }}>{n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            </div>

            {/* Patient monitoring summary */}
            <SectionCard
              title="Patient Monitoring Summary"
              subtitle="AI angle detection results & rehabilitation progress"
              action={
                <button style={{
                  fontSize: '0.75rem', fontWeight: 600, color: '#374151',
                  background: '#f9fafb', border: '1px solid #e5e7eb',
                  borderRadius: 6, padding: '0.375rem 0.75rem',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  View All Reports
                </button>
              }
              noPad
            >
              <DataTable
                columns={['Patient', 'Condition', 'Last Session', 'Avg Angle', 'Progress', 'Status']}
                rows={[
                  [<span style={{ fontWeight: 500 }}>Sarah Mitchell</span>, 'Shoulder Rehab', '2 days ago', '78°', <ProgressBar value={78} max={90} />, <Badge label="Improving"    variant="success" />],
                  [<span style={{ fontWeight: 500 }}>James Liu</span>,      'Elbow Rehab',    'Today',       '65°', <ProgressBar value={65} max={90} />, <Badge label="On Track"    variant="info" />],
                  [<span style={{ fontWeight: 500 }}>Maria Garcia</span>,   'Knee Rehab',     '5 days ago',  '42°', <ProgressBar value={42} max={90} />, <Badge label="Needs Review" variant="warning" />],
                ]}
              />
            </SectionCard>
          </>
        )}

        {/* ── Patient Requests Tab ──────────────────────────────────────── */}
        {tab === 'patients' && (
          <>
            <div>
              <h1 style={{ fontSize: '1.1875rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Patient Requests
              </h1>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
                New patients looking for a doctor — accept to become their assigned physician
              </p>
            </div>

            {pendingPatients.length === 0 ? (
              <div style={{
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
                padding: '3rem', textAlign: 'center', color: '#9ca3af',
              }}>
                <UserPlus size={28} strokeWidth={1} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>No pending patient requests.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pendingPatients.map((patient) => (
                  <div key={patient.id} style={{
                    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
                    padding: '1rem 1.25rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '1rem', flexWrap: 'wrap',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
                        {patient.name}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#6b7280', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <span>📧 {patient.email}</span>
                        {patient.injuryType    && <span>🩺 {patient.injuryType}</span>}
                        {patient.injurySeverity && <span>⚠️ {patient.injurySeverity}</span>}
                        {patient.injuredArm    && <span>💪 {patient.injuredArm}</span>}
                        {patient.age           && <span>🧑 Age {patient.age}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleAccept(patient.id, patient.name)}
                        disabled={!!acting[patient.id]}
                        style={{
                          padding: '0.5rem 1.125rem',
                          background: '#16a34a', color: '#fff',
                          border: 'none', borderRadius: 7,
                          fontSize: '0.8125rem', fontWeight: 600,
                          cursor: acting[patient.id] ? 'not-allowed' : 'pointer',
                          opacity: acting[patient.id] ? 0.6 : 1,
                        }}
                      >
                        {acting[patient.id] === 'accepting' ? 'Accepting…' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleDecline(patient.id, patient.name)}
                        disabled={!!acting[patient.id]}
                        style={{
                          padding: '0.5rem 1.125rem',
                          background: '#fff', color: '#dc2626',
                          border: '1px solid #fca5a5', borderRadius: 7,
                          fontSize: '0.8125rem', fontWeight: 600,
                          cursor: acting[patient.id] ? 'not-allowed' : 'pointer',
                          opacity: acting[patient.id] ? 0.6 : 1,
                        }}
                      >
                        {acting[patient.id] === 'declining' ? 'Declining…' : 'Decline'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Notifications Tab ──────────────────────────────────────────── */}
        {tab === 'notifications' && (
          <>
            <div>
              <h1 style={{ fontSize: '1.1875rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Notifications
              </h1>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
                Patient requests and system alerts
              </p>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
              <NotificationsPanel
                role="doctor"
                onCountChange={setUnreadCount}
              />
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  )
}

function ProgressBar({ value, max }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: 4, background: '#f3f4f6', borderRadius: 2, minWidth: 60 }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: pct >= 80 ? '#10b981' : pct >= 60 ? '#3b82f6' : '#f59e0b' }} />
      </div>
      <span style={{ fontSize: '0.7rem', color: '#6b7280', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{pct}%</span>
    </div>
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
      <AlertCircle size={15} />
      {message}
    </div>
  )
}