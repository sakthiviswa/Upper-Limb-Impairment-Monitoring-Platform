/**
 * DoctorAppointmentsPanel.jsx
 *
 * Doctor-side appointment management panel.
 * Features:
 *  - Pending requests with Accept / Decline actions
 *  - Upcoming confirmed appointments with Google Meet link (online)
 *  - Past / cancelled appointments history
 *  - Auto-refreshes every 30s (mirrors NotificationsPanel pattern)
 */

import { useState, useEffect, useCallback } from 'react'
import {
  CalendarDays, Video, MapPin, Clock, Check, X,
  RefreshCw, Loader2, ExternalLink, Calendar,
  AlertCircle, ChevronDown,
} from 'lucide-react'
import api from '../utils/api'
import { useToast } from './ToastProvider'

/* ── status styles ──────────────────────────────────────────────── */
const STATUS_STYLE = {
  pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  label: 'Pending'   },
  confirmed: { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  label: 'Confirmed' },
  declined:  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   label: 'Declined'  },
  cancelled: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)', label: 'Cancelled' },
  completed: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)',  label: 'Completed' },
}

/* ── atoms ──────────────────────────────────────────────────────── */
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, boxShadow: 'var(--shadow-sm)', overflow: 'hidden', ...style,
    }}>
      {children}
    </div>
  )
}

function SectionHead({ title, subtitle, action }) {
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

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />
      {s.label}
    </span>
  )
}

