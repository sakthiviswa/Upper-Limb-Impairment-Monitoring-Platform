/**
 * DoctorDashboard.jsx — fully theme-aware via CSS variables
 */

import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import rehabApi from '../utils/rehabApi'
import DashboardLayout from '../components/layout/DashboardLayout'
import NotificationsPanel from '../components/NotificationsPanel'
import ProfileSettings from '../components/ProfileSettings'
import MessagesPanel from '../components/MessagesPanel'
import AnalysisAssignment from '../components/AnalysisAssignment'
import DoctorAppointmentsPanel from '../components/DoctorAppointmentsPanel'
import { useToast } from '../components/ToastProvider'
import {
  Users, ClipboardList, Activity, CheckCircle, MessageSquare,
  Bell, AlertCircle, UserPlus, TrendingUp, TrendingDown, BarChart2,
  Check, X, Mail, Shield, Star,
  User, Stethoscope, Award, MapPin, Globe, GraduationCap,
  Building2, BadgeCheck, CalendarDays, Video, Clock,
  ChevronRight, Zap,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────
   LIVE DATA HOOKS
───────────────────────────────────────────────────────────────────── */

function useLivePatientCount(fallback = 0) {
  const [count,  setCount]  = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    api.get('/doctor/accepted-patients')
      .then(r => setCount((r.data.patients || []).length))
      .catch(() => setCount(null))
      .finally(() => setLoaded(true))
  }, [])

  return { patientCount: count !== null ? count : fallback, patientCountLoaded: loaded }
}

function useLiveAppointmentCounts() {
  const [pending,  setPending]  = useState(null)
  const [upcoming, setUpcoming] = useState(null)
  const [loaded,   setLoaded]   = useState(false)
  const [appts,    setAppts]    = useState([])

  const fetch = useCallback(() => {
    api.get('/appointments')
      .then(r => {
        const list = r.data.appointments || []
        setAppts(list)
        setPending(list.filter(a => a.status === 'pending').length)
        setUpcoming(list.filter(a =>
          a.status === 'confirmed' && new Date(a.appointment_date) > new Date()
        ).length)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    fetch()
    const id = setInterval(fetch, 30000)
    return () => clearInterval(id)
  }, [fetch])

  return {
    pendingAppts:  pending  ?? 0,
    upcomingAppts: upcoming ?? 0,
    apptLoaded:    loaded,
    appointments:  appts,
    refetchAppts:  fetch,
  }
}

function useLivePatientSessions(acceptedPatients) {
  const [rows,   setRows]   = useState([])
  const [alerts, setAlerts] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!acceptedPatients || acceptedPatients.length === 0) {
      setRows([]); setAlerts([]); setLoaded(true); return
    }

    const fetches = acceptedPatients.map(p =>
      rehabApi.get(`/api/sessions/patient/${p.rehab_patient_id || p.id}`)
        .then(r => {
          const sessions = r.data || []
          const latest   = sessions[0] || null
          return { patient: p, latestSession: latest, allSessions: sessions }
        })
        .catch(() => ({ patient: p, latestSession: null, allSessions: [] }))
    )

    Promise.all(fetches).then(results => {
      const sorted = results.sort((a, b) => {
        if (!a.latestSession) return 1
        if (!b.latestSession) return -1
        return new Date(b.latestSession.created_at) - new Date(a.latestSession.created_at)
      })
      setRows(sorted)

      const allLatest = results
        .filter(r => r.latestSession)
        .map(r => ({ ...r.latestSession, patientName: r.patient.name }))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
      setAlerts(allLatest)
      setLoaded(true)
    })
  }, [acceptedPatients?.length])

  return { sessionRows: rows, sessionAlerts: alerts, sessionsLoaded: loaded }
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
    <Card
      style={{ cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 0.15s' }}
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
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {value}
            </div>
          )}
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
        </div>
      </div>
    </Card>
  )
}

