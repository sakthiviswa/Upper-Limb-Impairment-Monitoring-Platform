/**
 * ProfileSettings.jsx — fully theme-aware via CSS variables
 * UPDATED: DoctorCard now has a "View Profile" button that opens DoctorProfileModal.
 *          All original features preserved.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { useLocation } from 'react-router-dom'
import { useToast } from './ToastProvider'
import DoctorProfileModal from './ui/DoctorProfileModal'          // ← NEW IMPORT
import {
  User, Mail, Phone, Calendar, Shield, Activity,
  CheckCircle, Clock, Star, Users, MapPin, Award,
  Check, AlertCircle, Info, Bell, Settings,
  Briefcase, GraduationCap, Building2, Globe, BadgeCheck, Eye,
  Stethoscope,
} from 'lucide-react'

/* ── Shared input styles injected once ─────────────────────────────── */
const INPUT_STYLES = `
  .ps-input, .ps-select {
    width: 100%;
    padding: 9px 12px;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 13px;
    color: var(--text-primary);
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .ps-input:focus, .ps-select:focus {
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
  }
  .ps-input:disabled, .ps-select:disabled, fieldset[disabled] .ps-input, fieldset[disabled] .ps-select {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .ps-select { appearance: none; cursor: pointer; }
  .ps-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .ps-field { margin-bottom: 12px; }
  .ps-radio-group { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .ps-radio-label {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px;
    background: var(--bg-card2); border: 1px solid var(--border);
    border-radius: 7px; cursor: pointer; font-size: 12px;
    color: var(--text-secondary); font-weight: 500; user-select: none;
    transition: background 0.12s, border-color 0.12s, color 0.12s;
  }
  .ps-radio-label:has(input:checked) {
    background: var(--bg-active);
    border-color: var(--brand);
    color: var(--brand);
    font-weight: 600;
  }
  .ps-radio-label input { display: none; }
`

function Card({ children, style = {} }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-sm)', padding: '1.25rem', ...style }}>
      {children}
    </div>
  )
}

function SectionHead({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border-light)' }}>
      {children}
    </div>
  )
}

