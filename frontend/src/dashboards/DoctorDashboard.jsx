/**
 * DoctorDashboard.jsx — fully theme-aware via CSS variables
 * Updated: AnalysisAssignment panel wired for report_analysis and exercise_assignment tabs
 */

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import DashboardLayout from '../components/layout/DashboardLayout'
import NotificationsPanel from '../components/NotificationsPanel'
import ProfileSettings from '../components/ProfileSettings'
import MessagesPanel from '../components/MessagesPanel'
import AnalysisAssignment from '../components/AnalysisAssignment'
import { useToast } from '../components/ToastProvider'
import {
  Users, ClipboardList, Activity, CheckCircle, MessageSquare,
  Bell, AlertCircle, UserPlus, TrendingUp, BarChart2,
  Check, X, Mail, Calendar, Shield, Star,
  User, Stethoscope, Award, MapPin, Globe, GraduationCap,
  Building2, BadgeCheck,
} from 'lucide-react'

/* ── Reusable theme-aware atoms ─────────────────────────────────── */

function Card({ children, style = {}, noPad }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      boxShadow: 'var(--shadow-sm)',
      padding: noPad ? 0 : '1.25rem',
      overflow: 'hidden',
      ...style,
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

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <Card>
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
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {value}
          </div>
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
  const pct = Math.min(100, Math.round((value / max) * 100))
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

/* ── Main ─────────────────────────────────────────────────────────── */

export default function DoctorDashboard() {
  const { user } = useAuth()
  const location = useLocation()
  const { showToast } = useToast()
  const urlParams = new URLSearchParams(location.search)
  const initialTab = urlParams.get('tab') || 'overview'

  const [data, setData]                         = useState(null)
  const [loading, setLoading]                   = useState(true)
  const [error, setError]                       = useState('')
  const [tab, setTab]                           = useState(initialTab)
  const [unreadCount, setUnreadCount]           = useState(0)
  const [unreadMessages, setUnreadMessages]     = useState(0)
  const [pendingPatients, setPendingPatients]   = useState([])
  const [acceptedPatients, setAcceptedPatients] = useState([])
  const [acting, setActing]                     = useState({})

  useEffect(() => {
    api.get('/doctor/dashboard')
      .then(r => {
        setData(r.data.data)
        const un = r.data.data.unread_notifications || 0
        const um = r.data.data.unread_messages || 0
        setUnreadCount(un)
        setUnreadMessages(um)
        if (un > 0) showToast({
          type: 'doctor_request', title: `${un} New Notification${un > 1 ? 's' : ''}`,
          message: 'You have unread patient requests and alerts.',
          actions: [{ label: 'View', variant: 'primary', onClick: () => setTab('notifications') }],
        })
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (tab !== 'patients') return
    api.get('/doctor/pending-patients').then(r => setPendingPatients(r.data.patients || [])).catch(console.error)
    api.get('/doctor/accepted-patients').then(r => setAcceptedPatients(r.data.patients || [])).catch(console.error)
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

  if (loading) return <LoadingScreen />

  if (error) return (
    <DashboardLayout user={user} role="doctor" activeTab={tab} onTabChange={setTab} unreadMessages={unreadMessages}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 10, padding: '12px 16px', color: 'var(--danger)', fontSize: 13 }}>
        <AlertCircle size={15} strokeWidth={2} /> {error}
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout user={user} role="doctor" activeTab={tab} onTabChange={setTab} unreadMessages={unreadMessages}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <PageHeader
                title="Physician Overview"
                subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <HeaderBtn onClick={() => setTab('patients')} badge={data?.pending_reviews}>
                  <UserPlus size={14} strokeWidth={2} /> Patient Requests
                </HeaderBtn>
                <HeaderBtn onClick={() => setTab('notifications')} badge={unreadCount}>
                  <Bell size={14} strokeWidth={2} />
                </HeaderBtn>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
              <StatCard label="My Patients"        value={data.today_patients}  icon={Users}        color="#3b82f6" />
              <StatCard label="Pending Requests"   value={data.pending_reviews} icon={ClipboardList} color="#f59e0b" />
              <StatCard label="Scheduled Sessions" value={data.schedule.length} icon={Activity}     color="#10b981" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 296px', gap: 14 }}>
              <Card noPad>
                <SectionHeader title="Today's Schedule" subtitle={`${data.schedule.length} appointments`} />
                <Table
                  columns={['Time', 'Patient', 'Type']}
                  rows={data.schedule.map(s => [
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{s.time}</span>,
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.patient}</span>,
                    <Badge label={s.type} variant={{ 'Check-up': 'success', 'Follow-up': 'info', 'Consultation': 'purple' }[s.type] || 'default'} />,
                  ])}
                />
              </Card>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Pending Actions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Patient requests',    count: data.pending_reviews, icon: UserPlus,      variant: 'warning', onClick: () => setTab('patients') },
                      { label: 'Feedback requests',   count: 2,                    icon: MessageSquare, variant: 'info'    },
                      { label: 'Sessions to approve', count: 1,                    icon: CheckCircle,   variant: 'default' },
                    ].map((item, i) => {
                      const Icon = item.icon
                      return (
                        <div key={i} onClick={item.onClick} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 12px', background: 'var(--bg-card2)',
                          border: '1px solid var(--border)', borderRadius: 8,
                          cursor: item.onClick ? 'pointer' : 'default',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Icon size={13} color="var(--text-muted)" strokeWidth={1.75} />
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</span>
                          </div>
                          <Badge label={String(item.count)} variant={item.variant} />
                        </div>
                      )
                    })}
                  </div>
                </Card>

                <Card>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Recent Alerts</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { text: 'Sarah M. completed rehab session', time: '12 min ago', color: 'var(--success)', Icon: Activity },
                      { text: 'New angle detection report',       time: '1 hr ago',   color: 'var(--brand)',   Icon: BarChart2 },
                      { text: 'Appointment request from James L.',time: '3 hr ago',   color: 'var(--warning)', Icon: Calendar },
                    ].map((n, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, paddingBottom: 10, borderBottom: i < 2 ? '1px solid var(--border-light)' : 'none' }}>
                        <n.Icon size={13} color={n.color} strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{n.text}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            <Card noPad>
              <SectionHeader
                title="Patient Monitoring Summary"
                subtitle="AI angle detection & rehab progress"
                action={
                  <button style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    View All Reports
                  </button>
                }
              />
              <Table
                columns={['Patient', 'Condition', 'Last Session', 'Avg Angle', 'Progress', 'Status']}
                rows={[
                  ['Sarah Mitchell', 'Shoulder Rehab', '2 days ago', '78°', <ProgressBar value={78} max={90} />, <Badge label="Improving"    variant="success" />],
                  ['James Liu',      'Elbow Rehab',    'Today',      '65°', <ProgressBar value={65} max={90} />, <Badge label="On Track"     variant="info" />],
                  ['Maria Garcia',   'Knee Rehab',     '5 days ago', '42°', <ProgressBar value={42} max={90} />, <Badge label="Needs Review" variant="warning" />],
                ].map(r => r.map((cell, i) => i === 0 ? <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{cell}</span> : cell))}
              />
            </Card>
          </>
        )}

        {/* ── PATIENTS ── */}
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
                    <div key={patient.id} style={{
                      background: 'var(--warning-bg)', border: '1px solid var(--warning-border)',
                      borderRadius: 12, padding: '16px 20px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: 10, background: 'var(--text-primary)', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: 'var(--bg-card)',
                        }}>
                          {(patient.name || '').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() || <User size={16} color="var(--bg-card)" />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14, marginBottom: 4 }}>{patient.name}</div>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <MetaItem icon={Mail}        value={patient.email} />
                            {patient.injuryType     && <MetaItem icon={Shield}      value={patient.injuryType} />}
                            {patient.injurySeverity && <MetaItem icon={AlertCircle} value={patient.injurySeverity} />}
                            {patient.age            && <MetaItem icon={User}        value={`Age ${patient.age}`} />}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleAccept(patient)} disabled={!!acting[patient.id]}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: acting[patient.id] ? 'not-allowed' : 'pointer', opacity: acting[patient.id] ? 0.6 : 1, fontFamily: 'inherit' }}>
                          <Check size={13} strokeWidth={2.5} />
                          {acting[patient.id] === 'accepting' ? 'Accepting…' : 'Accept'}
                        </button>
                        <button onClick={() => handleDecline(patient)} disabled={!!acting[patient.id]}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', background: 'var(--bg-card)', color: 'var(--danger)', border: '1px solid var(--danger-border)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: acting[patient.id] ? 'not-allowed' : 'pointer', opacity: acting[patient.id] ? 0.6 : 1, fontFamily: 'inherit' }}>
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

        {/* ── MESSAGES ── */}
        {tab === 'messages' && (
          <>
            <PageHeader title="Messages" subtitle="Chat with your patients" />
            <MessagesPanel />
          </>
        )}

        {/* ── NOTIFICATIONS ── */}
        {tab === 'notifications' && (
          <>
            <PageHeader title="Notifications" subtitle="Patient requests and system alerts" />
            <Card noPad><NotificationsPanel role="doctor" onCountChange={setUnreadCount} /></Card>
          </>
        )}

        {/* ── ANALYSIS & ASSIGNMENT (both sub-tabs) ── */}
        {(tab === 'report_analysis' || tab === 'exercise_assignment') && (
          <AnalysisAssignment subTab={tab} />
        )}

        {tab === 'profile'    && <ProfileSettings viewMode={true} />}
        {tab === 'settings'   && <ProfileSettings viewMode={false} />}
        {tab === 'myprofile'  && <DoctorProfileCard user={user} />}
      </div>
    </DashboardLayout>
  )
}

