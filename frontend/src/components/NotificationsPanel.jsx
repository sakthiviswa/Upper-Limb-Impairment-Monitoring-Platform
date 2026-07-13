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
  doctor_request:        { Icon: UserPlus,      color: '#2563EB', label: 'Patient Request'  },
  request_accepted:      { Icon: CheckCircle2,  color: '#22C55E', label: 'Accepted'         },
  request_declined:      { Icon: XCircle,       color: '#EF4444', label: 'Declined'         },
  session_completed:     { Icon: Dumbbell,      color: '#22C55E', label: 'Session'          },
  session_missed:        { Icon: AlertTriangle, color: '#F59E0B', label: 'Missed'           },
  session_reminder:      { Icon: Bell,          color: '#0EA5E9', label: 'Reminder'         },
  progress_milestone:    { Icon: Trophy,        color: '#22C55E', label: 'Milestone'        },
  progress_concern:      { Icon: TrendingDown,  color: '#EF4444', label: 'Concern'         },
  new_message:           { Icon: MessageSquare, color: '#2563EB', label: 'Message'          },
  appointment_booked:    { Icon: CalendarCheck, color: '#22C55E', label: 'Appt Confirmed'   },
  appointment_request:   { Icon: CalendarDays,  color: '#F59E0B', label: 'Appt Request'     },
  appointment_declined:  { Icon: XCircle,       color: '#EF4444', label: 'Appt Declined'    },
  appointment_cancelled: { Icon: XCircle,       color: '#64748B', label: 'Appt Cancelled'   },
  report_ready:          { Icon: FileBarChart2, color: '#0EA5E9', label: 'Report'           },
  profile_incomplete:    { Icon: ClipboardList, color: '#F59E0B', label: 'Profile'          },
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
    <div className="fp-empty">
      <div className="fp-spinner" />
      <div className="fp-empty__text">Loading notifications…</div>
    </div>
  )

  return (
    <div className="fp-card">
      <div className="fp-card__head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="fp-header__icon" style={{ width: 40, height: 40 }}>
            <Bell size={20} strokeWidth={2} />
          </div>
          <div>
            <h3 className="fp-card__title" style={{ fontSize: 18 }}>Notifications</h3>
            {unreadCount > 0 && (
              <p className="fp-card__sub">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <span className="fp-badge fp-badge--danger" style={{ marginLeft: 4 }}>{unreadCount}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" onClick={fetchNotifications} className="fp-btn fp-btn--ghost fp-btn--sm" title="Refresh">
            <RefreshCw size={16} strokeWidth={2} />
          </button>
          {unreadCount > 0 && (
            <button type="button" onClick={markAllRead} className="fp-btn fp-btn--secondary fp-btn--sm">
              Mark all read
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="fp-empty">
          <div className="fp-empty__icon">
            <Bell size={32} strokeWidth={1.5} />
          </div>
          <div className="fp-empty__title">No notifications yet</div>
          <div className="fp-empty__text">You&apos;re all caught up!</div>
        </div>
      ) : (
        <div style={{ maxHeight: 520, overflowY: 'auto' }}>
          {notifications.map((notif) => {
            const cfg = TYPE_CONFIG[notif.type] || DEFAULT_CFG
            const { Icon } = cfg
            const isActing = acting[notif.id]

            return (
              <div key={notif.id} className={`fp-list-item ${!notif.isRead ? 'fp-list-item--unread' : ''}`}
                style={{
                  cursor: 'default',
                  borderLeft: `3px solid ${notif.isRead ? 'transparent' : cfg.color}`,
                  background: notif.isRead ? 'var(--bg-card)' : `${cfg.color}0A`,
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: notif.isRead ? 'var(--bg-app)' : `${cfg.color}18`,
                  border: `1px solid ${notif.isRead ? 'var(--border)' : `${cfg.color}40`}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color={notif.isRead ? 'var(--text-muted)' : cfg.color} strokeWidth={2} />
                </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span className="fp-badge fp-badge--brand" style={{
                        color: notif.isRead ? 'var(--text-muted)' : cfg.color,
                        background: notif.isRead ? 'var(--bg-app)' : `${cfg.color}14`,
                        borderColor: notif.isRead ? 'var(--border)' : `${cfg.color}35`,
                      }}>
                        {cfg.label}
                      </span>
                      {!notif.isRead && <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color }} />}
                    </div>

                    {notif.type === 'doctor_request' && notif.patientDetails && (
                      <div className="fp-grid-2" style={{
                        background: 'var(--bg-app)', border: '1px solid var(--border)',
                        borderRadius: 8, padding: '10px 12px', marginBottom: 8, gap: '6px 16px',
                      }}>
                        <DetailRow icon={UserPlus}      label="Name"     value={notif.patientDetails.name} />
                        <DetailRow icon={CalendarCheck} label="Age"      value={notif.patientDetails.age ? `${notif.patientDetails.age} yrs` : '—'} />
                        <DetailRow icon={ClipboardList} label="Injury"   value={notif.patientDetails.injuryType || '—'} />
                        <DetailRow icon={AlertTriangle} label="Severity" value={notif.patientDetails.injurySeverity || '—'} />
                      </div>
                    )}

                    {notif.type === 'appointment_request' && notif.extra && (
                      <div className="fp-grid-2" style={{
                        background: 'var(--bg-app)', border: '1px solid var(--border)',
                        borderRadius: 8, padding: '10px 12px', marginBottom: 8, gap: '6px 16px',
                      }}>
                        <DetailRow icon={UserPlus}    label="Patient"   value={notif.extra.patient_name || '—'} />
                        <DetailRow icon={CalendarDays} label="Date"     value={notif.extra.appointment_date ? new Date(notif.extra.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'} />
                        <DetailRow icon={Video}       label="Type"      value={notif.extra.appointment_type === 'online' ? 'Online (Meet)' : 'In-Clinic'} />
                        <DetailRow icon={ClipboardList} label="Duration" value={notif.extra.duration_mins ? `${notif.extra.duration_mins} min` : '—'} />
                        {notif.extra.reason && (
                          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 2 }}>
                            <ClipboardList size={14} color="var(--text-muted)" strokeWidth={2} style={{ marginTop: 1, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Reason:</span>
                            <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, fontStyle: 'italic' }}>{notif.extra.reason}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {notif.type === 'appointment_booked' && notif.extra?.meet_link && (
                      <div className="fp-alert fp-alert--info" style={{ marginBottom: 8, alignItems: 'center' }}>
                        <Video size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>Your Google Meet link is ready</span>
                        <a
                          href={notif.extra.meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="fp-btn fp-btn--primary fp-btn--sm"
                          style={{ textDecoration: 'none' }}
                        >
                          <Video size={14} strokeWidth={2} /> Join Meet
                          <ExternalLink size={12} strokeWidth={2} />
                        </a>
                      </div>
                    )}

                    <p style={{
                      margin: '0 0 8px', fontSize: 14, lineHeight: 1.5,
                      color: notif.isRead ? 'var(--text-secondary)' : 'var(--text-primary)',
                      fontWeight: notif.isRead ? 400 : 500,
                    }}>
                      {notif.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>

                      <div style={{ display: 'flex', gap: 8 }}>
                        {role === 'doctor' && notif.type === 'doctor_request' && !notif.isRead && (
                          <>
                            <button type="button" onClick={() => handleAccept(notif)} disabled={!!isActing} className="fp-btn fp-btn--success fp-btn--sm">
                              <Check size={14} strokeWidth={2.5} />
                              {isActing === 'accepting' ? 'Accepting…' : 'Accept'}
                            </button>
                            <button type="button" onClick={() => handleDecline(notif)} disabled={!!isActing} className="fp-btn fp-btn--secondary fp-btn--sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}>
                              <X size={14} strokeWidth={2.5} />
                              {isActing === 'declining' ? 'Declining…' : 'Decline'}
                            </button>
                          </>
                        )}

                        {role === 'doctor' && notif.type === 'appointment_request' && !notif.isRead && (
                          <>
                            <button type="button" onClick={() => handleApptConfirm(notif)} disabled={!!isActing} className="fp-btn fp-btn--success fp-btn--sm">
                              <Check size={14} strokeWidth={2.5} />
                              {isActing === 'appt-confirming' ? 'Confirming…' : 'Confirm'}
                            </button>
                            <button type="button" onClick={() => handleApptDecline(notif)} disabled={!!isActing} className="fp-btn fp-btn--secondary fp-btn--sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}>
                              <X size={14} strokeWidth={2.5} />
                              {isActing === 'appt-declining' ? 'Declining…' : 'Decline'}
                            </button>
                          </>
                        )}

                        {!notif.isRead && role !== 'doctor' && !['appointment_booked'].includes(notif.type) && (
                          <button type="button" onClick={() => markRead(notif.id)} className="fp-btn fp-btn--ghost fp-btn--sm">
                            <X size={14} strokeWidth={2} /> Dismiss
                          </button>
                        )}

                        {!notif.isRead && role !== 'doctor' && notif.type === 'appointment_booked' && !notif.extra?.meet_link && (
                          <button type="button" onClick={() => markRead(notif.id)} className="fp-btn fp-btn--ghost fp-btn--sm">
                            <X size={14} strokeWidth={2} /> Dismiss
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

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <Icon size={11} color="var(--text-muted)" strokeWidth={2} />
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}:</span>
      <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
    </div>
  )
}