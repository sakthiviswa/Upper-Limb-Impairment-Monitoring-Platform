/**
 * PatientDashboard.jsx — fully theme-aware via CSS variables
 */

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import rehabApi from '../utils/rehabApi'
import MonitoringSession from '../rehab/MonitoringSession'
import SessionHistory    from '../rehab/SessionHistory'
import DashboardLayout   from '../components/layout/DashboardLayout'
import NotificationsPanel from '../components/NotificationsPanel'
import ProfileSettings from '../components/ProfileSettings'
import MessagesPanel from '../components/MessagesPanel'
import { useToast } from '../components/ToastProvider'
import {
  CalendarDays, Pill, Heart, Play, Activity, FileText,
  Clock, AlertCircle, TrendingUp, ChevronRight, Zap, Bell,
  CheckCircle, UserCheck, Users, MessageSquare,
} from 'lucide-react'

const STATUS_MAP = {
  Confirmed: { color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)' },
  Pending:   { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'var(--warning-border)' },
  Cancelled: { color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: 'var(--danger-border)'  },
}

/* ── Small reusable atoms ─────────────────────────────────────────── */

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
      padding: '14px 20px',
      borderBottom: '1px solid var(--border-light)',
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

function StatusBadge({ label }) {
  const s = STATUS_MAP[label] || STATUS_MAP.Pending
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99,
      fontSize: 11, fontWeight: 700,
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />
      {label}
    </span>
  )
}