function Table({ columns, rows }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c} style={{
                padding: '10px 20px', textAlign: 'left',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                background: 'var(--bg-card2)', borderBottom: '1px solid var(--border-light)',
              }}>{c}</th>
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
    purple:  { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)' },
    default: { color: 'var(--text-secondary)', bg: 'var(--bg-card2)', border: 'var(--border)' },
  }
  const s = map[variant] || map.default
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600,
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
    }}>
      {label}
    </span>
  )
}

function ProgressBar({ value, max }) {
  const pct   = Math.min(100, Math.round((value / max) * 100))
  const color = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--brand)' : 'var(--warning)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 99, minWidth: 56 }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: color, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
    </div>
  )
}

function PageHeader({ title, subtitle }) {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{subtitle}</p>}
    </div>
  )
}

function EmptyState({ icon: Icon, text }) {
  return (
    <Card style={{ padding: '2.5rem', textAlign: 'center' }}>
      <Icon size={24} strokeWidth={1.5} style={{ marginBottom: 8, color: 'var(--text-muted)', opacity: 0.4 }} />
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>{text}</div>
    </Card>
  )
}

function MetaItem({ icon: Icon, value }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
      <Icon size={11} color="var(--text-muted)" strokeWidth={2} /> {value}
    </span>
  )
}

