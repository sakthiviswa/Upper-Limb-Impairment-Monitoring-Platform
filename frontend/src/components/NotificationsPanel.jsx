/**
 * NotificationsPanel
 * - All Lucide React icons, no emoji
 * - Standard colors only
 * - Doctor: Accept/Decline buttons with toast feedback
 * - Patient: Dismiss button
 *
 * Place at: src/components/NotificationsPanel.jsx
 */

import { useState, useEffect, useCallback } from 'react'
import {
  UserPlus, CheckCircle2, XCircle, Dumbbell, AlertTriangle,
  Bell, Trophy, TrendingDown, MessageSquare, CalendarCheck,
  FileBarChart2, ClipboardList, Check, X, RefreshCw,
} from 'lucide-react'
import api from '../utils/api'
import { useToast } from './ToastProvider'

/* ── Type config: Lucide icons + standard colors only ─────────────── */
const TYPE_CONFIG = {
  doctor_request:     { Icon: UserPlus,      color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'Patient Request' },
  request_accepted:   { Icon: CheckCircle2,  color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Accepted' },
  request_declined:   { Icon: XCircle,       color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Declined' },
  session_completed:  { Icon: Dumbbell,      color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', label: 'Session' },
  session_missed:     { Icon: AlertTriangle, color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Missed' },
  session_reminder:   { Icon: Bell,          color: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe', label: 'Reminder' },
  progress_milestone: { Icon: Trophy,        color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Milestone' },
  progress_concern:   { Icon: TrendingDown,  color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Concern' },
  new_message:        { Icon: MessageSquare, color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8', label: 'Message' },
  appointment_booked: { Icon: CalendarCheck, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'Appointment' },
  report_ready:       { Icon: FileBarChart2, color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', label: 'Report' },
  profile_incomplete: { Icon: ClipboardList, color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Profile' },
}

const DEFAULT_CFG = TYPE_CONFIG.doctor_request

export default function NotificationsPanel({ role, onCountChange }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [acting, setActing]               = useState({})
  const { showToast }                     = useToast()

  const fetchNotifications = useCallback(() => {
    api.get('/notifications')
      .then(res => {
        const notifs = res.data.notifications || []
        setNotifications(notifs)
        const unread = notifs.filter(n => !n.isRead).length
        if (onCountChange) onCountChange(unread)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [onCountChange])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markRead = useCallback(async (notifId) => {
    await api.post(`/notifications/${notifId}/read`).catch(() => {})
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n))
    setNotifications(prev => {
      const unread = prev.filter(n => !n.isRead).length
      if (onCountChange) onCountChange(unread)
      return prev
    })
  }, [onCountChange])

  const markAllRead = async () => {
    await api.post('/notifications/read-all').catch(() => {})
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    if (onCountChange) onCountChange(0)
  }

  const handleAccept = async (notif) => {
    setActing(prev => ({ ...prev, [notif.id]: 'accepting' }))
    try {
      await api.post(`/doctor/accept-patient/${notif.senderId}`)
      await markRead(notif.id)
      showToast({
        type: 'request_accepted',
        title: 'Patient Accepted',
        message: `${notif.patientDetails?.name || 'Patient'} is now your assigned patient.`,
        actions: [{ label: 'Message', variant: 'primary', onClick: () => {} }],
      })
      fetchNotifications()
    } catch (e) {
      showToast({ type: 'request_declined', title: 'Error', message: e.response?.data?.message || 'Failed to accept.' })
    } finally {
      setActing(prev => ({ ...prev, [notif.id]: null }))
    }
  }

  const handleDecline = async (notif) => {
    setActing(prev => ({ ...prev, [notif.id]: 'declining' }))
    try {
      await api.post(`/doctor/decline-patient/${notif.senderId}`)
      await markRead(notif.id)
      showToast({ type: 'request_declined', title: 'Patient Declined', message: 'The patient has been notified.' })
      fetchNotifications()
    } catch (e) {
      showToast({ type: 'request_declined', title: 'Error', message: e.response?.data?.message || 'Failed to decline.' })
    } finally {
      setActing(prev => ({ ...prev, [notif.id]: null }))
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.8125rem', fontFamily: "'Sora', sans-serif" }}>
        <RefreshCw size={18} style={{ marginBottom: 8, opacity: 0.4, animation: 'spin 1s linear infinite' }} />
        <div>Loading notifications…</div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Sora', sans-serif" }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.875rem 1.125rem',
        borderBottom: '1px solid #f3f4f6',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={14} color="#374151" strokeWidth={2} />
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{
              background: '#dc2626', color: '#fff',
              borderRadius: 10, padding: '0.1rem 0.45rem',
              fontSize: '0.65rem', fontWeight: 700,
            }}>{unreadCount}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={fetchNotifications}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 2 }}
            title="Refresh"
          >
            <RefreshCw size={13} strokeWidth={2} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, fontFamily: 'inherit' }}
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
          <Bell size={28} strokeWidth={1} style={{ marginBottom: 8, opacity: 0.3 }} />
          <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>No notifications yet</div>
          <div style={{ fontSize: '0.75rem', marginTop: 4 }}>You're all caught up!</div>
        </div>
      ) : (
        <div style={{ maxHeight: 520, overflowY: 'auto' }}>
          {notifications.map((notif) => {
            const cfg   = TYPE_CONFIG[notif.type] || DEFAULT_CFG
            const { Icon } = cfg
            const isActing = acting[notif.id]

            return (
              <div
                key={notif.id}
                style={{
                  padding: '0.875rem 1.125rem',
                  background: notif.isRead ? '#fff' : cfg.bg,
                  borderBottom: '1px solid #f3f4f6',
                  borderLeft: `3px solid ${notif.isRead ? 'transparent' : cfg.color}`,
                  transition: 'background 0.2s',
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {/* Icon bubble */}
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    background: notif.isRead ? '#f9fafb' : '#fff',
                    border: `1px solid ${notif.isRead ? '#e5e7eb' : cfg.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={15} color={notif.isRead ? '#9ca3af' : cfg.color} strokeWidth={2} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Type label */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                      <span style={{
                        fontSize: '0.575rem', fontWeight: 700,
                        letterSpacing: '0.09em', textTransform: 'uppercase',
                        color: notif.isRead ? '#9ca3af' : cfg.color,
                        background: notif.isRead ? '#f9fafb' : '#fff',
                        border: `1px solid ${notif.isRead ? '#e5e7eb' : cfg.border}`,
                        borderRadius: 3, padding: '0.15rem 0.4rem',
                      }}>
                        {cfg.label}
                      </span>
                      {!notif.isRead && (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                      )}
                    </div>

                    {/* Patient details card (doctor_request only) */}
                    {notif.type === 'doctor_request' && notif.patientDetails && (
                      <div style={{
                        background: '#f8fafc', border: '1px solid #e2e8f0',
                        borderRadius: 7, padding: '0.5rem 0.625rem',
                        marginBottom: '0.375rem',
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 1rem',
                      }}>
                        <PatientDetailRow icon={UserPlus} label="Name"     value={notif.patientDetails.name} />
                        <PatientDetailRow icon={CalendarCheck} label="Age" value={notif.patientDetails.age ? `${notif.patientDetails.age} yrs` : '—'} />
                        <PatientDetailRow icon={ClipboardList} label="Injury"    value={notif.patientDetails.injuryType || '—'} />
                        <PatientDetailRow icon={AlertTriangle} label="Severity"  value={notif.patientDetails.injurySeverity || '—'} />
                      </div>
                    )}

                    {/* Message */}
                    <p style={{
                      margin: '0 0 0.4rem',
                      fontSize: '0.7875rem',
                      color: notif.isRead ? '#6b7280' : '#111827',
                      lineHeight: 1.45,
                      fontWeight: notif.isRead ? 400 : 500,
                    }}>
                      {notif.message}
                    </p>

                    {/* Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.375rem' }}>
                      <span style={{ fontSize: '0.675rem', color: '#9ca3af' }}>
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>

                      {/* Doctor: accept / decline */}
                      {role === 'doctor' && notif.type === 'doctor_request' && !notif.isRead && (
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button
                            onClick={() => handleAccept(notif)}
                            disabled={!!isActing}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.3rem',
                              padding: '0.3rem 0.75rem',
                              background: '#16a34a', color: '#fff',
                              border: 'none', borderRadius: 6,
                              fontSize: '0.75rem', fontWeight: 600,
                              cursor: isActing ? 'not-allowed' : 'pointer',
                              opacity: isActing ? 0.6 : 1, fontFamily: 'inherit',
                            }}
                          >
                            <Check size={12} strokeWidth={2.5} />
                            {isActing === 'accepting' ? 'Accepting…' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleDecline(notif)}
                            disabled={!!isActing}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.3rem',
                              padding: '0.3rem 0.75rem',
                              background: '#fff', color: '#dc2626',
                              border: '1px solid #fca5a5', borderRadius: 6,
                              fontSize: '0.75rem', fontWeight: 600,
                              cursor: isActing ? 'not-allowed' : 'pointer',
                              opacity: isActing ? 0.6 : 1, fontFamily: 'inherit',
                            }}
                          >
                            <X size={12} strokeWidth={2.5} />
                            {isActing === 'declining' ? 'Declining…' : 'Decline'}
                          </button>
                        </div>
                      )}

                      {/* Patient / other: dismiss */}
                      {!notif.isRead && role !== 'doctor' && (
                        <button
                          onClick={() => markRead(notif.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: '0.7rem', color: '#6b7280', fontFamily: 'inherit',
                          }}
                        >
                          <X size={11} strokeWidth={2} /> Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PatientDetailRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
      <Icon size={11} color="#9ca3af" strokeWidth={2} />
      <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{label}:</span>
      <span style={{ fontSize: '0.7rem', color: '#374151', fontWeight: 600 }}>{value}</span>
    </div>
  )
}