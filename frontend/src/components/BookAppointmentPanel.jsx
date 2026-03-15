/**
 * BookAppointmentPanel.jsx
 *
 * Full appointment booking panel for patients.
 * Features:
 *  - Online / Offline toggle
 *  - Date & time picker (shows only future slots)
 *  - Duration selector (30 / 45 / 60 min)
 *  - Reason text area
 *  - Offline: clinic address field
 *  - Online:  shows auto-generated Google Meet link after confirmation
 *  - Appointment history table with status badges + Meet join button
 *  - Cancel pending/confirmed appointments
 */

import { useState, useEffect, useCallback } from 'react'
import {
  CalendarDays, Video, MapPin, Clock, ChevronRight,
  CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw,
  ExternalLink, X, Plus, Calendar,
} from 'lucide-react'
import api from '../utils/api'
import { useToast } from './ToastProvider'

/* ── constants ──────────────────────────────────────────────────── */
const DURATIONS = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
]

const STATUS_STYLE = {
  pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  label: 'Pending'   },
  confirmed: { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  label: 'Confirmed' },
  declined:  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   label: 'Declined'  },
  cancelled: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)', label: 'Cancelled' },
  completed: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)',  label: 'Completed' },
}

/* ── tiny atoms ─────────────────────────────────────────────────── */
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

function SectionHead({ title, subtitle }) {
  return (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
    </div>
  )
}

function Label({ children, required }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
      {children}{required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
    </label>
  )
}

