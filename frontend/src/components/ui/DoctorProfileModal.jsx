/**
 * DoctorProfileModal.jsx
 * Full-screen modal showing a doctor's complete profile.
 * Opens when patient clicks "View Profile" on a DoctorCard.
 *
 * Props:
 *   doctorId   – number | null   (null = closed)
 *   onClose    – () => void
 *   onSelect   – (doctorId) => void   (optional – lets patient select from modal)
 *   selected   – boolean              (is this doctor currently selected?)
 */

import { useState, useEffect } from 'react'
import api from '../../utils/api'
import {
  X, Star, Award, Users, MapPin, Globe, Briefcase,
  GraduationCap, Building2, BadgeCheck, Clock, Phone,
  Mail, User, CheckCircle, Calendar, Activity, Check,
  Stethoscope, Languages, DollarSign, Info,
} from 'lucide-react'

/* ─── tiny helpers ────────────────────────────────────────────────── */
function Pill({ icon: Icon, text, color }) {
  if (!text) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 10px', borderRadius: 20,
      background: 'var(--bg-card2)', border: '1px solid var(--border)',
      fontSize: 12, color: color || 'var(--text-secondary)', fontWeight: 500,
    }}>
      {Icon && <Icon size={11} color={color || 'var(--text-muted)'} strokeWidth={2} />}
      {text}
    </span>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border-light)', alignItems: 'flex-start' }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <Icon size={13} color="var(--brand)" strokeWidth={2} />
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  )
}

function StatBox({ value, label }) {
  if (value == null) return null
  return (
    <div style={{ textAlign: 'center', padding: '12px 16px', background: 'var(--bg-card2)', borderRadius: 10, border: '1px solid var(--border)', flex: 1 }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--brand)', letterSpacing: '-0.03em' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>{label}</div>
    </div>
  )
}

/* ─── main component ──────────────────────────────────────────────── */
export default function DoctorProfileModal({ doctorId, onClose, onSelect, selected }) {
  const [doctor,  setDoctor]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!doctorId) { setDoctor(null); return }
    setLoading(true); setError('')
    api.get(`/doctor/profile/${doctorId}`)
      .then(r => setDoctor(r.data))
      .catch(() => setError('Could not load doctor profile.'))
      .finally(() => setLoading(false))
  }, [doctorId])

  if (!doctorId) return null

  const initials = (doctor?.name || '')
    .split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('')

  /* click-outside to close */
  const handleBackdrop = e => { if (e.target === e.currentTarget) onClose() }

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div style={{
        background: 'var(--bg-page)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto',
        fontFamily: "'Sora', sans-serif",
        position: 'relative',
      }}>
        {/* ── Close button ── */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14, zIndex: 10,
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--bg-card2)', border: '1px solid var(--border)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={15} color="var(--text-muted)" strokeWidth={2} />
        </button>

        {/* ── Loading / Error ── */}
        {loading && (
          <div style={{ padding: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-muted)' }}>
            <div style={{ width: 20, height: 20, border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            Loading doctor profile…
          </div>
        )}
        {error && !loading && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)', fontSize: 13 }}>{error}</div>
        )}

        {doctor && !loading && (
          <>
            {/* ── Hero banner ── */}
            <div style={{
              background: 'linear-gradient(135deg, var(--brand) 0%, #6366f1 100%)',
              borderRadius: '18px 18px 0 0', padding: '28px 24px 20px',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* decorative circle */}
              <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
              <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', position: 'relative' }}>
                {/* Avatar */}
                <div style={{
                  width: 72, height: 72, borderRadius: 16,
                  background: 'rgba(255,255,255,0.2)',
                  border: '2.5px solid rgba(255,255,255,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, fontWeight: 800, color: '#fff', flexShrink: 0,
                  overflow: 'hidden',
                }}>
                  {doctor.profile_image
                    ? <img src={doctor.profile_image} alt={doctor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (initials || <User size={28} color="#fff" />)
                  }
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                      Dr. {doctor.name}
                    </h2>
                    {doctor.verified && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '2px 8px', fontSize: 11, color: '#fff', fontWeight: 700 }}>
                        <BadgeCheck size={11} color="#fff" strokeWidth={2.5} /> Verified
                      </span>
                    )}
                  </div>
                  {doctor.specialization && (
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 3, fontWeight: 500 }}>
                      {doctor.specialization}
                    </div>
                  )}
                  {doctor.hospital && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                      <Building2 size={11} strokeWidth={2} /> {doctor.hospital}
                    </div>
                  )}
                </div>
              </div>

              {/* Rating row */}
              {doctor.rating != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, position: 'relative' }}>
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={13} fill={i <= Math.round(doctor.rating) ? '#fbbf24' : 'none'} color="#fbbf24" strokeWidth={2} />
                  ))}
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{doctor.rating}</span>
                  {doctor.review_count != null && (
                    <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>({doctor.review_count} reviews)</span>
                  )}
                </div>
              )}
            </div>

            {/* ── Stats row ── */}
            <div style={{ display: 'flex', gap: 10, padding: '16px 20px 0' }}>
              <StatBox value={doctor.experience != null ? `${doctor.experience} yrs` : null} label="Experience" />
              <StatBox value={doctor.patients_count != null ? doctor.patients_count : null} label="Patients" />
              <StatBox value={doctor.consult_fee || null} label="Consult Fee" />
            </div>

            {/* ── Body ── */}
            <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Bio */}
              {doctor.bio && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>About</div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{doctor.bio}</p>
                </div>
              )}

              {/* Details */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Details</div>
                <InfoRow icon={GraduationCap} label="Qualification"  value={doctor.qualification} />
                <InfoRow icon={MapPin}         label="Location"       value={doctor.location} />
                <InfoRow icon={Languages}      label="Languages"      value={doctor.languages} />
                <InfoRow icon={Clock}          label="Availability"   value={doctor.availability} />
                <InfoRow icon={Mail}           label="Email"          value={doctor.email} />
              </div>

              {/* Specialty tags */}
              {doctor.specialization && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <Pill icon={Stethoscope} text={doctor.specialization} color="var(--brand)" />
                  {doctor.qualification && <Pill icon={GraduationCap} text={doctor.qualification} />}
                  {doctor.location      && <Pill icon={MapPin}         text={doctor.location} />}
                  {doctor.languages     && <Pill icon={Globe}          text={doctor.languages} />}
                </div>
              )}

              {/* Action button */}
              {onSelect && (
                <button
                  onClick={() => { onSelect(doctor.id); onClose() }}
                  disabled={selected}
                  style={{
                    width: '100%', padding: '12px', marginTop: 4,
                    background: selected ? 'var(--success-bg)' : 'var(--brand)',
                    border: selected ? '1.5px solid var(--success-border)' : 'none',
                    borderRadius: 10, cursor: selected ? 'default' : 'pointer',
                    fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                    color: selected ? 'var(--success)' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {selected
                    ? <><CheckCircle size={16} strokeWidth={2} /> Selected as Your Doctor</>
                    : <><Check size={16} strokeWidth={2.5} /> Select This Doctor</>
                  }
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}