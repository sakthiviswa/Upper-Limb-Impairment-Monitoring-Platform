/**
 * DoctorDashboard
 * - Toast popups via useToast (top-right corner)
 * - Only Lucide React icons, no emoji
 * - Standard colors
 * - Toast on accept/decline patient, tab switches, notifications
 *
 * Place at: src/pages/DoctorDashboard.jsx
 */

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import DashboardLayout from '../components/layout/DashboardLayout'
import { StatCard, SectionCard, Badge, DataTable } from '../components/ui/Cards'
import NotificationsPanel from '../components/NotificationsPanel'
import ProfileSettings from '../components/ProfileSettings'
import MessagesPanel from '../components/MessagesPanel'
import { useToast } from '../components/ToastProvider'
import {
  Users, ClipboardList, Activity, CheckCircle, MessageSquare,
  Bell, AlertCircle, UserPlus, TrendingUp, BarChart2,
  Check, X, Mail, Phone, Calendar, Shield, Star,
  User, Stethoscope, Award, MapPin, Globe, GraduationCap,
  Building2, BadgeCheck, Languages,
} from 'lucide-react'

const TYPE_VARIANT = {
  'Check-up':     'success',
  'Follow-up':    'info',
  'Consultation': 'purple',
}

export default function DoctorDashboard() {
  const { user }      = useAuth()
  const location      = useLocation()
  const { showToast } = useToast()
  const urlParams     = new URLSearchParams(location.search)
  const initialTab    = urlParams.get('tab') || 'overview'

  const [data, setData]                       = useState(null)
  const [loading, setLoading]                 = useState(true)
  const [error, setError]                     = useState('')
  const [tab, setTab]                         = useState(initialTab)
  const [unreadCount, setUnreadCount]         = useState(0)
  const [unreadMessages, setUnreadMessages]   = useState(0)
  const [pendingPatients, setPendingPatients] = useState([])
  const [acceptedPatients, setAcceptedPatients] = useState([])
  const [acting, setActing]                   = useState({})

  useEffect(() => {
    api.get('/doctor/dashboard')
      .then(r => {
        setData(r.data.data)
        const unreadNotifs = r.data.data.unread_notifications || 0
        const unreadMsgs   = r.data.data.unread_messages || 0
        setUnreadCount(unreadNotifs)
        setUnreadMessages(unreadMsgs)

        // Toast on load if there are pending notifications
        if (unreadNotifs > 0) {
          showToast({
            type: 'doctor_request',
            title: `${unreadNotifs} New Notification${unreadNotifs > 1 ? 's' : ''}`,
            message: 'You have unread patient requests and alerts.',
            actions: [{ label: 'View', variant: 'primary', onClick: () => setTab('notifications') }],
          })
        }
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (tab === 'patients') {
      api.get('/doctor/pending-patients')
        .then(r => setPendingPatients(r.data.patients || []))
        .catch(console.error)
      api.get('/doctor/accepted-patients')
        .then(r => setAcceptedPatients(r.data.patients || []))
        .catch(console.error)
    }
  }, [tab])

  const handleAccept = async (patient) => {
    setActing(prev => ({ ...prev, [patient.id]: 'accepting' }))
    try {
      await api.post(`/doctor/accept-patient/${patient.id}`)
      setPendingPatients(prev => prev.filter(p => p.id !== patient.id))
      setData(prev => prev ? {
        ...prev,
        today_patients:  (prev.today_patients || 0) + 1,
        pending_reviews: Math.max(0, (prev.pending_reviews || 1) - 1),
      } : prev)
      api.get('/doctor/accepted-patients')
        .then(r => setAcceptedPatients(r.data.patients || []))
      showToast({
        type: 'request_accepted',
        title: 'Patient Accepted',
        message: `${patient.name} is now your assigned patient.`,
        actions: [{ label: 'Message', variant: 'primary', onClick: () => setTab('messages') }],
      })
    } catch (e) {
      showToast({ type: 'error', title: 'Error', message: e.response?.data?.message || 'Failed to accept patient.' })
    } finally {
      setActing(prev => ({ ...prev, [patient.id]: null }))
    }
  }

  const handleDecline = async (patient) => {
    setActing(prev => ({ ...prev, [patient.id]: 'declining' }))
    try {
      await api.post(`/doctor/decline-patient/${patient.id}`)
      setPendingPatients(prev => prev.filter(p => p.id !== patient.id))
      showToast({ type: 'request_declined', title: 'Patient Declined', message: `${patient.name} has been notified.` })
    } catch (e) {
      showToast({ type: 'error', title: 'Error', message: e.response?.data?.message || 'Failed to decline.' })
    } finally {
      setActing(prev => ({ ...prev, [patient.id]: null }))
    }
  }

  if (loading) return <LoadingScreen />
  if (error) return (
    <DashboardLayout user={user} role="doctor" activeTab={tab} onTabChange={setTab} unreadMessages={unreadMessages}>
      <ErrorBanner message={error} />
    </DashboardLayout>
  )

  return (
    <DashboardLayout user={user} role="doctor" activeTab={tab} onTabChange={setTab} unreadMessages={unreadMessages}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: "'Sora', sans-serif" }}>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h1 style={{ fontSize: '1.1875rem', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.015em' }}>
                  Physician Overview
                </h1>
                <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <HeaderBtn onClick={() => setTab('patients')} badge={data?.pending_reviews}>
                  <UserPlus size={14} strokeWidth={2} /> Patient Requests
                </HeaderBtn>
                <HeaderBtn onClick={() => setTab('notifications')} badge={unreadCount}>
                  <Bell size={14} strokeWidth={2} />
                </HeaderBtn>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem' }}>
              <StatCard label="My Patients"        value={data.today_patients}  icon={Users} />
              <StatCard label="Pending Requests"   value={data.pending_reviews} icon={ClipboardList} />
              <StatCard label="Scheduled Sessions" value={data.schedule.length} icon={Activity} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 296px', gap: '0.875rem' }}>
              <SectionCard title="Today's Schedule" subtitle={`${data.schedule.length} appointments`} noPad>
                <DataTable
                  columns={['Time', 'Patient', 'Type']}
                  rows={data.schedule.map(s => [
                    <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums' }}>{s.time}</span>,
                    <span style={{ fontWeight: 500, color: '#374151' }}>{s.patient}</span>,
                    <Badge label={s.type} variant={TYPE_VARIANT[s.type] || 'default'} />,
                  ])}
                />
              </SectionCard>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <SectionCard title="Pending Actions" subtitle="Requires review">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                      { label: 'Patient requests',    count: data.pending_reviews, icon: UserPlus,      variant: 'warning', onClick: () => setTab('patients') },
                      { label: 'Feedback requests',   count: 2,                    icon: MessageSquare, variant: 'info' },
                      { label: 'Sessions to approve', count: 1,                    icon: CheckCircle,   variant: 'default' },
                    ].map((item, i) => {
                      const Icon = item.icon
                      return (
                        <div key={i} onClick={item.onClick} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.5625rem 0.75rem',
                          background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 7,
                          cursor: item.onClick ? 'pointer' : 'default',
                        }}>
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

                <SectionCard title="Recent Alerts" subtitle="">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                      { text: 'Sarah M. completed rehab session', time: '12 min ago', color: '#16a34a', Icon: Activity },
                      { text: 'New angle detection report',       time: '1 hr ago',   color: '#2563eb', Icon: BarChart2 },
                      { text: 'Appointment request from James L.',time: '3 hr ago',   color: '#d97706', Icon: Calendar },
                    ].map((n, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none' }}>
                        <n.Icon size={13} color={n.color} strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
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

            <SectionCard title="Patient Monitoring Summary" subtitle="AI angle detection & rehab progress" noPad
              action={<ViewAllBtn />}
            >
              <DataTable
                columns={['Patient', 'Condition', 'Last Session', 'Avg Angle', 'Progress', 'Status']}
                rows={[
                  ['Sarah Mitchell', 'Shoulder Rehab', '2 days ago', '78°', <ProgressBar value={78} max={90} />, <Badge label="Improving"    variant="success" />],
                  ['James Liu',      'Elbow Rehab',    'Today',      '65°', <ProgressBar value={65} max={90} />, <Badge label="On Track"     variant="info" />],
                  ['Maria Garcia',   'Knee Rehab',     '5 days ago', '42°', <ProgressBar value={42} max={90} />, <Badge label="Needs Review" variant="warning" />],
                ].map(r => r.map((cell, i) => i === 0 ? <span style={{ fontWeight: 500 }}>{cell}</span> : cell))}
              />
            </SectionCard>
          </>
        )}

        {/* ── Patients tab ── */}
        {tab === 'patients' && (
          <>
            <PageHeader
              title="My Patients"
              subtitle="Manage patient requests and your accepted patients"
            />

            {pendingPatients.length > 0 && (
              <>
                <SectionLabel>Pending Requests ({pendingPatients.length})</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {pendingPatients.map(patient => (
                    <div key={patient.id} style={{
                      background: '#fffbeb', border: '1px solid #fde68a',
                      borderRadius: 10, padding: '1rem 1.25rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: '1rem', flexWrap: 'wrap',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: '#0f172a',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.8125rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>
                          {(patient.name || '').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() || <User size={16} color="#fff" />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                            {patient.name}
                          </div>
                          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
                            <MetaItem icon={Mail}         value={patient.email} />
                            {patient.injuryType     && <MetaItem icon={Shield}       value={patient.injuryType} />}
                            {patient.injurySeverity && <MetaItem icon={AlertCircle}  value={patient.injurySeverity} />}
                            {patient.injuredArm     && <MetaItem icon={Activity}     value={patient.injuredArm} />}
                            {patient.age            && <MetaItem icon={User}         value={`Age ${patient.age}`} />}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <ActionBtn
                          variant="accept"
                          loading={acting[patient.id] === 'accepting'}
                          disabled={!!acting[patient.id]}
                          onClick={() => handleAccept(patient)}
                        >
                          <Check size={13} strokeWidth={2.5} />
                          {acting[patient.id] === 'accepting' ? 'Accepting…' : 'Accept'}
                        </ActionBtn>
                        <ActionBtn
                          variant="decline"
                          loading={acting[patient.id] === 'declining'}
                          disabled={!!acting[patient.id]}
                          onClick={() => handleDecline(patient)}
                        >
                          <X size={13} strokeWidth={2.5} />
                          {acting[patient.id] === 'declining' ? 'Declining…' : 'Decline'}
                        </ActionBtn>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {pendingPatients.length === 0 && (
              <EmptyState icon={UserPlus} text="No pending patient requests" />
            )}

            <SectionLabel style={{ marginTop: '0.5rem' }}>
              Accepted Patients ({acceptedPatients.length})
            </SectionLabel>

            {acceptedPatients.length === 0 ? (
              <EmptyState icon={Users} text="No accepted patients yet" />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
                {acceptedPatients.map(patient => (
                  <PatientCard key={patient.id} patient={patient} onMessage={() => setTab('messages')} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Messages ── */}
        {tab === 'messages' && (
          <>
            <PageHeader title="Messages" subtitle="Chat with your patients" />
            <MessagesPanel />
          </>
        )}

        {/* ── Notifications ── */}
        {tab === 'notifications' && (
          <>
            <PageHeader title="Notifications" subtitle="Patient requests and system alerts" />
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
              <NotificationsPanel role="doctor" onCountChange={setUnreadCount} />
            </div>
          </>
        )}

        {tab === 'profile'  && <ProfileSettings viewMode={true} />}
        {tab === 'settings' && <ProfileSettings viewMode={false} />}

        {/* Doctor Profile (detailed) */}
        {tab === 'myprofile' && <DoctorProfileCard user={user} />}
      </div>
    </DashboardLayout>
  )
}

/* ── Doctor Profile Detail Card ─────────────────────────────────── */
function DoctorProfileCard({ user }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <PageHeader title="Doctor Profile" subtitle="Your professional details visible to patients" />

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div style={{
          width: 64, height: 64, borderRadius: 14,
          background: '#0f172a', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.25rem', fontWeight: 700, color: '#fff',
        }}>
          {(user?.name || '').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() || <User size={28} color="#fff" />}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>Dr. {user?.name}</span>
            <BadgeCheck size={16} color="#2563eb" strokeWidth={2} title="Verified" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.75rem' }}>
            <Mail size={13} color="#9ca3af" strokeWidth={2} /> {user?.email}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['Orthopedic Surgery', 'Rehabilitation Medicine'].map(tag => (
              <span key={tag} style={{
                fontSize: '0.7rem', fontWeight: 600, color: '#2563eb',
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: 4, padding: '0.2rem 0.5rem',
              }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
        <InfoSection title="Professional Details" icon={Stethoscope}>
          <InfoRow icon={Award}         label="Experience"      value="12 years" />
          <InfoRow icon={GraduationCap} label="Qualification"   value="MBBS, MS Ortho" />
          <InfoRow icon={Building2}     label="Hospital"        value="City Medical Center" />
          <InfoRow icon={MapPin}        label="Location"        value="New York, USA" />
        </InfoSection>

        <InfoSection title="Practice Info" icon={ClipboardList}>
          <InfoRow icon={Star}          label="Rating"          value="4.8 / 5 (240 reviews)" />
          <InfoRow icon={Users}         label="Patients"        value="180+ treated" />
          <InfoRow icon={Globe}         label="Languages"       value="English, Spanish" />
          <InfoRow icon={CheckCircle}   label="Availability"    value="Mon–Fri, 9am–5pm" />
        </InfoSection>
      </div>
    </div>
  )
}

function InfoSection({ title, icon: Icon, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1rem 1.125rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem', paddingBottom: '0.625rem', borderBottom: '1px solid #f3f4f6' }}>
        <Icon size={13} color="#6b7280" strokeWidth={2} />
        <span style={{ fontSize: '0.675rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {children}
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
      <Icon size={13} color="#9ca3af" strokeWidth={2} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: '0.75rem', color: '#9ca3af', minWidth: 80 }}>{label}</span>
      <span style={{ fontSize: '0.775rem', color: '#0f172a', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

/* ── Small helper components ── */

function PageHeader({ title, subtitle }) {
  return (
    <div>
      <h1 style={{ fontSize: '1.1875rem', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.015em' }}>
        {title}
      </h1>
      {subtitle && <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.25rem 0 0' }}>{subtitle}</p>}
    </div>
  )
}

function SectionLabel({ children, style }) {
  return (
    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', ...style }}>
      {children}
    </div>
  )
}

function HeaderBtn({ children, onClick, badge }) {
  return (
    <button onClick={onClick} style={{
      position: 'relative', background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 8, padding: '0.5rem 0.875rem', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '0.375rem',
      fontSize: '0.8125rem', color: '#374151', fontFamily: 'inherit',
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

function MetaItem({ icon: Icon, value }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.775rem', color: '#6b7280' }}>
      <Icon size={11} color="#9ca3af" strokeWidth={2} /> {value}
    </span>
  )
}

function ActionBtn({ children, variant, loading, disabled, onClick }) {
  const isAccept = variant === 'accept'
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.5rem 1rem',
      background: isAccept ? '#16a34a' : '#fff',
      color: isAccept ? '#fff' : '#dc2626',
      border: isAccept ? 'none' : '1px solid #fca5a5',
      borderRadius: 7, fontSize: '0.8125rem', fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1, fontFamily: 'inherit',
    }}>
      {children}
    </button>
  )
}

function PatientCard({ patient, onMessage }) {
  const initials = (patient.name || '').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
  const severityColor = patient.injurySeverity === 'Severe'
    ? { bg:'#fef2f2', border:'#fecaca', color:'#dc2626' }
    : patient.injurySeverity === 'Moderate'
    ? { bg:'#fffbeb', border:'#fde68a', color:'#d97706' }
    : { bg:'#f0fdf4', border:'#bbf7d0', color:'#16a34a' }

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1rem 1.125rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: '#0f172a', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8125rem', fontWeight: 700, color: '#fff',
        }}>
          {initials || <User size={16} color="#fff" strokeWidth={2} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem', marginBottom: '0.15rem' }}>{patient.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
            <Mail size={11} color="#9ca3af" strokeWidth={2} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{patient.email}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {patient.injuryType && <Tag bg="#f1f5f9" border="#e2e8f0" color="#374151">{patient.injuryType}</Tag>}
        {patient.injurySeverity && <Tag bg={severityColor.bg} border={severityColor.border} color={severityColor.color}>{patient.injurySeverity}</Tag>}
        {patient.injuredArm && <Tag bg="#f1f5f9" border="#e2e8f0" color="#374151">{patient.injuredArm}</Tag>}
        {patient.age && <Tag bg="#f1f5f9" border="#e2e8f0" color="#374151">Age {patient.age}</Tag>}
      </div>

      <button
        onClick={onMessage}
        style={{
          width: '100%', padding: '0.45rem 0',
          background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: 7, fontSize: '0.775rem', fontWeight: 600,
          color: '#374151', cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
        }}
      >
        <MessageSquare size={13} color="#6b7280" strokeWidth={2} /> Message Patient
      </button>
    </div>
  )
}

function Tag({ bg, border, color, children }) {
  return (
    <span style={{
      padding: '0.2rem 0.5rem', background: bg,
      border: `1px solid ${border}`, borderRadius: 4,
      fontSize: '0.7rem', color, fontWeight: 500,
    }}>
      {children}
    </span>
  )
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div style={{
      background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10,
      padding: '2rem', textAlign: 'center', color: '#9ca3af',
    }}>
      <Icon size={24} strokeWidth={1.5} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
      <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{text}</div>
    </div>
  )
}

function ViewAllBtn() {
  return (
    <button style={{
      fontSize: '0.75rem', fontWeight: 600, color: '#374151',
      background: '#f9fafb', border: '1px solid #e5e7eb',
      borderRadius: 6, padding: '0.375rem 0.75rem', cursor: 'pointer', fontFamily: 'inherit',
    }}>
      View All Reports
    </button>
  )
}

function ProgressBar({ value, max }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: 4, background: '#f3f4f6', borderRadius: 2, minWidth: 56 }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 2,
          background: pct >= 80 ? '#16a34a' : pct >= 60 ? '#2563eb' : '#d97706',
        }} />
      </div>
      <span style={{ fontSize: '0.7rem', color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', flexDirection: 'column', gap: '0.75rem', fontFamily: "'Sora', sans-serif" }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: 500 }}>Loading dashboard…</p>
    </div>
  )
}

function ErrorBanner({ message }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.75rem 1rem', color: '#991b1b', fontSize: '0.8125rem' }}>
      <AlertCircle size={15} strokeWidth={2} /> {message}
    </div>
  )
}