function DateDisplay({ iso }) {
  const d = new Date(iso)
  return (
    <div>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
        {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
        {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}

/* ── main ───────────────────────────────────────────────────────── */
export default function DoctorAppointmentsPanel() {
  const { showToast }  = useToast()

  const [appointments, setAppointments] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [acting,       setActing]       = useState({})
  const [showHistory,  setShowHistory]  = useState(false)

  const fetchAppointments = useCallback(() => {
    api.get('/appointments')
      .then(r => setAppointments(r.data.appointments || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchAppointments()
    const id = setInterval(fetchAppointments, 30000)
    return () => clearInterval(id)
  }, [fetchAppointments])

  /* ── respond ── */
  const respond = async (apptId, status, patientName) => {
    setActing(p => ({ ...p, [apptId]: status }))
    try {
      await api.post(`/appointments/${apptId}/respond`, { status })
      const confirmed = status === 'confirmed'
      showToast({
        type:    confirmed ? 'request_accepted' : 'request_declined',
        title:   confirmed ? 'Appointment Confirmed' : 'Appointment Declined',
        message: confirmed
          ? `${patientName}'s appointment has been confirmed. They've been notified.`
          : `${patientName} has been notified of the decline.`,
      })
      fetchAppointments()
    } catch (e) {
      showToast({ type: 'error', title: 'Error', message: e.response?.data?.detail || 'Failed to update appointment.' })
    } finally {
      setActing(p => ({ ...p, [apptId]: null }))
    }
  }

  /* ── cancel ── */
  const handleCancel = async (apptId, patientName) => {
    setActing(p => ({ ...p, [apptId]: 'cancelling' }))
    try {
      await api.delete(`/appointments/${apptId}`)
      showToast({ type: 'info', title: 'Appointment Cancelled', message: `${patientName} has been notified.` })
      fetchAppointments()
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'Failed to cancel.' })
    } finally {
      setActing(p => ({ ...p, [apptId]: null }))
    }
  }

  /* ── split lists ── */
  const pending   = appointments.filter(a => a.status === 'pending')
  const upcoming  = appointments.filter(a => a.status === 'confirmed' && new Date(a.appointment_date) > new Date())
  const history   = appointments.filter(a => !['pending'].includes(a.status) && !(a.status === 'confirmed' && new Date(a.appointment_date) > new Date()))

  if (loading) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
      <Loader2 size={20} style={{ animation: 'spin 0.7s linear infinite', marginBottom: 8 }} />
      <div>Loading appointments…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'Sora', sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Appointments</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Manage patient appointment requests and your schedule
          </p>
        </div>
        <button
          onClick={fetchAppointments}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            color: 'var(--text-muted)', boxShadow: 'var(--shadow-sm)',
          }}
          title="Refresh"
        >
          <RefreshCw size={14} strokeWidth={2} />
        </button>
      </div>

      {/* ── Pending requests ── */}
      {pending.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Pending Requests ({pending.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.map(appt => (
              <div key={appt.id} style={{
                background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: 12, padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  {/* Left: info */}
                  <div style={{ display: 'flex', gap: 14, flex: 1 }}>
                    {/* Type icon */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                      background: appt.type === 'online' ? 'rgba(59,130,246,0.1)' : 'rgba(139,92,246,0.1)',
                      border: `1px solid ${appt.type === 'online' ? 'rgba(59,130,246,0.25)' : 'rgba(139,92,246,0.25)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {appt.type === 'online'
                        ? <Video size={18} color="#3b82f6" strokeWidth={2} />
                        : <MapPin size={18} color="#8b5cf6" strokeWidth={2} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                        {appt.patient_name || 'Patient'}
                      </div>
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CalendarDays size={11} strokeWidth={2} />
                          {new Date(appt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} strokeWidth={2} />
                          {new Date(appt.appointment_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · {appt.duration_mins} min
                        </span>
                        <span style={{
                          fontWeight: 600,
                          color: appt.type === 'online' ? '#3b82f6' : '#8b5cf6',
                        }}>
                          {appt.type === 'online' ? 'Online (Meet)' : 'In-Clinic'}
                        </span>
                      </div>
                      {appt.reason && (
                        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          "{appt.reason}"
                        </div>
                      )}
                      {appt.type === 'offline' && appt.location && (
                        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={11} strokeWidth={2} /> {appt.location}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Right: actions */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => respond(appt.id, 'confirmed', appt.patient_name)}
                      disabled={!!acting[appt.id]}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '9px 18px', background: 'var(--success)', color: '#fff',
                        border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: acting[appt.id] ? 'not-allowed' : 'pointer',
                        opacity: acting[appt.id] ? 0.6 : 1, fontFamily: 'inherit',
                      }}
                    >
                      <Check size={13} strokeWidth={2.5} />
                      {acting[appt.id] === 'confirmed' ? 'Confirming…' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => respond(appt.id, 'declined', appt.patient_name)}
                      disabled={!!acting[appt.id]}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '9px 18px', background: 'var(--bg-card)',
                        color: 'var(--danger)', border: '1px solid var(--danger-border)',
                        borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: acting[appt.id] ? 'not-allowed' : 'pointer',
                        opacity: acting[appt.id] ? 0.6 : 1, fontFamily: 'inherit',
                      }}
                    >
                      <X size={13} strokeWidth={2.5} />
                      {acting[appt.id] === 'declined' ? 'Declining…' : 'Decline'}
                    </button>
                  </div>
                </div>

                {/* Meet link preview for online (shown after inline) */}
                {appt.type === 'online' && appt.meet_link && (
                  <div style={{
                    marginTop: 12, padding: '10px 12px', borderRadius: 8,
                    background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)',
                    display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
                  }}>
                    <Video size={13} color="#3b82f6" strokeWidth={2} />
                    <span style={{ color: 'var(--text-secondary)', flex: 1 }}>
                      Meet link ready — will be shared with patient upon confirmation:
                    </span>
                    <a
                      href={appt.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#1a73e8', fontWeight: 600, textDecoration: 'none',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      {appt.meet_link} <ExternalLink size={11} strokeWidth={2} />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Upcoming confirmed ── */}
      <Card>
        <SectionHead
          title="Upcoming Appointments"
          subtitle={`${upcoming.length} confirmed`}
        />
        {upcoming.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center' }}>
            <Calendar size={24} strokeWidth={1} style={{ marginBottom: 8, opacity: 0.25, color: 'var(--text-muted)' }} />
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>No upcoming appointments</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Date & Time', 'Patient', 'Type', 'Duration', 'Meet / Location', 'Actions'].map(h => (
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
                {upcoming.map(appt => (
                  <tr
                    key={appt.id}
                    style={{ borderBottom: '1px solid var(--border-light)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px' }}><DateDisplay iso={appt.appointment_date} /></td>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {appt.patient_name || '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 12, fontWeight: 600,
                        color: appt.type === 'online' ? '#3b82f6' : '#8b5cf6',
                      }}>
                        {appt.type === 'online'
                          ? <Video size={12} strokeWidth={2} />
                          : <MapPin size={12} strokeWidth={2} />}
                        {appt.type === 'online' ? 'Online' : 'In-Clinic'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} strokeWidth={2} /> {appt.duration_mins} min
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {appt.type === 'online' && appt.meet_link ? (
                        <a
                          href={appt.meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '5px 10px', background: '#1a73e8', color: '#fff',
                            borderRadius: 7, fontSize: 11, fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          <Video size={11} strokeWidth={2} /> Join Meet
                          <ExternalLink size={10} strokeWidth={2} />
                        </a>
                      ) : appt.location ? (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={11} strokeWidth={2} />
                          {appt.location.length > 28 ? appt.location.slice(0, 28) + '…' : appt.location}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => handleCancel(appt.id, appt.patient_name)}
                        disabled={!!acting[appt.id]}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '5px 10px', background: 'var(--bg-card)',
                          color: 'var(--danger)', border: '1px solid var(--danger-border)',
                          borderRadius: 7, fontSize: 11, fontWeight: 600,
                          cursor: acting[appt.id] ? 'not-allowed' : 'pointer',
                          opacity: acting[appt.id] ? 0.6 : 1, fontFamily: 'inherit',
                        }}
                      >
                        <X size={11} strokeWidth={2.5} />
                        {acting[appt.id] === 'cancelling' ? 'Cancelling…' : 'Cancel'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── History (collapsible) ── */}
      {history.length > 0 && (
        <Card>
          <button
            onClick={() => setShowHistory(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '14px 20px', background: 'none', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>
              Past & Cancelled ({history.length})
            </div>
            <ChevronDown size={14} color="var(--text-muted)" style={{ transform: showHistory ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {showHistory && (
            <div style={{ borderTop: '1px solid var(--border-light)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Date & Time', 'Patient', 'Type', 'Status'].map(h => (
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
                  {history.map(appt => (
                    <tr
                      key={appt.id}
                      style={{ borderBottom: '1px solid var(--border-light)', opacity: 0.7 }}
                    >
                      <td style={{ padding: '12px 16px' }}><DateDisplay iso={appt.appointment_date} /></td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {appt.patient_name || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12,
                          color: appt.type === 'online' ? '#3b82f6' : '#8b5cf6', fontWeight: 600,
                        }}>
                          {appt.type === 'online' ? <Video size={12} strokeWidth={2} /> : <MapPin size={12} strokeWidth={2} />}
                          {appt.type === 'online' ? 'Online' : 'In-Clinic'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <StatusBadge status={appt.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}