function Table({ columns, rows }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
            {columns.map(c => (
              <th key={c} style={{
                padding: '10px 20px', textAlign: 'left',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                background: 'var(--bg-card2)',
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
                <td key={j} style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────────────── */

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
        if (d.doctor_accepted && d.assigned_doctor) {
          showToast({ type: 'request_accepted', title: 'Doctor Assigned', message: `Dr. ${d.assigned_doctor} has accepted your care request.`, actions: [{ label: 'Message', variant: 'primary', onClick: () => setTab('messages') }] })
        }
        if (unreadNotifs > 0 && !d.doctor_accepted) {
          showToast({ type: 'session_reminder', title: `${unreadNotifs} New Notification${unreadNotifs > 1 ? 's' : ''}`, message: 'Check your notifications for updates.', actions: [{ label: 'View', variant: 'primary', onClick: () => setTab('notifications') }] })
        }
        if (unreadMsgs > 0) {
          showToast({ type: 'new_message', title: `${unreadMsgs} New Message${unreadMsgs > 1 ? 's' : ''}`, message: 'You have unread messages from your care team.', actions: [{ label: 'Open', variant: 'primary', onClick: () => setTab('messages') }] })
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
        } catch {}
      })
  }, [user])

  const patientForRehab = rehabPatient
    ? { ...user, rehab_patient_id: rehabPatient.id, target_angle: rehabPatient.target_angle }
    : null

  if (loading) return <LoadingScreen />

  return (
    <DashboardLayout user={user} role="patient" activeTab={tab} onTabChange={setTab} unreadMessages={unreadMessages}>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Good morning, {user?.name?.split(' ')[0]}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Here's your rehabilitation status overview
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => setTab('notifications')}
                style={{
                  position: 'relative', background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'inherit',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Bell size={14} color="var(--text-muted)" strokeWidth={2} />
                {unreadCount > 0 && (
                  <span style={{ background: '#ef4444', color: '#fff', borderRadius: 10, padding: '0.05rem 0.35rem', fontSize: '0.6rem', fontWeight: 700 }}>{unreadCount}</span>
                )}
              </button>
              {lastSession && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'var(--text-secondary)', boxShadow: 'var(--shadow-sm)' }}>
                  <Activity size={13} color="var(--text-muted)" />
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Last: {lastSession.injury_status?.replace('_', ' ')}</span>
                  <span style={{ color: 'var(--text-muted)' }}>·</span>
                  <span>{lastSession.avg_angle}° avg</span>
                </div>
              )}
            </div>
          </div>

          {/* Doctor assignment banner */}
          {dashData && (
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: dashData.doctor_accepted ? 'var(--success-bg)' : 'var(--warning-bg)',
              border: `1px solid ${dashData.doctor_accepted ? 'var(--success-border)' : 'var(--warning-border)'}`,
              display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
            }}>
              {dashData.doctor_accepted
                ? <CheckCircle size={16} color="var(--success)" strokeWidth={2} style={{ flexShrink: 0 }} />
                : <Clock size={16} color="var(--warning)" strokeWidth={2} style={{ flexShrink: 0 }} />
              }
              <div style={{ color: dashData.doctor_accepted ? 'var(--success)' : 'var(--warning)' }}>
                {dashData.doctor_accepted
                  ? <><strong>Doctor assigned:</strong> Dr. {dashData.assigned_doctor} has accepted your care request. <button onClick={() => setTab('messages')} style={{ background: 'none', border: 'none', color: 'var(--success)', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline', fontFamily: 'inherit' }}>Message them</button></>
                  : <span>Waiting for a doctor to accept your request. {unreadCount > 0 && <button onClick={() => setTab('notifications')} style={{ background: 'none', border: 'none', color: 'var(--warning)', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline', fontFamily: 'inherit' }}>{unreadCount} new notification{unreadCount > 1 ? 's' : ''}.</button>}</span>
                }
              </div>
            </div>
          )}

          {error && <ErrorBanner message={error} />}

          {dashData && (
            <>
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                <StatCard label="Upcoming Appointments" value={dashData.appointments.length} icon={CalendarDays} color="#3b82f6" />
                <StatCard label="Active Prescriptions"  value={dashData.prescriptions}        icon={Pill}         color="#8b5cf6" />
                <StatCard label="Health Score"          value={dashData.health_score}          icon={Heart}        color="#ef4444" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
                {/* Appointments table */}
                <Card noPad>
                  <SectionHeader title="Upcoming Appointments" subtitle={`${dashData.appointments.length} scheduled`} />
                  <Table
                    columns={['Doctor', 'Date', 'Status']}
                    rows={dashData.appointments.map(a => [
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{a.doctor}</span>,
                      <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{a.date}</span>,
                      <StatusBadge label={a.status} />,
                    ])}
                  />
                </Card>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Start session CTA */}
                  <div style={{
                    background: 'var(--text-primary)',
                    borderRadius: 12, padding: '20px 18px', color: 'var(--bg-app)',
                    boxShadow: 'var(--shadow-md)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Zap size={14} color="var(--text-muted)" strokeWidth={1.75} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rehabilitation</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.35, marginBottom: 6, color: 'var(--bg-card)' }}>
                      Start Your Therapy Session
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 14px' }}>
                      30-second webcam session to track your elbow angle progress.
                    </p>
                    <button
                      onClick={() => setTab('monitor')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'var(--bg-card)', color: 'var(--text-primary)',
                        border: 'none', borderRadius: 8, padding: '10px 14px',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'inherit', width: '100%', justifyContent: 'center',
                      }}
                    >
                      <Play size={13} fill="var(--text-primary)" color="var(--text-primary)" /> Start Monitoring
                    </button>
                  </div>

                  {/* Info card */}
                  <Card>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>About the System</div>
                    {[
                      ['Webcam-based motion capture', Activity],
                      ['AI angle detection (MediaPipe)', TrendingUp],
                      ['Reports shared with your doctor', FileText],
                      ['30-sec session per exercise', Clock],
                    ].map(([text, Icon], i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', padding: '4px 0' }}>
                        <Icon size={13} color="var(--text-muted)" strokeWidth={1.75} /> {text}
                      </div>
                    ))}
                  </Card>
                </div>
              </div>

              {/* View history bar */}
              <button
                onClick={() => setTab('history')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '12px 16px', fontSize: 13,
                  color: 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer',
                  fontFamily: 'inherit', width: '100%', justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                }}
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

      {/* ── MESSAGES ── */}
      {tab === 'messages' && (
        <PageSection title="Messages" subtitle="Chat with your assigned doctor">
          <MessagesPanel />
        </PageSection>
      )}

      {/* ── NOTIFICATIONS ── */}
      {tab === 'notifications' && (
        <PageSection title="Notifications" subtitle="Doctor assignment updates and system alerts">
          <Card noPad><NotificationsPanel role="patient" onCountChange={setUnreadCount} /></Card>
        </PageSection>
      )}

      {/* ── MONITOR ── */}
      {tab === 'monitor' && (
        <PageSection title="Rehabilitation Monitor" subtitle="Live webcam session · MediaPipe angle tracking">
          {!patientForRehab ? (
            <Card style={{ padding: '3rem', textAlign: 'center' }}>
              <Activity size={28} strokeWidth={1} style={{ marginBottom: 10, opacity: 0.3, color: 'var(--text-muted)' }} />
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>Setting up your rehabilitation profile…</div>
            </Card>
          ) : (
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
          )}
        </PageSection>
      )}

      {/* ── HISTORY ── */}
      {tab === 'history' && (
        <PageSection title="Session History" subtitle="Your past rehabilitation sessions and angle progression">
          <SessionHistory patient={patientForRehab} />
        </PageSection>
      )}

      {tab === 'profile'  && <ProfileSettings viewMode={true} />}
      {tab === 'settings' && <ProfileSettings viewMode={false} />}

    </DashboardLayout>
  )
}

function PageSection({ title, subtitle, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function ErrorBanner({ message }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 10, padding: '12px 16px', color: 'var(--danger)', fontSize: 13 }}>
      <AlertCircle size={15} strokeWidth={2} /> {message}
    </div>
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