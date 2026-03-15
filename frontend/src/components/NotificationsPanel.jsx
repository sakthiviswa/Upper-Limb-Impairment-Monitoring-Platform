/**
 * NotificationsPanel.jsx — fully theme-aware via CSS variables
 * Updated: appointment_request, appointment_declined, appointment_cancelled types added.
 *          Doctor can Accept/Decline appointment requests inline.
 *          Patient sees Google Meet join button when appointment is confirmed.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  UserPlus, CheckCircle2, XCircle, Dumbbell, AlertTriangle,
  Bell, Trophy, TrendingDown, MessageSquare, CalendarCheck,
  FileBarChart2, ClipboardList, Check, X, RefreshCw,
  CalendarDays, Video, ExternalLink,
} from 'lucide-react'
import api from '../utils/api'
import { useToast } from './ToastProvider'

const TYPE_CONFIG = {
  doctor_request:        { Icon: UserPlus,      color: '#3b82f6', label: 'Patient Request'  },
  request_accepted:      { Icon: CheckCircle2,  color: '#10b981', label: 'Accepted'         },
  request_declined:      { Icon: XCircle,       color: '#ef4444', label: 'Declined'         },
  session_completed:     { Icon: Dumbbell,      color: '#0d9488', label: 'Session'          },
  session_missed:        { Icon: AlertTriangle, color: '#f59e0b', label: 'Missed'           },
  session_reminder:      { Icon: Bell,          color: '#8b5cf6', label: 'Reminder'         },
  progress_milestone:    { Icon: Trophy,        color: '#10b981', label: 'Milestone'        },
  progress_concern:      { Icon: TrendingDown,  color: '#ef4444', label: 'Concern'         },
  new_message:           { Icon: MessageSquare, color: '#db2777', label: 'Message'          },
  appointment_booked:    { Icon: CalendarCheck, color: '#10b981', label: 'Appt Confirmed'   },
  appointment_request:   { Icon: CalendarDays,  color: '#f59e0b', label: 'Appt Request'     },
  appointment_declined:  { Icon: XCircle,       color: '#ef4444', label: 'Appt Declined'    },
  appointment_cancelled: { Icon: XCircle,       color: '#6b7280', label: 'Appt Cancelled'   },
  report_ready:          { Icon: FileBarChart2, color: '#ea580c', label: 'Report'           },
  profile_incomplete:    { Icon: ClipboardList, color: '#f59e0b', label: 'Profile'          },
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
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchNotifications()
    const i = setInterval(fetchNotifications, 30000)
    return () => clearInterval(i)
  }, [fetchNotifications])

  // Sync unread count to parent only in an effect (never during render or inside setState)
  useEffect(() => {
    if (onCountChange) {
      const unread = notifications.filter(n => !n.isRead).length
      onCountChange(unread)
    }
  }, [notifications, onCountChange])

  const markRead = useCallback(async (notifId) => {
    await api.post(`/notifications/${notifId}/read`).catch(() => {})
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n))
  }, [])

  const markAllRead = async () => {
    await api.post('/notifications/read-all').catch(() => {})
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  /* ── Patient-request accept/decline ── */
  const handleAccept = async (notif) => {
    setActing(p => ({ ...p, [notif.id]: 'accepting' }))
    try {
      await api.post(`/doctor/accept-patient/${notif.senderId}`)
      await markRead(notif.id)
      showToast({
        type: 'request_accepted', title: 'Patient Accepted',
        message: `${notif.patientDetails?.name || 'Patient'} is now your assigned patient.`,
        actions: [{ label: 'Message', variant: 'primary', onClick: () => {} }],
      })
      fetchNotifications()
    } catch (e) {
      showToast({ type: 'error', title: 'Error', message: e.response?.data?.message || 'Failed to accept.' })
    } finally { setActing(p => ({ ...p, [notif.id]: null })) }
  }

  const handleDecline = async (notif) => {
    setActing(p => ({ ...p, [notif.id]: 'declining' }))
    try {
      await api.post(`/doctor/decline-patient/${notif.senderId}`)
      await markRead(notif.id)
      showToast({ type: 'request_declined', title: 'Patient Declined', message: 'The patient has been notified.' })
      fetchNotifications()
    } catch (e) {
      showToast({ type: 'error', title: 'Error', message: e.response?.data?.message || 'Failed to decline.' })
    } finally { setActing(p => ({ ...p, [notif.id]: null })) }
  }

  /* ── Appointment-request confirm/decline ── */
  const handleApptConfirm = async (notif) => {
    setActing(p => ({ ...p, [notif.id]: 'appt-confirming' }))
    try {
      const apptId = notif.extra?.appointment_id
      await api.post(`/appointments/${apptId}/respond`, { status: 'confirmed' })
      await markRead(notif.id)
      showToast({
        type: 'request_accepted', title: 'Appointment Confirmed',
        message: `${notif.extra?.patient_name || 'Patient'}'s appointment has been confirmed. They've been notified.`,
      })
      fetchNotifications()
    } catch (e) {
      showToast({ type: 'error', title: 'Error', message: e.response?.data?.detail || 'Failed to confirm.' })
    } finally { setActing(p => ({ ...p, [notif.id]: null })) }
  }

  const handleApptDecline = async (notif) => {
    setActing(p => ({ ...p, [notif.id]: 'appt-declining' }))
    try {
      const apptId = notif.extra?.appointment_id
      await api.post(`/appointments/${apptId}/respond`, { status: 'declined' })
      await markRead(notif.id)
      showToast({ type: 'request_declined', title: 'Appointment Declined', message: `${notif.extra?.patient_name || 'Patient'} has been notified.` })
      fetchNotifications()
    } catch (e) {
      showToast({ type: 'error', title: 'Error', message: e.response?.data?.detail || 'Failed to decline.' })
    } finally { setActing(p => ({ ...p, [notif.id]: null })) }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
      <RefreshCw size={18} style={{ marginBottom: 8, opacity: 0.4 }} />
      <div>Loading notifications…</div>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Sora', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={14} color="var(--text-secondary)" strokeWidth={2} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{ background: '#dc2626', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{unreadCount}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={fetchNotifications} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 2 }} title="Refresh">
            <RefreshCw size={13} strokeWidth={2} />
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--brand)', fontWeight: 600, fontFamily: 'inherit' }}>
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Bell size={28} strokeWidth={1} style={{ marginBottom: 8, opacity: 0.3 }} />
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No notifications yet</div>
          <div style={{ fontSize: 12 }}>You're all caught up!</div>
        </div>
      ) : (
        <div style={{ maxHeight: 520, overflowY: 'auto' }}>
          {notifications.map((notif) => {
            const cfg = TYPE_CONFIG[notif.type] || DEFAULT_CFG
            const { Icon } = cfg
            const isActing = acting[notif.id]

            return (
              <div key={notif.id} style={{
                padding: '14px 18px',
                background: notif.isRead ? 'var(--bg-card)' : `${cfg.color}08`,
                borderBottom: '1px solid var(--border-light)',
                borderLeft: `3px solid ${notif.isRead ? 'transparent' : cfg.color}`,
                transition: 'background 0.2s',
              }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  {/* Icon */}
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    background: notif.isRead ? 'var(--bg-card2)' : `${cfg.color}15`,
                    border: `1px solid ${notif.isRead ? 'var(--border)' : `${cfg.color}35`}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={15} color={notif.isRead ? 'var(--text-muted)' : cfg.color} strokeWidth={2} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Type label */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase',
                        color: notif.isRead ? 'var(--text-muted)' : cfg.color,
                        background: notif.isRead ? 'var(--bg-card2)' : `${cfg.color}12`,
                        border: `1px solid ${notif.isRead ? 'var(--border)' : `${cfg.color}30`}`,
                        borderRadius: 4, padding: '2px 6px',
                      }}>
                        {cfg.label}
                      </span>
                      {!notif.isRead && <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color }} />}
                    </div>

                    {/* Patient detail card (for doctor_request) */}
                    {notif.type === 'doctor_request' && notif.patientDetails && (
                      <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', marginBottom: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                        <DetailRow icon={UserPlus}      label="Name"     value={notif.patientDetails.name} />
                        <DetailRow icon={CalendarCheck} label="Age"      value={notif.patientDetails.age ? `${notif.patientDetails.age} yrs` : '—'} />
                        <DetailRow icon={ClipboardList} label="Injury"   value={notif.patientDetails.injuryType || '—'} />
                        <DetailRow icon={AlertTriangle} label="Severity" value={notif.patientDetails.injurySeverity || '—'} />
                      </div>
                    )}

                    {/* Appointment detail card (for appointment_request) */}
                    {notif.type === 'appointment_request' && notif.extra && (
                      <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', marginBottom: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                        <DetailRow icon={UserPlus}    label="Patient"   value={notif.extra.patient_name || '—'} />
                        <DetailRow icon={CalendarDays} label="Date"     value={notif.extra.appointment_date ? new Date(notif.extra.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'} />
                        <DetailRow icon={Video}       label="Type"      value={notif.extra.appointment_type === 'online' ? 'Online (Meet)' : 'In-Clinic'} />
                        <DetailRow icon={ClipboardList} label="Duration" value={notif.extra.duration_mins ? `${notif.extra.duration_mins} min` : '—'} />
                        {notif.extra.reason && (
                          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'flex-start', gap: 4, marginTop: 2 }}>
                            <ClipboardList size={11} color="var(--text-muted)" strokeWidth={2} style={{ marginTop: 1, flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Reason:</span>
                            <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 500, fontStyle: 'italic' }}>{notif.extra.reason}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Confirmed appointment — show Meet link for patient */}
                    {notif.type === 'appointment_booked' && notif.extra?.meet_link && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 10px', borderRadius: 8, marginBottom: 6,
                        background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)',
                        fontSize: 12,
                      }}>
                        <Video size={13} color="#3b82f6" strokeWidth={2} style={{ flexShrink: 0 }} />
                        <span style={{ color: 'var(--text-secondary)', flex: 1 }}>Your Google Meet link is ready</span>
                        <a
                          href={notif.extra.meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '4px 10px', background: '#1a73e8', color: '#fff',
                            borderRadius: 6, fontSize: 11, fontWeight: 600, textDecoration: 'none',
                          }}
                        >
                          <Video size={11} strokeWidth={2} /> Join Meet
                          <ExternalLink size={10} strokeWidth={2} />
                        </a>
                      </div>
                    )}

                    {/* Message */}
                    <p style={{ margin: '0 0 6px', fontSize: 13, color: notif.isRead ? 'var(--text-secondary)' : 'var(--text-primary)', lineHeight: 1.5, fontWeight: notif.isRead ? 400 : 500 }}>
                      {notif.message}
                    </p>

                    {/* Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>

                      <div style={{ display: 'flex', gap: 6 }}>
                        {/* Doctor: accept/decline PATIENT request */}
                        {role === 'doctor' && notif.type === 'doctor_request' && !notif.isRead && (
                          <>
                            <button onClick={() => handleAccept(notif)} disabled={!!isActing}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: isActing ? 'not-allowed' : 'pointer', opacity: isActing ? 0.6 : 1, fontFamily: 'inherit' }}>
                              <Check size={12} strokeWidth={2.5} />
                              {isActing === 'accepting' ? 'Accepting…' : 'Accept'}
                            </button>
                            <button onClick={() => handleDecline(notif)} disabled={!!isActing}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', background: 'var(--bg-card)', color: 'var(--danger)', border: '1px solid var(--danger-border)', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: isActing ? 'not-allowed' : 'pointer', opacity: isActing ? 0.6 : 1, fontFamily: 'inherit' }}>
                              <X size={12} strokeWidth={2.5} />
                              {isActing === 'declining' ? 'Declining…' : 'Decline'}
                            </button>
                          </>
                        )}

                        {/* Doctor: confirm/decline APPOINTMENT request */}
                        {role === 'doctor' && notif.type === 'appointment_request' && !notif.isRead && (
                          <>
                            <button onClick={() => handleApptConfirm(notif)} disabled={!!isActing}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: isActing ? 'not-allowed' : 'pointer', opacity: isActing ? 0.6 : 1, fontFamily: 'inherit' }}>
                              <Check size={12} strokeWidth={2.5} />
                              {isActing === 'appt-confirming' ? 'Confirming…' : 'Confirm'}
                            </button>
                            <button onClick={() => handleApptDecline(notif)} disabled={!!isActing}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', background: 'var(--bg-card)', color: 'var(--danger)', border: '1px solid var(--danger-border)', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: isActing ? 'not-allowed' : 'pointer', opacity: isActing ? 0.6 : 1, fontFamily: 'inherit' }}>
                              <X size={12} strokeWidth={2.5} />
                              {isActing === 'appt-declining' ? 'Declining…' : 'Decline'}
                            </button>
                          </>
                        )}

                        {/* Patient: dismiss unread non-appointment notifications */}
                        {!notif.isRead && role !== 'doctor' && !['appointment_booked'].includes(notif.type) && (
                          <button onClick={() => markRead(notif.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                            <X size={11} strokeWidth={2} /> Dismiss
                          </button>
                        )}

                        {/* Patient: mark read for appointment_booked (keep meet link visible) */}
                        {!notif.isRead && role !== 'doctor' && notif.type === 'appointment_booked' && !notif.extra?.meet_link && (
                          <button onClick={() => markRead(notif.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                            <X size={11} strokeWidth={2} /> Dismiss
                          </button>
                        )}
                      </div>
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

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <Icon size={11} color="var(--text-muted)" strokeWidth={2} />
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}:</span>
      <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
    </div>
  )
}