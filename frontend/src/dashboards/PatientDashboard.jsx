/**
 * PatientDashboard.jsx
 */

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth }     from '../context/AuthContext'
import api             from '../utils/api'
import rehabApi        from '../utils/rehabApi'
import MonitoringSession    from '../rehab/MonitoringSession'
import SessionHistory       from '../rehab/SessionHistory'
import DashboardLayout      from '../components/layout/DashboardLayout'
import NotificationsPanel   from '../components/NotificationsPanel'
import ProfileSettings      from '../components/ProfileSettings'
import MessagesPanel        from '../components/MessagesPanel'
import PrescriptionsPanel   from '../components/PrescriptionsPanel'
import BookAppointmentPanel from '../components/BookAppointmentPanel'
import { useToast }    from '../components/ToastProvider'
import {
  CalendarDays, Pill, Activity, Play, FileText,
  Clock, AlertCircle, TrendingUp, ChevronRight, Zap, Bell,
  CheckCircle, Video, MapPin, Plus, BarChart2,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────
   STATUS COLOUR MAP
───────────────────────────────────────────────────────────────────── */
const STATUS_COLORS = {
  Confirmed: { color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)' },
  Pending:   { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'var(--warning-border)' },
  Cancelled: { color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: 'var(--danger-border)'  },
  confirmed: { color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)' },
  pending:   { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'var(--warning-border)' },
  cancelled: { color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: 'var(--danger-border)'  },
  declined:  { color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: 'var(--danger-border)'  },
}

/* ─────────────────────────────────────────────────────────────────────
   HOOK – live prescription count
───────────────────────────────────────────────────────────────────── */
function usePrescriptionCount(fallback = 0) {
  const [count,  setCount]  = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    api.get('/patient/my-exercises')
      .then(r => {
        const assignments = r.data?.assignments ?? []
        setCount(assignments.length)
      })
      .catch(() => setCount(null))
      .finally(() => setLoaded(true))
  }, [])

  return {
    prescriptionCount:  count !== null ? count : fallback,
    prescriptionLoaded: loaded,
  }
}