/* ── PatientCard ─────────────────────────────────────────────────── */
function PatientCard({ patient, onMessage }) {
  const initials = (patient.name || '').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
  const sev = patient.injurySeverity
  const sevColor = sev === 'Severe'   ? { bg:'var(--danger-bg)',  border:'var(--danger-border)',  color:'var(--danger)'  }
    : sev === 'Moderate'              ? { bg:'var(--warning-bg)', border:'var(--warning-border)', color:'var(--warning)' }
    :                                   { bg:'var(--success-bg)', border:'var(--success-border)', color:'var(--success)' }

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
      <button onClick={onMessage} style={{
        width: '100%', padding: '8px 0', background: 'var(--bg-card2)', border: '1px solid var(--border)',
        borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
        cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
      }}>
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
          <InfoRow icon={Award}         label="Experience"    value="12 years" />
          <InfoRow icon={GraduationCap} label="Qualification" value="MBBS, MS Ortho" />
          <InfoRow icon={Building2}     label="Hospital"      value="City Medical Center" />
          <InfoRow icon={MapPin}        label="Location"      value="New York, USA" />
        </InfoSection>
        <InfoSection title="Practice Info" icon={ClipboardList}>
          <InfoRow icon={Star}        label="Rating"       value="4.8 / 5 (240 reviews)" />
          <InfoRow icon={Users}       label="Patients"     value="180+ treated" />
          <InfoRow icon={Globe}       label="Languages"    value="English, Spanish" />
          <InfoRow icon={CheckCircle} label="Availability" value="Mon–Fri, 9am–5pm" />
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
    <button onClick={onClick} style={{
      position: 'relative', background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'inherit',
      boxShadow: 'var(--shadow-sm)',
    }}>
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