export default function ProfileSettings({ viewMode: propViewMode }) {
  const { user } = useAuth()
  const role = user?.role
  const location = useLocation()
  const { showToast } = useToast()
  const viewMode = propViewMode !== undefined ? propViewMode : location.pathname === '/profile'

  const [form, setForm] = useState({
    fullName: '', age: '', gender: '', phoneNumber: '',
    injuredArm: '', injuryType: '', injurySeverity: '',
    dateOfInjury: '', selectedDoctorId: '',
    sessionDuration: '', difficultyLevel: '', reminderEnabled: false,
    // Doctor fields
    specialization: '', qualification: '', hospital: '', experience: '',
    location: '', languages: '', consultFee: '', bio: '', availability: '',
  })
  const [doctors, setDoctors]               = useState([])
  const [doctorsLoading, setDoctorsLoading] = useState(false)
  const [loading, setLoading]               = useState(true)
  const [saving, setSaving]                 = useState(false)
  const [error, setError]                   = useState('')
  const [success, setSuccess]               = useState('')
  const [doctorAccepted, setDoctorAccepted] = useState(false)
  const [assignedDoctor, setAssignedDoctor] = useState('')
  const [notifiedDoctor, setNotifiedDoctor] = useState(false)

  // ── NEW: modal state ────────────────────────────────────────────────
  const [viewingDoctorId, setViewingDoctorId] = useState(null)

  useEffect(() => {
    if (role !== 'patient') return
    setDoctorsLoading(true)
    api.get('/doctors').then(r => setDoctors(r.data.doctors || [])).catch(console.error).finally(() => setDoctorsLoading(false))
  }, [role])

  useEffect(() => {
    let mounted = true
    api.get('/user/profile')
      .then(res => {
        if (!mounted) return
        const base = { fullName: res.data.fullName || '', age: res.data.age || '', gender: res.data.gender || '', phoneNumber: res.data.phoneNumber || '' }
        if (role === 'patient') {
          setForm({ ...base, injuredArm: res.data.injuredArm || '', injuryType: res.data.injuryType || '', injurySeverity: res.data.injurySeverity || '', dateOfInjury: res.data.dateOfInjury || '', selectedDoctorId: res.data.selectedDoctorId || '', sessionDuration: res.data.sessionDuration || '', difficultyLevel: res.data.difficultyLevel || '', reminderEnabled: res.data.reminderEnabled || false })
          setDoctorAccepted(res.data.doctorAccepted || false)
          setAssignedDoctor(res.data.doctorName || '')
        } else if (role === 'doctor') {
          setForm({
            ...base,
            specialization: res.data.specialization || '',
            qualification: res.data.qualification || '',
            hospital: res.data.hospital || '',
            experience: res.data.experience || '',
            location: res.data.location || '',
            languages: res.data.languages || '',
            consultFee: res.data.consult_fee || '',
            bio: res.data.bio || '',
            availability: res.data.availability || '',
          })
        } else {
          setForm({ ...base, injuredArm: '', injuryType: '', injurySeverity: '', dateOfInjury: '', selectedDoctorId: '', sessionDuration: '', difficultyLevel: '', reminderEnabled: false })
        }
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false))
    return () => { mounted = false }
  }, [role])

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const validate = () => {
    if (form.age && (form.age < 5 || form.age > 100)) { setError('Age must be between 5 and 100.'); return false }
    if (form.phoneNumber && !/^\d{10}$/.test(form.phoneNumber)) { setError('Phone must be 10 digits.'); return false }
    if (role === 'patient' && !form.injuredArm) { setError('Please select injured arm.'); return false }
    setError(''); return true
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (viewMode || !validate()) return
    setSaving(true); setSuccess(''); setNotifiedDoctor(false)
    const payload = { fullName: form.fullName, age: form.age, gender: form.gender, phoneNumber: form.phoneNumber }
    if (role === 'patient') Object.assign(payload, { injuredArm: form.injuredArm, injuryType: form.injuryType, injurySeverity: form.injurySeverity, dateOfInjury: form.dateOfInjury, selectedDoctorId: form.selectedDoctorId, sessionDuration: form.sessionDuration, difficultyLevel: form.difficultyLevel, reminderEnabled: form.reminderEnabled })
    if (role === 'doctor') Object.assign(payload, { specialization: form.specialization, qualification: form.qualification, hospital: form.hospital, experience: form.experience, location: form.location, languages: form.languages, consult_fee: form.consultFee, bio: form.bio, availability: form.availability })
    
    const endpoint = role === 'doctor' ? '/doctor/profile' : '/user/profile'
    
    try {
      const res = await api.put(endpoint, payload)
      const msg = res.data.notifiedDoctor ? 'Profile saved & doctor notified.' : 'Profile saved successfully.'
      setSuccess(msg)
      if (res.data.notifiedDoctor) setNotifiedDoctor(true)
      if (res.data.profile) { setDoctorAccepted(res.data.profile.doctorAccepted || false); setAssignedDoctor(res.data.profile.doctorName || '') }
      showToast({ type: 'profile_saved', title: 'Profile Saved', message: msg })
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to update profile.'
      setError(msg)
      showToast({ type: 'error', title: 'Save Failed', message: msg })
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: 10, color: 'var(--text-muted)' }}>
      <div style={{ width: 22, height: 22, border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      Loading profile…
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'Sora', sans-serif", maxWidth: 720 }}>
      <style>{INPUT_STYLES}</style>

      {/* ── NEW: Doctor Profile Modal ──────────────────────────────── */}
      <DoctorProfileModal
        doctorId={viewingDoctorId}
        onClose={() => setViewingDoctorId(null)}
        selected={String(form.selectedDoctorId) === String(viewingDoctorId)}
        onSelect={!viewMode ? (id) => setForm(p => ({ ...p, selectedDoctorId: String(id) })) : undefined}
      />

      {/* Page header */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
          {viewMode ? 'My Profile' : 'Profile Settings'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          {viewMode ? 'View your personal and medical information' : 'Update your personal and medical details'}
        </p>
      </div>

      {/* Doctor banner */}
      {role === 'patient' && (
        <div style={{
          padding: '12px 16px', borderRadius: 10,
          background: doctorAccepted ? 'var(--success-bg)' : 'var(--warning-bg)',
          border: `1px solid ${doctorAccepted ? 'var(--success-border)' : 'var(--warning-border)'}`,
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
          color: doctorAccepted ? 'var(--success)' : 'var(--warning)',
        }}>
          {doctorAccepted
            ? <CheckCircle size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
            : <Clock size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
          }
          {doctorAccepted
            ? <span><strong>Doctor assigned:</strong> Dr. {assignedDoctor} has accepted your request.</span>
            : <span>{form.selectedDoctorId ? 'Request sent. Waiting for doctor to accept…' : 'Select a doctor and save your profile to send a care request.'}</span>
          }
        </div>
      )}

      {/* Alerts */}
      {error && <Alert variant="danger"  icon={AlertCircle}>{error}</Alert>}
      {success && <Alert variant="success" icon={CheckCircle}>{success}</Alert>}
      {notifiedDoctor && <Alert variant="info" icon={Info}><strong>Doctor notified!</strong> They have been sent your profile details.</Alert>}

      <form onSubmit={handleSubmit}>
        <fieldset disabled={viewMode} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Personal Info */}
          <Card>
            <SectionHead>Personal Information</SectionHead>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="Full Name" icon={User}>
                <input className="ps-input" type="text" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Your full name" />
              </Field>
              <Field label="Age" icon={Calendar}>
                <input className="ps-input" type="number" name="age" value={form.age} onChange={handleChange} min="5" max="100" placeholder="Age" />
              </Field>
              <Field label="Gender" icon={User}>
                <select className="ps-select" name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">Select</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </Field>
              <Field label="Phone Number" icon={Phone}>
                <input className="ps-input" type="text" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} maxLength={10} placeholder="10-digit number" />
              </Field>
            </div>
          </Card>

          {role === 'doctor' && (
            <>
              {/* Doctor Profile */}  
              <Card>
                <SectionHead>Professional Information</SectionHead>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <Field label="Specialization" icon={Stethoscope}>
                    <input className="ps-input" type="text" name="specialization" value={form.specialization} onChange={handleChange} placeholder="e.g. Orthopedic Rehab" />
                  </Field>
                  <Field label="Qualification" icon={GraduationCap}>
                    <input className="ps-input" type="text" name="qualification" value={form.qualification} onChange={handleChange} placeholder="e.g. MBBS, MS Ortho" />
                  </Field>
                  <Field label="Hospital/Clinic" icon={Building2}>
                    <input className="ps-input" type="text" name="hospital" value={form.hospital} onChange={handleChange} placeholder="e.g. Apollo Hospitals" />
                  </Field>
                  <Field label="Experience (years)" icon={Award}>
                    <input className="ps-input" type="number" name="experience" value={form.experience} onChange={handleChange} min="0" placeholder="Years of experience" />
                  </Field>
                  <Field label="Location" icon={MapPin}>
                    <input className="ps-input" type="text" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Chennai, Tamil Nadu" />
                  </Field>
                  <Field label="Languages" icon={Globe}>
                    <input className="ps-input" type="text" name="languages" value={form.languages} onChange={handleChange} placeholder="e.g. English, Tamil" />
                  </Field>
                  <Field label="Consultation Fee" icon={Briefcase}>
                    <input className="ps-input" type="text" name="consultFee" value={form.consultFee} onChange={handleChange} placeholder="e.g. ₹500" />
                  </Field>
                  <Field label="Availability" icon={Clock}>
                    <input className="ps-input" type="text" name="availability" value={form.availability} onChange={handleChange} placeholder="e.g. Mon–Fri, 9am–5pm" />
                  </Field>
                </div>
                <div style={{ marginTop: 16 }}>
                  <Field label="Bio/About" icon={Info}>
                    <textarea 
                      className="ps-input" 
                      name="bio" 
                      value={form.bio} 
                      onChange={handleChange} 
                      placeholder="Tell patients about yourself, your approach to treatment, etc." 
                      rows={4} 
                      style={{ resize: 'vertical', minHeight: '80px' }}
                    />
                  </Field>
                </div>
              </Card>
            </>
          )}

          {role === 'patient' && (
            <>
              {/* Medical Info */}
              <Card>
                <SectionHead>Medical Information</SectionHead>
                <div style={{ marginBottom: 14 }}>
                  <div className="ps-label"><Activity size={11} strokeWidth={2} /> Injured Arm</div>
                  <div className="ps-radio-group">
                    {['Left Arm', 'Right Arm', 'Both Arms'].map(arm => (
                      <label className="ps-radio-label" key={arm}>
                        <input type="radio" name="injuredArm" value={arm} checked={form.injuredArm === arm} onChange={handleChange} />
                        {arm}
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <Field label="Injury Type" icon={Shield}>
                    <select className="ps-select" name="injuryType" value={form.injuryType} onChange={handleChange}>
                      <option value="">Select</option>
                      <option>Fracture</option><option>Muscle Tear</option>
                      <option>Nerve Injury</option><option>Post-Surgery</option><option>Other</option>
                    </select>
                  </Field>
                  <Field label="Injury Severity" icon={AlertCircle}>
                    <select className="ps-select" name="injurySeverity" value={form.injurySeverity} onChange={handleChange}>
                      <option value="">Select</option>
                      <option>Mild</option><option>Moderate</option><option>Severe</option>
                    </select>
                  </Field>
                  <Field label="Date of Injury" icon={Calendar}>
                    <input className="ps-input" type="date" name="dateOfInjury" value={form.dateOfInjury} onChange={handleChange} />
                  </Field>
                </div>
              </Card>

              {/* Doctor Selection */}
              <Card>
                <SectionHead>Select Your Doctor</SectionHead>
                {doctorAccepted ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 8, fontSize: 13, color: 'var(--success)', fontWeight: 500 }}>
                    <CheckCircle size={14} strokeWidth={2} /> Dr. {assignedDoctor} is your assigned doctor.
                  </div>
                ) : doctorsLoading ? (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '1rem 0' }}>Loading doctors…</div>
                ) : doctors.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '1rem 0' }}>No doctors available.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {doctors.map(doc => (
                      <DoctorCard
                        key={doc.id}
                        doc={doc}
                        selected={String(form.selectedDoctorId) === String(doc.id)}
                        disabled={viewMode}
                        onSelect={() => !viewMode && setForm(p => ({ ...p, selectedDoctorId: String(doc.id) }))}
                        onViewProfile={() => setViewingDoctorId(doc.id)}   // ← NEW
                      />
                    ))}
                  </div>
                )}
              </Card>

              {/* Rehab Preferences */}
              <Card>
                <SectionHead>Rehabilitation Preferences</SectionHead>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <Field label="Session Duration (sec)" icon={Clock}>
                    <input className="ps-input" type="number" name="sessionDuration" value={form.sessionDuration} onChange={handleChange} placeholder="e.g. 30" />
                  </Field>
                  <Field label="Difficulty Level" icon={Settings}>
                    <select className="ps-select" name="difficultyLevel" value={form.difficultyLevel} onChange={handleChange}>
                      <option value="">Select</option>
                      <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                    </select>
                  </Field>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
                  <input type="checkbox" name="reminderEnabled" checked={form.reminderEnabled} onChange={handleChange} style={{ accentColor: 'var(--brand)', width: 14, height: 14 }} />
                  <Bell size={12} color="var(--text-muted)" strokeWidth={2} />
                  Enable daily session reminders
                </label>
              </Card>
            </>
          )}
        </fieldset>

        {!viewMode && (
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={saving} style={{
              padding: '10px 28px', background: 'var(--brand)', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

/* ── DoctorCard ─────────────────────────────────────────────────────
   UPDATED: added onViewProfile prop → "View Profile" button
─────────────────────────────────────────────────────────────────── */
function DoctorCard({ doc, selected, disabled, onSelect, onViewProfile }) {
  const initials = (doc.name || '').split(' ').slice(0,2).map(w => w[0]?.toUpperCase()).join('')

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
      background: selected ? 'var(--bg-active)' : 'var(--bg-card2)',
      border: `1.5px solid ${selected ? 'var(--brand)' : 'var(--border)'}`,
      borderRadius: 10,
      transition: 'background 0.12s, border-color 0.12s',
    }}>
      {/* Avatar — clicking selects the doctor */}
      <div
        onClick={onSelect}
        style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: selected ? 'var(--brand)' : 'var(--text-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {initials || <User size={18} color="#fff" strokeWidth={2} />}
      </div>

      {/* Info — clicking selects the doctor */}
      <div
        onClick={onSelect}
        style={{ flex: 1, minWidth: 0, cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Dr. {doc.name}</span>
          {doc.verified && <BadgeCheck size={13} color="var(--brand)" strokeWidth={2} />}
          {doc.specialization && (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand)', background: 'var(--brand-light)', border: '1px solid var(--brand-border)', borderRadius: 4, padding: '1px 6px' }}>
              {doc.specialization}
            </span>
          )}
        </div>
        {doc.qualification && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
            <GraduationCap size={10} color="var(--text-muted)" strokeWidth={2} /> {doc.qualification}
            {doc.hospital && <><span style={{ color: 'var(--text-muted)' }}>·</span><Building2 size={10} color="var(--text-muted)" strokeWidth={2} /> {doc.hospital}</>}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {doc.rating != null && <DocPill icon={Star} color="#f59e0b" fill="#f59e0b" text={`${doc.rating}${doc.review_count ? ` (${doc.review_count})` : ''}`} />}
          {doc.experience != null && <DocPill icon={Award} text={`${doc.experience} yrs`} />}
          {doc.patients_count != null && <DocPill icon={Users} text={`${doc.patients_count} patients`} />}
          {doc.location && <DocPill icon={MapPin} text={doc.location} />}
          {doc.languages && <DocPill icon={Globe} text={doc.languages} />}
          {doc.consult_fee && <DocPill icon={Briefcase} text={`Fee: ${doc.consult_fee}`} />}
        </div>
      </div>

      {/* Right side: View Profile button + check */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* ── NEW: View Profile button ── */}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onViewProfile() }}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', borderRadius: 6,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            cursor: 'pointer', fontSize: 11, fontWeight: 600,
            color: 'var(--brand)', fontFamily: 'inherit',
            transition: 'background 0.12s, border-color 0.12s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-active)'; e.currentTarget.style.borderColor = 'var(--brand)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          <Eye size={11} strokeWidth={2} />
          View
        </button>

        {/* Selection check circle */}
        <div
          onClick={onSelect}
          style={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            background: selected ? 'var(--brand)' : 'var(--bg-card)',
            border: `1.5px solid ${selected ? 'var(--brand)' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.12s, border-color 0.12s',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {selected && <Check size={12} color="#fff" strokeWidth={3} />}
        </div>
      </div>
    </div>
  )
}

function DocPill({ icon: Icon, color, fill, text }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-muted)' }}>
      <Icon size={10} color={color || 'var(--text-muted)'} strokeWidth={2} fill={fill || 'none'} /> {text}
    </span>
  )
}

function Field({ label, icon: Icon, children }) {
  return (
    <div className="ps-field">
      <label className="ps-label">
        {Icon && <Icon size={11} color="var(--text-muted)" strokeWidth={2} />}
        {label}
      </label>
      {children}
    </div>
  )
}

function Alert({ variant, icon: Icon, children }) {
  const map = {
    danger:  { color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: 'var(--danger-border)'  },
    success: { color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)' },
    info:    { color: 'var(--brand)',   bg: 'var(--brand-light)', border: 'var(--brand-border)'  },
  }
  const s = map[variant] || map.info
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderRadius: 8, background: s.bg, border: `1px solid ${s.border}`, fontSize: 13, color: s.color }}>
      <Icon size={14} strokeWidth={2} style={{ flexShrink: 0 }} /> {children}
    </div>
  )
}