/* ─────────────────────────────────────────────────────────────────────
   HOOK – live total rehab session count
───────────────────────────────────────────────────────────────────── */
function useTotalSessions(rehabPatientId) {
  const [count,  setCount]  = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!rehabPatientId) return
    rehabApi.get(`/api/sessions?patient_id=${rehabPatientId}`)
      .then(r => {
        const sessions = r.data?.sessions ?? r.data ?? []
        setCount(Array.isArray(sessions) ? sessions.length : 0)
      })
      .catch(() => setCount(0))
      .finally(() => setLoaded(true))
  }, [rehabPatientId])

  return {
    totalSessions:       count ?? 0,
    totalSessionsLoaded: loaded,
  }
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
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px', borderBottom: '1px solid var(--border-light)',
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, loading, onClick }) {
  return (
    <Card style={{ cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 0.15s' }}
      onClick={onClick}
      onMouseEnter={onClick ? e => e.currentTarget.style.boxShadow = 'var(--shadow-md)' : undefined}
      onMouseLeave={onClick ? e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)' : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: color ? `${color}15` : 'var(--brand-light)',
          border: `1px solid ${color ? `${color}30` : 'var(--brand-border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={18} color={color || 'var(--brand)'} strokeWidth={2} />
        </div>
        <div>
          {loading ? (
            <div style={{
              width: 36, height: 24, borderRadius: 6,
              background: 'var(--border)', marginBottom: 6,
              animation: 'shimmer 1.2s ease-in-out infinite',
            }} />
          ) : (
            <div style={{
              fontSize: 24, fontWeight: 700, color: 'var(--text-primary)',
              lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            }}>
              {value}
            </div>
          )}
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
        </div>
      </div>
    </Card>
  )
}

function PageSection({ title, subtitle, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────── */
export default function PatientDashboard() {
  const { user }      = useAuth()
  const location      = useLocation()
  const { showToast } = useToast()

  const urlParams  = new URLSearchParams(location.search)
  const initialTab = urlParams.get('tab') || 'overview'

  const [tab,            setTab]            = useState(initialTab)
  const [dashData,       setDashData]       = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')
  const [rehabPatient,   setRP]             = useState(null)
  const [lastSession,    setLast]           = useState(null)
  const [unreadCount,    setUnreadCount]    = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [pendingAppts,   setPendingAppts]   = useState(0)
  const [liveAppts,      setLiveAppts]      = useState(null)

  // ── Listen for Navbar profile/settings clicks ──
  useEffect(() => {
    const handler = (e) => setTab(e.detail.tab)
    window.addEventListener('navbar:tabchange', handler)
    return () => window.removeEventListener('navbar:tabchange', handler)
  }, [])

  /* ── Dashboard data ── */
  useEffect(() => {
    api.get('/patient/dashboard')
      .then(r => {
        const d = r.data.data
        setDashData(d)
        setUnreadCount(d.unread_notifications || 0)
        setUnreadMessages(d.unread_messages || 0)
        if (d.doctor_accepted && (d.assigned_doctor || d.assigned_doctor_email)) {
          const doctorDisplay = d.assigned_doctor ? `Dr. ${d.assigned_doctor}` : 'Your doctor'
          showToast({
            type: 'request_accepted',
            title: 'Doctor Assigned',
            message: `${doctorDisplay} has accepted your care request.`,
          })
        }
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))

    api.get('/appointments')
      .then(r => {
        const appts = r.data.appointments || []
        setLiveAppts(appts)
        setPendingAppts(appts.filter(a => a.status === 'pending').length)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (tab === 'appointments') return
    api.get('/appointments')
      .then(r => {
        const appts = r.data.appointments || []
        setLiveAppts(appts)
        setPendingAppts(appts.filter(a => a.status === 'pending').length)
      })
      .catch(() => {})
  }, [tab])

  /* ── Live prescription count ── */
  const { prescriptionCount, prescriptionLoaded } = usePrescriptionCount(
    dashData?.prescriptions ?? 0
  )

  /* ── Rehab patient setup ── */
  useEffect(() => {
    if (!user) return
    rehabApi.get(`/api/patients/email/${encodeURIComponent(user.email)}`)
      .then(r => setRP(r.data))
      .catch(async () => {
        try {
          const { data } = await rehabApi.post('/api/patients', {
            name:         user.name,
            email:        user.email,
            doctor_email: 'doctor@healthcare.dev',
            condition:    'Shoulder Rehabilitation',
            target_angle: 90,
          })
          setRP(data)
        } catch {}
      })
  }, [user])

  /* ── Total sessions count ── */
  const { totalSessions, totalSessionsLoaded } = useTotalSessions(rehabPatient?.id)

  const patientForRehab = rehabPatient
    ? {
        ...user,
        rehab_patient_id: rehabPatient.id,
        target_angle:     rehabPatient.target_angle,
        doctor_email:     dashData?.assigned_doctor_email || rehabPatient.doctor_email,
      }
    : null

  const appointments = liveAppts ?? dashData?.appointments ?? []

  if (loading) return <LoadingScreen />

  return (
    <DashboardLayout
      user={user}
      role="patient"
      activeTab={tab}
      onTabChange={setTab}
      unreadMessages={unreadMessages}
      pendingAppts={pendingAppts}
    >
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* ─────────── OVERVIEW ─────────── */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Hello, {user?.name?.split(' ')[0]}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Here's your rehabilitation status overview
              </p>
            </div>
            <button
              onClick={() => setTab('notifications')}
              style={{
                position: 'relative', background: 'var(--bg-card)',
                border: '1px solid var(--border)', borderRadius: 8,
                padding: '8px 12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, color: 'var(--text-secondary)',
                fontFamily: 'inherit', boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Bell size={14} color="var(--text-muted)" strokeWidth={2} />
              {unreadCount > 0 && (
                <span style={{ background: '#ef4444', color: '#fff', borderRadius: 10, padding: '0.05rem 0.35rem', fontSize: '0.6rem', fontWeight: 700 }}>
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Doctor banner */}
          {dashData && (
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: dashData.doctor_accepted ? 'var(--success-bg)' : 'var(--warning-bg)',
              border: `1px solid ${dashData.doctor_accepted ? 'var(--success-border)' : 'var(--warning-border)'}`,
              display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
            }}>
              {dashData.doctor_accepted
                ? <CheckCircle size={16} color="var(--success)" strokeWidth={2} style={{ flexShrink: 0 }} />
                : <Clock       size={16} color="var(--warning)" strokeWidth={2} style={{ flexShrink: 0 }} />
              }
              <span style={{ color: dashData.doctor_accepted ? 'var(--success)' : 'var(--warning)' }}>
                {dashData.doctor_accepted
                  ? (
                    <>
                      <strong>Doctor assigned:</strong> {dashData.assigned_doctor ? `Dr. ${dashData.assigned_doctor}` : 'Your doctor'} —{' '}
                      <button
                        onClick={() => setTab('messages')}
                        style={{ background: 'none', border: 'none', color: 'var(--success)', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline', fontFamily: 'inherit' }}
                      >
                        Message them
                      </button>
                    </>
                  )
                  : 'Waiting for a doctor to accept your request.'
                }
              </span>
            </div>
          )}

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 10, padding: '12px 16px', color: 'var(--danger)', fontSize: 13 }}>
              <AlertCircle size={15} strokeWidth={2} /> {error}
            </div>
          )}

          {dashData && (
            <>
              {/* ── Stat cards ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                <StatCard
                  label="Upcoming Appointments"
                  value={appointments.filter(a => ['confirmed', 'Confirmed', 'pending', 'Pending'].includes(a.status)).length}
                  icon={CalendarDays}
                  color="#3b82f6"
                  onClick={() => setTab('appointments')}
                />
                <StatCard
                  label="Active Prescriptions"
                  value={prescriptionCount}
                  icon={Pill}
                  color="#8b5cf6"
                  loading={!prescriptionLoaded}
                />
                <StatCard
                  label="Total Sessions"
                  value={totalSessionsLoaded ? totalSessions : (rehabPatient ? undefined : 0)}
                  icon={BarChart2}
                  color="#10b981"
                  loading={!!rehabPatient && !totalSessionsLoaded}
                  onClick={() => setTab('history')}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 14 }}>

                {/* Appointments table */}
                <Card noPad>
                  <SectionHeader
                    title="Upcoming Appointments"
                    subtitle={`${appointments.length} scheduled`}
                    action={
                      <button
                        onClick={() => setTab('appointments')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          fontSize: 12, fontWeight: 600, color: 'var(--brand)',
                          background: 'var(--brand-light)', border: '1px solid var(--brand-border)',
                          borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        <Plus size={11} strokeWidth={2.5} /> Book New
                      </button>
                    }
                  />
                  <div style={{ overflowX: 'auto' }}>
                    {appointments.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <CalendarDays size={24} strokeWidth={1} style={{ marginBottom: 8, opacity: 0.2, color: 'var(--text-muted)' }} />
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 4 }}>No appointments yet</div>
                        <button
                          onClick={() => setTab('appointments')}
                          style={{ fontSize: 12, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                        >
                          Book your first appointment →
                        </button>
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr>
                            {['Doctor', 'Date', 'Type', 'Status', ''].map(h => (
                              <th key={h} style={{
                                padding: '10px 16px', textAlign: 'left',
                                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                                textTransform: 'uppercase', color: 'var(--text-muted)',
                                background: 'var(--bg-card2)', borderBottom: '1px solid var(--border-light)',
                              }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {appointments.slice(0, 5).map((a, i) => {
                            const s = STATUS_COLORS[a.status] || STATUS_COLORS.Pending
                            return (
                              <tr
                                key={i}
                                style={{ borderBottom: '1px solid var(--border-light)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <td style={{ padding: '10px 16px', fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>
                                  {a.doctor_name || a.doctor || '—'}
                                </td>
                                <td style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontSize: 12 }}>
                                  {a.appointment_date
                                    ? new Date(a.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                    : a.date || '—'
                                  }
                                </td>
                                <td style={{ padding: '10px 16px' }}>
                                  {a.type && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: a.type === 'online' ? '#3b82f6' : '#8b5cf6' }}>
                                      {a.type === 'online' ? <Video size={11} strokeWidth={2} /> : <MapPin size={11} strokeWidth={2} />}
                                      {a.type === 'online' ? 'Online' : 'In-Clinic'}
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '10px 16px' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />
                                    {a.status ? (a.status.charAt(0).toUpperCase() + a.status.slice(1)) : '—'}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 16px' }}>
                                  {a.type === 'online' && a.status === 'confirmed' && a.meet_link && (
                                    <a
                                      href={a.meet_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#1a73e8', color: '#fff', borderRadius: 6, fontSize: 11, fontWeight: 600, textDecoration: 'none' }}
                                    >
                                      <Video size={10} strokeWidth={2} /> Join
                                    </a>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                  {appointments.length > 5 && (
                    <button
                      onClick={() => setTab('appointments')}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, width: '100%', padding: '10px', background: 'none', border: 'none', borderTop: '1px solid var(--border-light)', fontSize: 12, color: 'var(--brand)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      View all {appointments.length} appointments <ChevronRight size={12} strokeWidth={2.5} />
                    </button>
                  )}
                </Card>

                {/* Side column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Start session CTA */}
                  <div style={{ background: 'var(--text-primary)', borderRadius: 12, padding: '20px 18px', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Zap size={13} color="var(--text-muted)" />
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Rehabilitation
                      </span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.35, marginBottom: 6, color: 'var(--bg-card)' }}>
                      Start Your Therapy Session
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 14px' }}>
                      30-second webcam session to track angle progress.
                    </p>
                    <button
                      onClick={() => setTab('monitor')}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', color: 'var(--text-primary)', border: 'none', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', width: '100%', justifyContent: 'center' }}
                    >
                      <Play size={13} fill="var(--text-primary)" color="var(--text-primary)" />
                      Start Monitoring
                    </button>
                  </div>

                  {/* Book appointment shortcut */}
                  <div
                    onClick={() => setTab('appointments')}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'box-shadow 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CalendarDays size={14} color="#3b82f6" strokeWidth={2} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Appointments</span>
                      {pendingAppts > 0 && (
                        <span style={{ marginLeft: 'auto', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                          {pendingAppts} pending
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 10px' }}>
                      Book online or in-clinic appointments with your doctor.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>
                      Manage Appointments <ChevronRight size={13} strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* Prescriptions shortcut */}
                  <div
                    onClick={() => setTab('prescriptions')}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'box-shadow 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Pill size={14} color="#8b5cf6" strokeWidth={2} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>My Prescriptions</span>
                      {prescriptionLoaded && prescriptionCount > 0 && (
                        <span style={{ marginLeft: 'auto', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: '#8b5cf6', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                          {prescriptionCount}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 10px' }}>
                      View exercise plans with step-by-step instructions and video demos.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#8b5cf6' }}>
                      View Prescriptions <ChevronRight size={13} strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* System info */}
                  <Card>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>About the System</div>
                    {[
                      ['Webcam-based motion capture',     Activity  ],
                      ['AI angle detection (MediaPipe)',  TrendingUp],
                      ['Reports shared with your doctor', FileText  ],
                      ['30-sec session per exercise',     Clock     ],
                    ].map(([text, Icon], i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', padding: '4px 0' }}>
                        <Icon size={13} color="var(--text-muted)" strokeWidth={1.75} /> {text}
                      </div>
                    ))}
                  </Card>
                </div>
              </div>

              <button
                onClick={() => setTab('history')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', width: '100%', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={14} color="var(--text-muted)" />
                  View full session history & progress analytics
                </div>
                <ChevronRight size={14} color="var(--text-muted)" />
              </button>
            </>
          )}
        </div>
      )}

      {/* ─────────── APPOINTMENTS ─────────── */}
      {tab === 'appointments' && (
        <BookAppointmentPanel
          assignedDoctorId={dashData?.assigned_doctor_id}
          assignedDoctorName={dashData?.assigned_doctor}
        />
      )}

      {/* ─────────── PRESCRIPTIONS ─────────── */}
      {tab === 'prescriptions' && <PrescriptionsPanel />}

      {/* ─────────── MESSAGES ─────────── */}
      {tab === 'messages' && (
        <PageSection title="Messages" subtitle="Chat with your assigned doctor">
          <MessagesPanel />
        </PageSection>
      )}

      {/* ─────────── NOTIFICATIONS ─────────── */}
      {tab === 'notifications' && (
        <PageSection title="Notifications" subtitle="Doctor assignment updates and system alerts">
          <Card noPad>
            <NotificationsPanel role="patient" onCountChange={setUnreadCount} />
          </Card>
        </PageSection>
      )}

      {/* ─────────── MONITOR ─────────── */}
      {tab === 'monitor' && (
        <PageSection title="Rehabilitation Monitor" subtitle="Live webcam session · MediaPipe angle tracking">
          {!patientForRehab
            ? (
              <Card style={{ padding: '3rem', textAlign: 'center' }}>
                <Activity size={28} strokeWidth={1} style={{ marginBottom: 10, opacity: 0.3, color: 'var(--text-muted)' }} />
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>
                  Setting up your rehabilitation profile…
                </div>
              </Card>
            )
            : (
              <MonitoringSession
                patient={patientForRehab}
                onSessionComplete={s => { setLast(s); setTimeout(() => setTab('history'), 2500) }}
              />
            )
          }
        </PageSection>
      )}

      {/* ─────────── HISTORY ─────────── */}
      {tab === 'history' && (
        <PageSection title="Session History" subtitle="Your past rehabilitation sessions and angle progression">
          <SessionHistory patient={patientForRehab} />
        </PageSection>
      )}

      {tab === 'profile'  && <ProfileSettings viewMode={true}  />}
      {tab === 'settings' && <ProfileSettings viewMode={false} />}

    </DashboardLayout>
  )
}

/* ─────────────────────────────────────────────────────────────────────
   LOADING SCREEN
───────────────────────────────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-app)', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Loading dashboard…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}