function Tag({ color, bg, border, children }) {
  return (
    <span style={{ padding: '2px 8px', background: bg, border: `1px solid ${border}`, borderRadius: 4, fontSize: 11, color, fontWeight: 500 }}>
      {children}
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────── */
export default function DoctorDashboard() {
  const { user }       = useAuth()
  const location       = useLocation()
  const { showToast }  = useToast()
  const urlParams      = new URLSearchParams(location.search)
  const initialTab     = urlParams.get('tab') || 'overview'

  const [data,             setData]             = useState(null)
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState('')
  const [tab,              setTab]              = useState(initialTab)
  const [unreadCount,      setUnreadCount]      = useState(0)
  const [unreadMessages,   setUnreadMessages]   = useState(0)
  const [pendingPatients,  setPendingPatients]  = useState([])
  const [acceptedPatients, setAcceptedPatients] = useState([])
  const [acting,           setActing]           = useState({})

  // ── Listen for Navbar profile/settings clicks ──
  useEffect(() => {
    const handler = (e) => setTab(e.detail.tab)
    window.addEventListener('navbar:tabchange', handler)
    return () => window.removeEventListener('navbar:tabchange', handler)
  }, [])

  /* ── Live data hooks ── */
  const { patientCount, patientCountLoaded } = useLivePatientCount(0)
  const {
    pendingAppts, upcomingAppts, apptLoaded, appointments, refetchAppts,
  } = useLiveAppointmentCounts()

  const [mountedAccepted, setMountedAccepted] = useState([])
  useEffect(() => {
    api.get('/doctor/accepted-patients')
      .then(r => setMountedAccepted(r.data.patients || []))
      .catch(() => {})
  }, [])

  const { sessionRows, sessionAlerts, sessionsLoaded } = useLivePatientSessions(mountedAccepted)

  /* ── Dashboard data ── */
  useEffect(() => {
    api.get('/doctor/dashboard')
      .then(r => {
        setData(r.data.data)
        const un = r.data.data.unread_notifications || 0
        const um = r.data.data.unread_messages      || 0
        setUnreadCount(un)
        setUnreadMessages(um)
        if (un > 0) showToast({
          type: 'doctor_request',
          title: `${un} New Notification${un > 1 ? 's' : ''}`,
          message: 'You have unread patient requests and alerts.',
          actions: [{ label: 'View', variant: 'primary', onClick: () => setTab('notifications') }],
        })
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!apptLoaded) return
    if (pendingAppts > 0) showToast({
      type: 'doctor_request',
      title: `${pendingAppts} Appointment Request${pendingAppts > 1 ? 's' : ''}`,
      message: 'Patient(s) are waiting for appointment confirmation.',
      actions: [{ label: 'View', variant: 'primary', onClick: () => setTab('appointments') }],
    })
  }, [apptLoaded])

  useEffect(() => {
    if (tab !== 'patients') return
    api.get('/doctor/pending-patients').then(r => setPendingPatients(r.data.patients || [])).catch(console.error)
    api.get('/doctor/accepted-patients').then(r => setAcceptedPatients(r.data.patients || [])).catch(console.error)
  }, [tab])

  useEffect(() => {
    if (tab !== 'appointments') refetchAppts()
  }, [tab])

  const handleAccept = async (patient) => {
    setActing(p => ({ ...p, [patient.id]: 'accepting' }))
    try {
      await api.post(`/doctor/accept-patient/${patient.id}`)
      setPendingPatients(p => p.filter(x => x.id !== patient.id))
      api.get('/doctor/accepted-patients').then(r => setAcceptedPatients(r.data.patients || []))
      showToast({
        type: 'request_accepted', title: 'Patient Accepted',
        message: `${patient.name} is now your assigned patient.`,
        actions: [{ label: 'Message', variant: 'primary', onClick: () => setTab('messages') }],
      })
    } catch (e) {
      showToast({ type: 'error', title: 'Error', message: e.response?.data?.message || 'Failed to accept patient.' })
    } finally { setActing(p => ({ ...p, [patient.id]: null })) }
  }

  const handleDecline = async (patient) => {
    setActing(p => ({ ...p, [patient.id]: 'declining' }))
    try {
      await api.post(`/doctor/decline-patient/${patient.id}`)
      setPendingPatients(p => p.filter(x => x.id !== patient.id))
      showToast({ type: 'request_declined', title: 'Patient Declined', message: `${patient.name} has been notified.` })
    } catch (e) {
      showToast({ type: 'error', title: 'Error', message: e.response?.data?.message || 'Failed to decline.' })
    } finally { setActing(p => ({ ...p, [patient.id]: null })) }
  }

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const upcomingConfirmed = appointments
    .filter(a => a.status === 'confirmed' && new Date(a.appointment_date) > new Date())
    .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
    .slice(0, 5)

  if (loading) return <LoadingScreen />

  if (error) return (
    <DashboardLayout user={user} role="doctor" activeTab={tab} onTabChange={setTab} unreadMessages={unreadMessages} pendingAppts={pendingAppts}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 10, padding: '12px 16px', color: 'var(--danger)', fontSize: 13 }}>
        <AlertCircle size={15} strokeWidth={2} /> {error}
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout user={user} role="doctor" activeTab={tab} onTabChange={setTab} unreadMessages={unreadMessages} pendingAppts={pendingAppts}>

      <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ══════════════ OVERVIEW ══════════════ */}
        {tab === 'overview' && (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                  {greeting}, Dr. {user?.name?.split(' ')[0]}
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <HeaderBtn onClick={() => setTab('appointments')} badge={pendingAppts}>
                  <CalendarDays size={14} strokeWidth={2} /> Appointments
                </HeaderBtn>
                <HeaderBtn onClick={() => setTab('patients')} badge={data?.pending_reviews}>
                  <UserPlus size={14} strokeWidth={2} /> Patient Requests
                </HeaderBtn>
                <HeaderBtn onClick={() => setTab('notifications')} badge={unreadCount}>
                  <Bell size={14} strokeWidth={2} />
                </HeaderBtn>
              </div>
            </div>

            {(data?.pending_reviews > 0) && (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <UserPlus size={16} color="var(--warning)" strokeWidth={2} style={{ flexShrink: 0 }} />
                <span style={{ color: 'var(--warning)', flex: 1 }}>
                  <strong>{data.pending_reviews} patient{data.pending_reviews > 1 ? 's' : ''}</strong> waiting for your care acceptance —{' '}
                  <button onClick={() => setTab('patients')} style={{ background: 'none', border: 'none', color: 'var(--warning)', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline', fontFamily: 'inherit' }}>
                    Review now
                  </button>
                </span>
              </div>
            )}

            {pendingAppts > 0 && (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <CalendarDays size={16} color="#8b5cf6" strokeWidth={2} style={{ flexShrink: 0 }} />
                <span style={{ color: '#8b5cf6', flex: 1 }}>
                  <strong>{pendingAppts} appointment request{pendingAppts > 1 ? 's' : ''}</strong> waiting for confirmation —{' '}
                  <button onClick={() => setTab('appointments')} style={{ background: 'none', border: 'none', color: '#8b5cf6', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline', fontFamily: 'inherit' }}>
                    Confirm now
                  </button>
                </span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
              <StatCard label="My Patients"      value={patientCount}          icon={Users}       color="#3b82f6" loading={!patientCountLoaded} onClick={() => setTab('patients')}      />
              <StatCard label="Pending Requests" value={data?.pending_reviews ?? 0} icon={ClipboardList} color="#f59e0b"                        onClick={() => setTab('patients')}      />
              <StatCard label="Appt Requests"    value={pendingAppts}          icon={CalendarDays} color="#8b5cf6" loading={!apptLoaded}          onClick={() => setTab('appointments')} />
              <StatCard label="Upcoming Appts"   value={upcomingAppts}         icon={Activity}    color="#10b981" loading={!apptLoaded}          onClick={() => setTab('appointments')} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 296px', gap: 14 }}>

              {/* Upcoming Schedule */}
              <Card noPad>
                <SectionHeader
                  title="Upcoming Schedule"
                  subtitle={`${upcomingConfirmed.length} confirmed appointment${upcomingConfirmed.length !== 1 ? 's' : ''}`}
                  action={
                    <button onClick={() => setTab('appointments')} style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)', background: 'var(--brand-light)', border: '1px solid var(--brand-border)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      View All
                    </button>
                  }
                />
                {upcomingConfirmed.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr>
                          {['Date & Time', 'Patient', 'Type', 'Duration'].map(h => (
                            <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', background: 'var(--bg-card2)', borderBottom: '1px solid var(--border-light)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingConfirmed.map((a, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '10px 16px' }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                                {new Date(a.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                                {new Date(a.appointment_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td style={{ padding: '10px 16px', fontWeight: 500, color: 'var(--text-primary)' }}>{a.patient_name || '—'}</td>
                            <td style={{ padding: '10px 16px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: a.type === 'online' ? '#3b82f6' : '#8b5cf6' }}>
                                {a.type === 'online' ? <Video size={11} strokeWidth={2} /> : <MapPin size={11} strokeWidth={2} />}
                                {a.type === 'online' ? 'Online' : 'In-Clinic'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={11} strokeWidth={2} /> {a.duration_mins} min
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  data?.schedule?.length > 0 ? (
                    <Table
                      columns={['Time', 'Patient', 'Type']}
                      rows={data.schedule.map(s => [
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{s.time}</span>,
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.patient}</span>,
                        <Badge label={s.type} variant={{ 'Check-up': 'success', 'Follow-up': 'info', 'Consultation': 'purple' }[s.type] || 'default'} />,
                      ])}
                    />
                  ) : (
                    <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                      <CalendarDays size={24} strokeWidth={1} style={{ marginBottom: 8, opacity: 0.2, color: 'var(--text-muted)' }} />
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>No upcoming appointments</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Confirmed appointments will appear here.</div>
                    </div>
                  )
                )}
              </Card>

              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Quick-action CTA */}
                <div style={{ background: 'var(--text-primary)', borderRadius: 12, padding: '20px 18px', boxShadow: 'var(--shadow-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Zap size={13} color="var(--text-muted)" />
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Actions</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.35, marginBottom: 6, color: 'var(--bg-card)' }}>
                    Manage Your Patients
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 14px' }}>
                    Review reports, assign exercises, or analyse rehab data.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button onClick={() => setTab('report_analysis')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', color: 'var(--text-primary)', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', width: '100%', justifyContent: 'center' }}>
                      <BarChart2 size={13} strokeWidth={2} /> View Reports
                    </button>
                    <button onClick={() => setTab('exercise_assignment')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', color: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '9px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', width: '100%', justifyContent: 'center' }}>
                      <Activity size={13} strokeWidth={2} /> Assign Exercises
                    </button>
                  </div>
                </div>

                {/* Pending Actions */}
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Pending Actions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Patient requests',     count: data?.pending_reviews ?? 0, icon: UserPlus,      variant: 'warning', onClick: () => setTab('patients')      },
                      { label: 'Appointment requests', count: pendingAppts,               icon: CalendarDays,  variant: 'purple',  onClick: () => setTab('appointments')  },
                      { label: 'Unread messages',      count: unreadMessages,             icon: MessageSquare, variant: 'info',    onClick: () => setTab('messages')      },
                      { label: 'Unread notifications', count: unreadCount,                icon: Bell,          variant: 'default', onClick: () => setTab('notifications') },
                    ].map((item, i) => {
                      const Icon = item.icon
                      return (
                        <div key={i} onClick={item.onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', transition: 'background 0.12s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card2)'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Icon size={13} color="var(--text-muted)" strokeWidth={1.75} />
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Badge label={String(item.count)} variant={item.count > 0 ? item.variant : 'default'} />
                            <ChevronRight size={12} color="var(--text-muted)" strokeWidth={2} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>

                {/* Recent Alerts */}
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Recent Alerts</div>
                  {!sessionsLoaded ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[1,2,3].map(i => (
                        <div key={i} style={{ display: 'flex', gap: 8 }}>
                          <div style={{ width: 13, height: 13, borderRadius: '50%', background: 'var(--border)', flexShrink: 0, marginTop: 2, animation: 'shimmer 1.2s ease-in-out infinite' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ width: '80%', height: 12, borderRadius: 4, background: 'var(--border)', marginBottom: 5, animation: 'shimmer 1.2s ease-in-out infinite' }} />
                            <div style={{ width: '40%', height: 10, borderRadius: 4, background: 'var(--border)', animation: 'shimmer 1.2s ease-in-out infinite' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : sessionAlerts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                      <Activity size={20} strokeWidth={1} style={{ marginBottom: 6, opacity: 0.2, color: 'var(--text-muted)' }} />
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No sessions recorded yet</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {sessionAlerts.map((s, i) => {
                        const alertStyle = {
                          improving:       { color: 'var(--success)', Icon: TrendingUp  },
                          stable:          { color: 'var(--brand)',   Icon: Activity    },
                          needs_attention: { color: 'var(--warning)', Icon: AlertCircle },
                          first_session:   { color: '#8b5cf6',        Icon: Activity    },
                        }[s.injury_status] || { color: 'var(--text-muted)', Icon: Activity }

                        const timeAgo = (() => {
                          const diff = Date.now() - new Date(s.created_at).getTime()
                          const mins = Math.floor(diff / 60000)
                          if (mins < 1)  return 'Just now'
                          if (mins < 60) return `${mins}m ago`
                          const hrs = Math.floor(mins / 60)
                          if (hrs < 24)  return `${hrs}h ago`
                          const days = Math.floor(hrs / 24)
                          return days === 1 ? 'Yesterday' : `${days}d ago`
                        })()

                        const statusLabel = {
                          improving:       'completed session — improving',
                          stable:          'completed session — stable',
                          needs_attention: 'session flagged — needs review',
                          first_session:   'completed first session',
                        }[s.injury_status] || 'completed a session'

                        return (
                          <div key={i} style={{ display: 'flex', gap: 8, paddingBottom: 10, borderBottom: i < sessionAlerts.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                            <alertStyle.Icon size={13} color={alertStyle.color} strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                                <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{s.patientName}</strong> {statusLabel}
                                {' · '}<span style={{ fontVariantNumeric: 'tabular-nums' }}>{s.avg_angle.toFixed(1)}° avg</span>
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{timeAgo}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>
              </div>
            </div>

            {/* Patient Monitoring Summary */}
            <Card noPad>
              <SectionHeader
                title="Patient Monitoring Summary"
                subtitle={sessionsLoaded ? `${sessionRows.filter(r => r.latestSession).length} of ${sessionRows.length} patient${sessionRows.length !== 1 ? 's' : ''} have session data` : 'Loading…'}
                action={
                  <button onClick={() => setTab('report_analysis')} style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)', background: 'var(--brand-light)', border: '1px solid var(--brand-border)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    View All Reports
                  </button>
                }
              />
              {!sessionsLoaded ? (
                <div style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div style={{ width: 120, height: 14, borderRadius: 4, background: 'var(--border)', animation: 'shimmer 1.2s ease-in-out infinite' }} />
                      <div style={{ width: 90,  height: 14, borderRadius: 4, background: 'var(--border)', animation: 'shimmer 1.2s ease-in-out infinite' }} />
                      <div style={{ width: 70,  height: 14, borderRadius: 4, background: 'var(--border)', animation: 'shimmer 1.2s ease-in-out infinite' }} />
                      <div style={{ width: 100, height: 8,  borderRadius: 99, background: 'var(--border)', animation: 'shimmer 1.2s ease-in-out infinite', flex: 1 }} />
                    </div>
                  ))}
                </div>
              ) : sessionRows.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                  <Activity size={24} strokeWidth={1} style={{ marginBottom: 8, opacity: 0.2, color: 'var(--text-muted)' }} />
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>No patient sessions yet</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        {['Patient', 'Condition', 'Last Session', 'Avg Angle', 'Accuracy', 'Status'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', background: 'var(--bg-card2)', borderBottom: '1px solid var(--border-light)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sessionRows.map(({ patient, latestSession }, i) => {
                        const s = latestSession
                        const statusMap = {
                          improving:       { label: 'Improving',    variant: 'success' },
                          stable:          { label: 'Stable',       variant: 'info'    },
                          needs_attention: { label: 'Needs Review', variant: 'warning' },
                          first_session:   { label: 'First Session',variant: 'purple'  },
                        }
                        const statusInfo = statusMap[s?.injury_status] || { label: 'No Data', variant: 'default' }

                        const timeAgo = s ? (() => {
                          const diff = Date.now() - new Date(s.created_at).getTime()
                          const mins = Math.floor(diff / 60000)
                          if (mins < 60)  return `${mins}m ago`
                          const hrs = Math.floor(mins / 60)
                          if (hrs < 24)   return `${hrs}h ago`
                          const days = Math.floor(hrs / 24)
                          return days === 1 ? 'Yesterday' : `${days}d ago`
                        })() : '—'

                        return (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{patient.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{patient.email}</div>
                            </td>
                            <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 12 }}>{patient.condition || patient.injuryType || '—'}</td>
                            <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 12 }}>{timeAgo}</td>
                            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                              {s ? `${s.avg_angle.toFixed(1)}°` : '—'}
                            </td>
                            <td style={{ padding: '12px 16px', minWidth: 120 }}>
                              {s ? <ProgressBar value={s.accuracy} max={100} /> : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              {s ? <Badge label={statusInfo.label} variant={statusInfo.variant} /> : <Badge label="No Sessions" variant="default" />}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <button onClick={() => setTab('patients')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', width: '100%', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={14} color="var(--text-muted)" strokeWidth={2} />
                View full patient list & manage care assignments
              </div>
              <ChevronRight size={14} color="var(--text-muted)" />
            </button>
          </>
        )}

        {/* ══════════════ PATIENTS ══════════════ */}
        {tab === 'patients' && (
          <>
            <PageHeader title="My Patients" subtitle="Manage patient requests and your accepted patients" />
            {pendingPatients.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Pending Requests ({pendingPatients.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pendingPatients.map(patient => (
                    <div key={patient.id} style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--text-primary)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--bg-card)' }}>
                          {(patient.name || '').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() || <User size={16} color="var(--bg-card)" />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14, marginBottom: 4 }}>{patient.name}</div>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <MetaItem icon={Mail}        value={patient.email} />
                            {patient.injuryType     && <MetaItem icon={Shield}      value={patient.injuryType}     />}
                            {patient.injurySeverity && <MetaItem icon={AlertCircle} value={patient.injurySeverity} />}
                            {patient.age            && <MetaItem icon={User}        value={`Age ${patient.age}`}   />}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleAccept(patient)} disabled={!!acting[patient.id]} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: acting[patient.id] ? 'not-allowed' : 'pointer', opacity: acting[patient.id] ? 0.6 : 1, fontFamily: 'inherit' }}>
                          <Check size={13} strokeWidth={2.5} />
                          {acting[patient.id] === 'accepting' ? 'Accepting…' : 'Accept'}
                        </button>
                        <button onClick={() => handleDecline(patient)} disabled={!!acting[patient.id]} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', background: 'var(--bg-card)', color: 'var(--danger)', border: '1px solid var(--danger-border)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: acting[patient.id] ? 'not-allowed' : 'pointer', opacity: acting[patient.id] ? 0.6 : 1, fontFamily: 'inherit' }}>
                          <X size={13} strokeWidth={2.5} />
                          {acting[patient.id] === 'declining' ? 'Declining…' : 'Decline'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {pendingPatients.length === 0 && <EmptyState icon={UserPlus} text="No pending patient requests" />}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 8 }}>
              Accepted Patients ({acceptedPatients.length})
            </div>
            {acceptedPatients.length === 0
              ? <EmptyState icon={Users} text="No accepted patients yet" />
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12 }}>
                  {acceptedPatients.map(p => <PatientCard key={p.id} patient={p} onMessage={() => setTab('messages')} />)}
                </div>
              )
            }
          </>
        )}

        {/* ══════════════ APPOINTMENTS ══════════════ */}
        {tab === 'appointments' && (
          <DoctorAppointmentsPanel onPendingCountChange={() => refetchAppts()} />
        )}

        {/* ══════════════ MESSAGES ══════════════ */}
        {tab === 'messages' && (
          <>
            <PageHeader title="Messages" subtitle="Chat with your patients" />
            <MessagesPanel />
          </>
        )}

        {/* ══════════════ NOTIFICATIONS ══════════════ */}
        {tab === 'notifications' && (
          <>
            <PageHeader title="Notifications" subtitle="Patient requests and system alerts" />
            <Card noPad><NotificationsPanel role="doctor" onCountChange={setUnreadCount} /></Card>
          </>
        )}

        {/* ══════════════ ANALYSIS & ASSIGNMENT ══════════════ */}
        {(tab === 'report_analysis' || tab === 'exercise_assignment') && (
          <AnalysisAssignment subTab={tab} />
        )}

        {tab === 'profile'   && <ProfileSettings viewMode={true}  />}
        {tab === 'settings'  && <ProfileSettings viewMode={false} />}
        {tab === 'myprofile' && <DoctorProfileCard user={user} />}
      </div>
    </DashboardLayout>
  )
}

/* ── PatientCard ─────────────────────────────────────────────────── */
function PatientCard({ patient, onMessage }) {
  const initials = (patient.name || '').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
  const sev      = patient.injurySeverity
  const sevColor = sev === 'Severe'
    ? { bg:'var(--danger-bg)',  border:'var(--danger-border)',  color:'var(--danger)'  }
    : sev === 'Moderate'
    ? { bg:'var(--warning-bg)', border:'var(--warning-border)', color:'var(--warning)' }
    : { bg:'var(--success-bg)', border:'var(--success-border)', color:'var(--success)' }

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--text-primary)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--bg-card)' }}>
          {initials || <User size={16} color="var(--bg-card)" strokeWidth={2} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14, marginBottom: 2 }}>{patient.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
            <Mail size={11} color="var(--text-muted)" strokeWidth={2} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{patient.email}</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
        {patient.injuryType     && <Tag bg="var(--bg-card2)" border="var(--border)" color="var(--text-secondary)">{patient.injuryType}</Tag>}
        {patient.injurySeverity && <Tag bg={sevColor.bg} border={sevColor.border} color={sevColor.color}>{patient.injurySeverity}</Tag>}
        {patient.injuredArm     && <Tag bg="var(--bg-card2)" border="var(--border)" color="var(--text-secondary)">{patient.injuredArm}</Tag>}
        {patient.age            && <Tag bg="var(--bg-card2)" border="var(--border)" color="var(--text-secondary)">Age {patient.age}</Tag>}
      </div>
      <button onClick={onMessage} style={{ width: '100%', padding: '8px 0', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
        <MessageSquare size={13} color="var(--text-muted)" strokeWidth={2} /> Message Patient
      </button>
    </Card>
  )
}

/* ── Doctor Profile Card ─────────────────────────────────────────── */
function DoctorProfileCard({ user }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Doctor Profile</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Your professional details visible to patients</p>
      </div>
      <Card style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ width: 60, height: 60, borderRadius: 14, background: 'var(--text-primary)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: 'var(--bg-card)' }}>
          {(user?.name || '').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() || <User size={26} color="var(--bg-card)" />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Dr. {user?.name}</span>
            <BadgeCheck size={16} color="var(--brand)" strokeWidth={2} title="Verified" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
            <Mail size={13} color="var(--text-muted)" strokeWidth={2} /> {user?.email}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['Orthopedic Surgery', 'Rehabilitation Medicine'].map(tag => (
              <span key={tag} style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand)', background: 'var(--brand-light)', border: '1px solid var(--brand-border)', borderRadius: 5, padding: '3px 8px' }}>{tag}</span>
            ))}
          </div>
        </div>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <InfoSection title="Professional Details" icon={Stethoscope}>
          <InfoRow icon={Award}         label="Experience"    value="12 years"           />
          <InfoRow icon={GraduationCap} label="Qualification" value="MBBS, MS Ortho"     />
          <InfoRow icon={Building2}     label="Hospital"      value="City Medical Center" />
          <InfoRow icon={MapPin}        label="Location"      value="New York, USA"       />
        </InfoSection>
        <InfoSection title="Practice Info" icon={ClipboardList}>
          <InfoRow icon={Star}        label="Rating"       value="4.8 / 5 (240 reviews)" />
          <InfoRow icon={Users}       label="Patients"     value="180+ treated"           />
          <InfoRow icon={Globe}       label="Languages"    value="English, Spanish"       />
          <InfoRow icon={CheckCircle} label="Availability" value="Mon–Fri, 9am–5pm"      />
        </InfoSection>
      </div>
    </div>
  )
}

function InfoSection({ title, icon: Icon, children }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border-light)' }}>
        <Icon size={13} color="var(--text-muted)" strokeWidth={2} />
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </Card>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon size={13} color="var(--text-muted)" strokeWidth={2} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 90 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function HeaderBtn({ children, onClick, badge }) {
  return (
    <button onClick={onClick} style={{ position: 'relative', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'inherit', boxShadow: 'var(--shadow-sm)' }}>
      {children}
      {badge > 0 && (
        <span style={{ background: '#dc2626', color: '#fff', borderRadius: 10, padding: '0.05rem 0.35rem', fontSize: '0.6rem', fontWeight: 700 }}>
          {badge}
        </span>
      )}
    </button>
  )
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-app)', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Loading dashboard…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}