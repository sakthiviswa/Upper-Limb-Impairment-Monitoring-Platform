/**
 * PatientDashboard — with toast notifications, no emoji, Lucide icons only
 */

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import rehabApi from '../utils/rehabApi'
import MonitoringSession from '../rehab/MonitoringSession'
import SessionHistory    from '../rehab/SessionHistory'
import DashboardLayout   from '../components/layout/DashboardLayout'
import { StatCard, SectionCard, Badge, DataTable } from '../components/ui/Cards'
import NotificationsPanel from '../components/NotificationsPanel'
import ProfileSettings from '../components/ProfileSettings'
import MessagesPanel from '../components/MessagesPanel'
import { useToast } from '../components/ToastProvider'
import {
  CalendarDays, Pill, Heart, Play, Activity, FileText,
  Clock, AlertCircle, TrendingUp, ChevronRight, Zap, Bell,
  CheckCircle, UserCheck,
} from 'lucide-react'

const STATUS_VARIANT = { Confirmed: 'success', Pending: 'warning', Cancelled: 'danger' }

export default function PatientDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const urlParams = new URLSearchParams(location.search)
  const initialTab = urlParams.get('tab') || 'overview'

  const [tab, setTab]                       = useState(initialTab)
  const [dashData, setDashData]             = useState(null)
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState('')
  const [rehabPatient, setRP]               = useState(null)
  const [lastSession, setLast]              = useState(null)
  const [unreadCount, setUnreadCount]       = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    api.get('/patient/dashboard')
      .then(r => {
        const d = r.data.data
        setDashData(d)
        const unreadNotifs = d.unread_notifications || 0
        const unreadMsgs   = d.unread_messages || 0
        setUnreadCount(unreadNotifs)
        setUnreadMessages(unreadMsgs)

        // Toast: doctor accepted
        if (d.doctor_accepted && d.assigned_doctor) {
          showToast({
            type: 'request_accepted',
            title: 'Doctor Assigned',
            message: `Dr. ${d.assigned_doctor} has accepted your care request.`,
            actions: [{ label: 'Message', variant: 'primary', onClick: () => setTab('messages') }],
          })
        }

        // Toast: unread notifications
        if (unreadNotifs > 0 && !d.doctor_accepted) {
          showToast({
            type: 'session_reminder',
            title: `${unreadNotifs} New Notification${unreadNotifs > 1 ? 's' : ''}`,
            message: 'Check your notifications for updates.',
            actions: [{ label: 'View', variant: 'primary', onClick: () => setTab('notifications') }],
          })
        }

        // Toast: unread messages
        if (unreadMsgs > 0) {
          showToast({
            type: 'new_message',
            title: `${unreadMsgs} New Message${unreadMsgs > 1 ? 's' : ''}`,
            message: 'You have unread messages from your care team.',
            actions: [{ label: 'Open', variant: 'primary', onClick: () => setTab('messages') }],
          })
        }
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!user) return
    const encodedEmail = encodeURIComponent(user.email)
    rehabApi.get(`/api/patients/email/${encodedEmail}`)
      .then(r => setRP(r.data))
      .catch(async () => {
        try {
          const { data } = await rehabApi.post('/api/patients', {
            name: user.name, email: user.email,
            doctor_email: 'doctor@healthcare.dev',
            condition: 'Shoulder Rehabilitation', target_angle: 90,
          })
          setRP(data)
        } catch { /* silent */ }
      })
  }, [user])

  const patientForRehab = rehabPatient
    ? { ...user, rehab_patient_id: rehabPatient.id, target_angle: rehabPatient.target_angle }
    : null

  if (loading) return <LoadingScreen />

  return (
    <DashboardLayout user={user} role="patient" activeTab={tab} onTabChange={setTab} unreadMessages={unreadMessages}>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: "'Sora', sans-serif" }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h1 style={{ fontSize: '1.1875rem', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.015em' }}>
                Good morning, {user?.name?.split(' ')[0]}
              </h1>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.25rem 0 0', fontWeight: 400 }}>
                Here's your rehabilitation status overview
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
              <button onClick={() => setTab('notifications')} style={btnStyle}>
                <Bell size={14} color="#6b7280" strokeWidth={2} />
                {unreadCount > 0 && <RedBadge n={unreadCount} />}
              </button>
              {lastSession && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.5rem 0.875rem', fontSize: '0.75rem', color: '#374151' }}>
                  <Activity size={13} color="#6b7280" />
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>Last: {lastSession.injury_status?.replace('_', ' ')}</span>
                  <span style={{ color: '#9ca3af' }}>·</span>
                  <span>{lastSession.avg_angle}° avg</span>
                </div>
              )}
            </div>
          </div>

          {/* Doctor assignment banner — Lucide icons only, no emoji */}
          {dashData && (
            <div style={{
              padding: '0.875rem 1rem', borderRadius: 8,
              background: dashData.doctor_accepted ? '#f0fdf4' : '#fefce8',
              border: `1px solid ${dashData.doctor_accepted ? '#86efac' : '#fde047'}`,
              display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem',
            }}>
              {dashData.doctor_accepted
                ? <CheckCircle size={16} color="#16a34a" strokeWidth={2} style={{ flexShrink: 0 }} />
                : <Clock size={16} color="#d97706" strokeWidth={2} style={{ flexShrink: 0 }} />
              }
              <div>
                {dashData.doctor_accepted ? (
                  <>
                    <strong style={{ color: '#15803d' }}>Doctor assigned: </strong>
                    <span style={{ color: '#166534' }}>
                      Dr. {dashData.assigned_doctor} has accepted your care request.{' '}
                      <button onClick={() => setTab('messages')} style={{ background: 'none', border: 'none', color: '#15803d', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline', fontFamily: 'inherit', fontSize: 'inherit' }}>
                        Message them
                      </button>
                    </span>
                  </>
                ) : (
                  <span style={{ color: '#854d0e' }}>
                    Waiting for a doctor to accept your request.{' '}
                    {unreadCount > 0 && (
                      <button onClick={() => setTab('notifications')} style={{ background: 'none', border: 'none', color: '#92400e', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline', fontFamily: 'inherit', fontSize: 'inherit' }}>
                        You have {unreadCount} new notification{unreadCount > 1 ? 's' : ''}.
                      </button>
                    )}
                  </span>
                )}
              </div>
            </div>
          )}

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.75rem 1rem', color: '#991b1b', fontSize: '0.8125rem' }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {dashData && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem' }}>
                <StatCard label="Upcoming Appointments" value={dashData.appointments.length} icon={CalendarDays} />
                <StatCard label="Active Prescriptions"  value={dashData.prescriptions}        icon={Pill} />
                <StatCard label="Health Score"          value={dashData.health_score}          icon={Heart} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '0.875rem' }}>
                <SectionCard title="Upcoming Appointments" subtitle={`${dashData.appointments.length} scheduled`} noPad>
                  <DataTable
                    columns={['Doctor', 'Date', 'Status']}
                    rows={dashData.appointments.map(a => [
                      <span style={{ fontWeight: 500, color: '#0f172a' }}>{a.doctor}</span>,
                      <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>{a.date}</span>,
                      <Badge label={a.status} variant={STATUS_VARIANT[a.status] || 'default'} />,
                    ])}
                  />
                </SectionCard>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div style={{ background: '#0f172a', borderRadius: 10, padding: '1.375rem 1.25rem', color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Zap size={15} color="#e2e8f0" strokeWidth={1.75} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rehabilitation</span>
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3, marginBottom: '0.375rem' }}>
                      Start Your Therapy Session
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 1rem' }}>
                      30-second webcam session to track your elbow angle progress.
                    </p>
                    <button
                      onClick={() => setTab('monitor')}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', color: '#0f172a', border: 'none', borderRadius: 7, padding: '0.625rem 1rem', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', width: '100%', justifyContent: 'center' }}
                    >
                      <Play size={13} fill="#0f172a" /> Start Monitoring
                    </button>
                  </div>

                  <SectionCard title="About the System" subtitle="Rehabilitation monitoring">
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {[
                        ['Webcam-based motion capture', Activity],
                        ['AI angle detection (MediaPipe)', TrendingUp],
                        ['Reports shared with your doctor', FileText],
                        ['30-sec session per exercise', Clock],
                      ].map(([text, Icon], i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.775rem', color: '#374151' }}>
                          <Icon size={13} color="#9ca3af" strokeWidth={1.75} /> {text}
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                </div>
              </div>

              <button onClick={() => setTab('history')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.8125rem', color: '#374151', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', width: '100%', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={14} color="#9ca3af" /> View full session history & progress analytics
                </div>
                <ChevronRight size={14} color="#9ca3af" />
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Messages Tab ── */}
      {tab === 'messages' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: "'Sora', sans-serif" }}>
          <div>
            <h1 style={{ fontSize: '1.1875rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Messages</h1>
            <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
              Chat with your assigned doctor
            </p>
          </div>
          <MessagesPanel />
        </div>
      )}

      {/* ── Notifications Tab ── */}
      {tab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: "'Sora', sans-serif" }}>
          <div>
            <h1 style={{ fontSize: '1.1875rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Notifications</h1>
            <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.25rem 0 0' }}>Doctor assignment updates and system alerts</p>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
            <NotificationsPanel role="patient" onCountChange={setUnreadCount} />
          </div>
        </div>
      )}

      {/* ── Monitor ── */}
      {tab === 'monitor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: "'Sora', sans-serif" }}>
          <div>
            <h1 style={{ fontSize: '1.1875rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Rehabilitation Monitor</h1>
            <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.25rem 0 0' }}>Live webcam session · MediaPipe angle tracking</p>
          </div>
          {!patientForRehab ? (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
              <Activity size={28} strokeWidth={1} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Setting up your rehabilitation profile…</div>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#374151' }}>Camera active</span>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: 'auto' }}>
                  Target: {patientForRehab.target_angle}° · Patient ID: {patientForRehab.rehab_patient_id}
                </span>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <MonitoringSession
                  patient={patientForRehab}
                  onSessionComplete={s => {
                    setLast(s)
                    showToast({
                      type: 'session_completed',
                      title: 'Session Complete',
                      message: `Avg angle: ${s.avg_angle}°. Great work!`,
                      actions: [{ label: 'View History', variant: 'primary', onClick: () => setTab('history') }],
                    })
                    setTimeout(() => setTab('history'), 3000)
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── History ── */}
      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: "'Sora', sans-serif" }}>
          <div>
            <h1 style={{ fontSize: '1.1875rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Session History</h1>
            <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.25rem 0 0' }}>Your past rehabilitation sessions and angle progression</p>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
            <SessionHistory patient={patientForRehab} />
          </div>
        </div>
      )}

      {tab === 'profile'  && <ProfileSettings viewMode={true} />}
      {tab === 'settings' && <ProfileSettings viewMode={false} />}

    </DashboardLayout>
  )
}

const btnStyle = {
  position: 'relative', background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: 8, padding: '0.5rem 0.75rem', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: '0.375rem',
  fontSize: '0.8125rem', color: '#374151', fontFamily: 'inherit',
}

function RedBadge({ n }) {
  return <span style={{ background: '#ef4444', color: '#fff', borderRadius: 10, padding: '0.05rem 0.35rem', fontSize: '0.65rem', fontWeight: 700 }}>{n}</span>
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', flexDirection: 'column', gap: '0.75rem', fontFamily: "'Sora', sans-serif" }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: 500 }}>Loading dashboard…</p>
    </div>
  )
}