function FieldWrap({ children, style = {} }) {
  return <div style={{ marginBottom: 16, ...style }}>{children}</div>
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

/* ── main component ─────────────────────────────────────────────── */
export default function BookAppointmentPanel({ assignedDoctorId, assignedDoctorName }) {
  const { showToast } = useToast()

  // view state: 'list' | 'form'
  const [view,         setView]         = useState('list')
  const [appointments, setAppointments] = useState([])
  const [loadingList,  setLoadingList]  = useState(true)
  const [submitting,   setSubmitting]   = useState(false)
  const [cancelling,   setCancelling]   = useState({})

  // form state
  const [apptType,   setApptType]   = useState('online')   // 'online' | 'offline'
  const [date,       setDate]       = useState('')
  const [time,       setTime]       = useState('')
  const [duration,   setDuration]   = useState(30)
  const [reason,     setReason]     = useState('')
  const [location,   setLocation]   = useState('')
  const [formError,  setFormError]  = useState('')

  /* ── fetch list ── */
  const fetchAppointments = useCallback(() => {
    setLoadingList(true)
    api.get('/appointments')
      .then(r => setAppointments(r.data.appointments || []))
      .catch(console.error)
      .finally(() => setLoadingList(false))
  }, [])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  /* ── submit booking ── */
  const handleSubmit = async () => {
    setFormError('')
    if (!date || !time) { setFormError('Please pick a date and time.'); return }
    if (apptType === 'offline' && !location.trim()) { setFormError('Please enter the clinic address.'); return }
    if (!assignedDoctorId) { setFormError('You need an assigned doctor to book an appointment.'); return }

    const isoDate = new Date(`${date}T${time}:00Z`).toISOString()

    setSubmitting(true)
    try {
      await api.post('/appointments', {
        doctor_id:        assignedDoctorId,
        appointment_date: isoDate,
        duration_mins:    duration,
        type:             apptType,
        reason:           reason.trim(),
        location:         apptType === 'offline' ? location.trim() : undefined,
      })
      showToast({
        type:    'appointment_booked',
        title:   'Appointment Requested',
        message: `Your ${apptType} appointment request has been sent to ${assignedDoctorName || 'your doctor'}.`,
      })
      setView('list')
      fetchAppointments()
      // reset form
      setDate(''); setTime(''); setDuration(30); setReason(''); setLocation('')
    } catch (e) {
      setFormError(e.response?.data?.detail || 'Failed to book appointment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── cancel ── */
  const handleCancel = async (apptId) => {
    setCancelling(p => ({ ...p, [apptId]: true }))
    try {
      await api.delete(`/appointments/${apptId}`)
      showToast({ type: 'info', title: 'Appointment Cancelled', message: 'Your doctor has been notified.' })
      fetchAppointments()
    } catch (e) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to cancel appointment.' })
    } finally {
      setCancelling(p => ({ ...p, [apptId]: false }))
    }
  }

  /* ── min date for picker = tomorrow ── */
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  /* ════════════════════════════════════════════
     RENDER: appointment list
  ═══════════════════════════════════════════ */
  if (view === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: "'Sora', sans-serif" }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Appointments</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Schedule and manage your appointments with {assignedDoctorName ? `Dr. ${assignedDoctorName}` : 'your doctor'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
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
            <button
              onClick={() => { if (!assignedDoctorId) { showToast({ type: 'error', title: 'No Doctor Assigned', message: 'Wait for a doctor to accept you before booking.' }); return } setView('form') }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 8,
                padding: '8px 16px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Plus size={14} strokeWidth={2.5} /> Book Appointment
            </button>
          </div>
        </div>

        {/* No doctor warning */}
        {!assignedDoctorId && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', borderRadius: 10,
            background: 'var(--warning-bg)', border: '1px solid var(--warning-border)',
            fontSize: 13, color: 'var(--warning)',
          }}>
            <AlertCircle size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
            You don't have an assigned doctor yet. Once a doctor accepts your request, you can book appointments.
          </div>
        )}

        {/* List */}
        <Card>
          <SectionHead title="Your Appointments" subtitle={`${appointments.length} total`} />
          {loadingList ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <Loader2 size={20} style={{ animation: 'spin 0.7s linear infinite', marginBottom: 8 }} />
              <div>Loading appointments…</div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : appointments.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <Calendar size={28} strokeWidth={1} style={{ marginBottom: 8, opacity: 0.25, color: 'var(--text-muted)' }} />
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>No appointments yet</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Book your first appointment above.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Date & Time', 'Doctor', 'Type', 'Duration', 'Status', 'Actions'].map(h => (
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
                  {appointments.map(appt => (
                    <tr
                      key={appt.id}
                      style={{ borderBottom: '1px solid var(--border-light)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Date */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                          {new Date(appt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {new Date(appt.appointment_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      {/* Doctor */}
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {appt.doctor_name || '—'}
                      </td>
                      {/* Type */}
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
                      {/* Duration */}
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} strokeWidth={2} /> {appt.duration_mins} min
                        </div>
                      </td>
                      {/* Status */}
                      <td style={{ padding: '12px 16px' }}>
                        <StatusBadge status={appt.status} />
                      </td>
                      {/* Actions */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {/* Meet link */}
                          {appt.type === 'online' && appt.status === 'confirmed' && appt.meet_link && (
                            <a
                              href={appt.meet_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '5px 10px', background: '#1a73e8', color: '#fff',
                                border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 600,
                                cursor: 'pointer', textDecoration: 'none', fontFamily: 'inherit',
                              }}
                            >
                              <Video size={11} strokeWidth={2} /> Join Meet
                              <ExternalLink size={10} strokeWidth={2} />
                            </a>
                          )}
                          {/* Offline location */}
                          {appt.type === 'offline' && appt.location && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 11, color: 'var(--text-muted)',
                            }}>
                              <MapPin size={11} strokeWidth={2} />
                              {appt.location.length > 24 ? appt.location.slice(0, 24) + '…' : appt.location}
                            </span>
                          )}
                          {/* Cancel */}
                          {['pending', 'confirmed'].includes(appt.status) && (
                            <button
                              onClick={() => handleCancel(appt.id)}
                              disabled={cancelling[appt.id]}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '5px 10px', background: 'var(--bg-card)',
                                color: 'var(--danger)', border: '1px solid var(--danger-border)',
                                borderRadius: 7, fontSize: 11, fontWeight: 600,
                                cursor: cancelling[appt.id] ? 'not-allowed' : 'pointer',
                                opacity: cancelling[appt.id] ? 0.6 : 1, fontFamily: 'inherit',
                              }}
                            >
                              <X size={11} strokeWidth={2.5} />
                              {cancelling[appt.id] ? 'Cancelling…' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    )
  }

  /* ════════════════════════════════════════════
     RENDER: booking form
  ═══════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: "'Sora', sans-serif" }}>

      {/* Back + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={() => setView('list')}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600,
            color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          ← Back
        </button>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Book Appointment
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
            with {assignedDoctorName ? `Dr. ${assignedDoctorName}` : 'your doctor'}
          </p>
        </div>
      </div>

      <Card>
        <SectionHead title="Appointment Details" subtitle="Fill in the details below to request an appointment" />
        <div style={{ padding: '20px 24px' }}>

          {/* Online / Offline toggle */}
          <FieldWrap>
            <Label required>Appointment Type</Label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { val: 'online',  icon: Video,  label: 'Online',   sub: 'Google Meet',  color: '#3b82f6' },
                { val: 'offline', icon: MapPin, label: 'In-Clinic', sub: 'Visit doctor', color: '#8b5cf6' },
              ].map(opt => {
                const Icon  = opt.icon
                const sel   = apptType === opt.val
                return (
                  <button
                    key={opt.val}
                    onClick={() => setApptType(opt.val)}
                    style={{
                      flex: 1, padding: '14px 16px',
                      borderRadius: 10, cursor: 'pointer',
                      border: sel ? `2px solid ${opt.color}` : '2px solid var(--border)',
                      background: sel ? `${opt.color}0d` : 'var(--bg-card2)',
                      display: 'flex', alignItems: 'center', gap: 10,
                      transition: 'border 0.15s, background 0.15s',
                      fontFamily: 'inherit', textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                      background: sel ? `${opt.color}20` : 'var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1px solid ${sel ? `${opt.color}40` : 'transparent'}`,
                    }}>
                      <Icon size={16} color={sel ? opt.color : 'var(--text-muted)'} strokeWidth={2} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: sel ? opt.color : 'var(--text-primary)' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{opt.sub}</div>
                    </div>
                    {sel && (
                      <CheckCircle size={15} color={opt.color} strokeWidth={2} style={{ marginLeft: 'auto' }} />
                    )}
                  </button>
                )
              })}
            </div>
          </FieldWrap>

          {/* Online info banner */}
          {apptType === 'online' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 9, marginBottom: 16,
              background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)',
              fontSize: 12, color: '#3b82f6',
            }}>
              <Video size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
              A Google Meet link will be automatically generated and shared once the doctor confirms.
            </div>
          )}

          {/* Date & Time row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <Label required>Date</Label>
              <input
                type="date"
                value={date}
                min={minDateStr}
                onChange={e => setDate(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg-card2)',
                  color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <Label required>Time (UTC)</Label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg-card2)',
                  color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Duration */}
          <FieldWrap>
            <Label>Duration</Label>
            <div style={{ display: 'flex', gap: 8 }}>
              {DURATIONS.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value)}
                  style={{
                    padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
                    border: duration === d.value ? '1.5px solid var(--brand)' : '1px solid var(--border)',
                    background: duration === d.value ? 'var(--brand-light)' : 'var(--bg-card2)',
                    color: duration === d.value ? 'var(--brand)' : 'var(--text-secondary)',
                    fontSize: 13, fontWeight: duration === d.value ? 700 : 400,
                    fontFamily: 'inherit', transition: 'all 0.12s',
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </FieldWrap>

          {/* Offline: location field */}
          {apptType === 'offline' && (
            <FieldWrap>
              <Label required>Clinic / Location Address</Label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. City Medical Center, Room 204"
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg-card2)',
                  color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </FieldWrap>
          )}

          {/* Reason */}
          <FieldWrap>
            <Label>Reason for Visit</Label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Briefly describe your symptoms or reason for the appointment…"
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg-card2)',
                color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit',
                outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          </FieldWrap>

          {/* Error */}
          {formError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 8, marginBottom: 14,
              background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
              fontSize: 13, color: 'var(--danger)',
            }}>
              <AlertCircle size={14} strokeWidth={2} style={{ flexShrink: 0 }} /> {formError}
            </div>
          )}

          {/* Submit */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setView('list')}
              style={{
                padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--bg-card)', color: 'var(--text-secondary)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 24px', borderRadius: 8, border: 'none',
                background: submitting ? 'var(--border)' : 'var(--brand)',
                color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}
            >
              {submitting
                ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Requesting…</>
                : <><CalendarDays size={14} strokeWidth={2} /> Request Appointment</>
              }
            </button>
          </div>
        </div>
      </Card>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}