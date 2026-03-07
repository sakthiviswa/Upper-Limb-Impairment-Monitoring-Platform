/**
 * ProfileSettings
 * - No emoji, only Lucide React icons
 * - Doctor cards show detailed profile (specialization, experience, rating, languages, etc.)
 * - Standard colors
 * - Shows toast popup on Save Changes
 *
 * Place at: src/components/ProfileSettings.jsx
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { useLocation } from 'react-router-dom'
import { useToast } from './ToastProvider'
import {
  User, Mail, Phone, Calendar, Shield, Activity,
  CheckCircle, Clock, Star, Users, MapPin, Award,
  Languages, Stethoscope, Check, AlertCircle, Info,
  Bell, Settings, ChevronRight, Briefcase, GraduationCap,
  Building2, Globe, BadgeCheck, UserCheck,
} from 'lucide-react'
import './ProfileSettings.css'

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
  })
  const [doctors, setDoctors]                 = useState([])
  const [doctorsLoading, setDoctorsLoading]   = useState(false)
  const [loading, setLoading]                 = useState(true)
  const [saving, setSaving]                   = useState(false)
  const [error, setError]                     = useState('')
  const [success, setSuccess]                 = useState('')
  const [doctorAccepted, setDoctorAccepted]   = useState(false)
  const [assignedDoctor, setAssignedDoctor]   = useState('')
  const [notifiedDoctor, setNotifiedDoctor]   = useState(false)

  /* fetch doctors */
  useEffect(() => {
    if (role !== 'patient') return
    setDoctorsLoading(true)
    api.get('/doctors')
      .then(r => setDoctors(r.data.doctors || []))
      .catch(console.error)
      .finally(() => setDoctorsLoading(false))
  }, [role])

  /* load profile */
  useEffect(() => {
    let mounted = true
    api.get('/user/profile')
      .then(res => {
        if (!mounted) return
        const base = {
          fullName: res.data.fullName || '', age: res.data.age || '',
          gender: res.data.gender || '', phoneNumber: res.data.phoneNumber || '',
        }
        if (role === 'patient') {
          setForm({
            ...base,
            injuredArm: res.data.injuredArm || '', injuryType: res.data.injuryType || '',
            injurySeverity: res.data.injurySeverity || '', dateOfInjury: res.data.dateOfInjury || '',
            selectedDoctorId: res.data.selectedDoctorId || '',
            sessionDuration: res.data.sessionDuration || '', difficultyLevel: res.data.difficultyLevel || '',
            reminderEnabled: res.data.reminderEnabled || false,
          })
          setDoctorAccepted(res.data.doctorAccepted || false)
          setAssignedDoctor(res.data.doctorName || '')
        } else {
          setForm({ ...base, injuredArm: '', injuryType: '', injurySeverity: '', dateOfInjury: '',
            selectedDoctorId: '', sessionDuration: '', difficultyLevel: '', reminderEnabled: false })
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

  const selectDoctor = (doctorId) => {
    if (viewMode || doctorAccepted) return
    setForm(prev => ({ ...prev, selectedDoctorId: String(doctorId) }))
  }

  const validate = () => {
    if (form.age && (form.age < 5 || form.age > 100)) { setError('Age must be between 5 and 100.'); return false }
    if (form.phoneNumber && !/^\d{10}$/.test(form.phoneNumber)) { setError('Phone number must be exactly 10 digits.'); return false }
    if (role === 'patient' && !form.injuredArm) { setError('Please select injured arm.'); return false }
    setError(''); return true
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (viewMode || !validate()) return
    setSaving(true); setSuccess(''); setNotifiedDoctor(false)
    const payload = { fullName: form.fullName, age: form.age, gender: form.gender, phoneNumber: form.phoneNumber }
    if (role === 'patient') {
      Object.assign(payload, {
        injuredArm: form.injuredArm, injuryType: form.injuryType,
        injurySeverity: form.injurySeverity, dateOfInjury: form.dateOfInjury,
        selectedDoctorId: form.selectedDoctorId,
        sessionDuration: form.sessionDuration, difficultyLevel: form.difficultyLevel,
        reminderEnabled: form.reminderEnabled,
      })
    }
    try {
      const res = await api.put('/user/profile', payload)
      if (res.data.notifiedDoctor) {
        setNotifiedDoctor(true)
        setSuccess('Profile saved! The selected doctor has been notified.')
        showToast({
          type: 'profile_saved',
          title: 'Profile Saved',
          message: 'Your profile was updated and the selected doctor has been notified.',
        })
      } else {
        setSuccess('Profile saved successfully.')
        showToast({
          type: 'profile_saved',
          title: 'Profile Saved',
          message: 'Your profile changes have been saved successfully.',
        })
      }
      if (res.data.profile) {
        setDoctorAccepted(res.data.profile.doctorAccepted || false)
        setAssignedDoctor(res.data.profile.doctorName || '')
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to update profile.'
      setError(msg)
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: msg,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="profile-settings"><div className="spinner">Loading…</div></div>

  return (
    <div className="profile-settings">
      <h2>{viewMode ? 'My Profile' : 'Profile Settings'}</h2>

      {/* Doctor acceptance banner */}
      {role === 'patient' && (
        <div className={`doctor-banner ${doctorAccepted ? 'accepted' : 'pending'}`}>
          <div className="doctor-banner-icon">
            {doctorAccepted
              ? <CheckCircle size={16} color="#16a34a" strokeWidth={2} />
              : <Clock size={16} color="#d97706" strokeWidth={2} />
            }
          </div>
          <div>
            {doctorAccepted ? (
              <><strong>Doctor assigned!</strong>{' '}
                <span>Dr. {assignedDoctor} has accepted your request.</span>
              </>
            ) : (
              <span>
                {form.selectedDoctorId
                  ? 'Your request has been sent. Waiting for the doctor to accept…'
                  : 'Select a doctor below and save your profile to send a request.'}
              </span>
            )}
          </div>
        </div>
      )}

      {error   && (
        <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={14} strokeWidth={2} /> {error}
        </div>
      )}
      {success && (
        <div className="success-message" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={14} strokeWidth={2} /> {success}
        </div>
      )}
      {notifiedDoctor && (
        <div className="notif-banner" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Info size={14} strokeWidth={2} />
          <span><strong>Notification sent!</strong> The selected doctor has been notified about your profile.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-form">
        <fieldset disabled={viewMode}>

          {/* Personal Info */}
          <section className="section">
            <h3>Personal Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              <label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <User size={12} color="#9ca3af" strokeWidth={2} /> Full Name
                </span>
                <input type="text" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Your full name" />
              </label>
              <label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Calendar size={12} color="#9ca3af" strokeWidth={2} /> Age
                </span>
                <input type="number" name="age" value={form.age} onChange={handleChange} min="5" max="100" placeholder="Age" />
              </label>
              <label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <User size={12} color="#9ca3af" strokeWidth={2} /> Gender
                </span>
                <select name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">Select</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </label>
              <label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Phone size={12} color="#9ca3af" strokeWidth={2} /> Phone Number
                </span>
                <input type="text" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} maxLength={10} placeholder="10-digit number" />
              </label>
            </div>
          </section>

          {role === 'patient' && (
            <>
              {/* Medical Info */}
              <section className="section">
                <h3>Medical Information</h3>
                <label>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Activity size={12} color="#9ca3af" strokeWidth={2} /> Injured Arm
                  </span>
                  <div className="radio-group">
                    {['Left Arm', 'Right Arm', 'Both Arms'].map(arm => (
                      <label key={arm}>
                        <input type="radio" name="injuredArm" value={arm}
                          checked={form.injuredArm === arm} onChange={handleChange} />
                        {arm}
                      </label>
                    ))}
                  </div>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                  <label>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Shield size={12} color="#9ca3af" strokeWidth={2} /> Injury Type
                    </span>
                    <select name="injuryType" value={form.injuryType} onChange={handleChange}>
                      <option value="">Select</option>
                      <option>Fracture</option><option>Muscle Tear</option>
                      <option>Nerve Injury</option><option>Post-Surgery</option><option>Other</option>
                    </select>
                  </label>
                  <label>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <AlertCircle size={12} color="#9ca3af" strokeWidth={2} /> Injury Severity
                    </span>
                    <select name="injurySeverity" value={form.injurySeverity} onChange={handleChange}>
                      <option value="">Select</option>
                      <option>Mild</option><option>Moderate</option><option>Severe</option>
                    </select>
                  </label>
                  <label>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Calendar size={12} color="#9ca3af" strokeWidth={2} /> Date of Injury
                    </span>
                    <input type="date" name="dateOfInjury" value={form.dateOfInjury} onChange={handleChange} />
                  </label>
                </div>
              </section>

              {/* Doctor Selection */}
              <section className="section">
                <h3>Select Your Doctor</h3>
                {doctorAccepted ? (
                  <div style={{
                    padding: '0.875rem 1rem', background: '#f0fdf4',
                    border: '1px solid #86efac', borderRadius: 8,
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    fontSize: '0.8125rem', color: '#166534',
                  }}>
                    <CheckCircle size={15} color="#16a34a" strokeWidth={2} />
                    Dr. {assignedDoctor} is your assigned doctor.
                  </div>
                ) : doctorsLoading ? (
                  <div className="doctors-loading" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Activity size={13} color="#9ca3af" strokeWidth={2} /> Loading available doctors…
                  </div>
                ) : doctors.length === 0 ? (
                  <div className="doctors-loading">No doctors available at the moment.</div>
                ) : (
                  <div className="doctor-grid">
                    {doctors.map(doc => (
                      <DoctorCard
                        key={doc.id}
                        doc={doc}
                        selected={String(form.selectedDoctorId) === String(doc.id)}
                        disabled={viewMode}
                        onSelect={() => selectDoctor(doc.id)}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Rehab Preferences */}
              <section className="section">
                <h3>Rehabilitation Preferences</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                  <label>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Clock size={12} color="#9ca3af" strokeWidth={2} /> Session Duration (seconds)
                    </span>
                    <input type="number" name="sessionDuration" value={form.sessionDuration} onChange={handleChange} placeholder="e.g. 30" />
                  </label>
                  <label>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Settings size={12} color="#9ca3af" strokeWidth={2} /> Difficulty Level
                    </span>
                    <select name="difficultyLevel" value={form.difficultyLevel} onChange={handleChange}>
                      <option value="">Select</option>
                      <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                    </select>
                  </label>
                </div>
                <label className="checkbox-label" style={{ marginTop: '0.5rem' }}>
                  <input type="checkbox" name="reminderEnabled" checked={form.reminderEnabled} onChange={handleChange} />
                  <Bell size={12} color="#9ca3af" strokeWidth={2} />
                  Enable daily session reminders
                </label>
              </section>
            </>
          )}
        </fieldset>

        {!viewMode && (
          <div className="actions">
            <button type="submit" disabled={saving} className="save-btn">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

/* ── Doctor Card — detailed profile ──────────────────────────────── */
function DoctorCard({ doc, selected, disabled, onSelect }) {
  const initials = (doc.name || '')
    .split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('')

  const experience     = doc.experience     || null
  const rating         = doc.rating         || null
  const reviewCount    = doc.review_count   || null
  const specialization = doc.specialization || null
  const location       = doc.location       || null
  const languages      = doc.languages      || null
  const availability   = doc.availability   || null
  const patientsCount  = doc.patients_count
  const hospital       = doc.hospital       || null
  const qualification  = doc.qualification  || null
  const consultFee     = doc.consult_fee    || null
  const verified       = doc.verified       || false

  return (
    <div
      className={`doctor-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={onSelect}
    >
      {/* Left: avatar */}
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: selected ? '#0f172a' : '#f1f5f9',
        border: `1.5px solid ${selected ? '#0f172a' : '#e2e8f0'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        fontSize: '0.9rem', fontWeight: 700,
        color: selected ? '#fff' : '#374151',
        letterSpacing: '-0.01em',
      }}>
        {initials || <User size={20} color={selected ? '#fff' : '#9ca3af'} strokeWidth={2} />}
      </div>

      {/* Center: info */}
      <div className="doctor-card-info" style={{ flex: 1 }}>

        {/* Row 1: Name + verified + specialization */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
          <span className="doctor-card-name">Dr. {doc.name}</span>
          {verified && (
            <BadgeCheck size={14} color="#2563eb" strokeWidth={2} title="Verified Doctor" />
          )}
          {specialization && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 600, color: '#2563eb',
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: 4, padding: '0.1rem 0.4rem',
            }}>
              {specialization}
            </span>
          )}
        </div>

        {/* Row 2: qualification + hospital */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
          {qualification && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.725rem', color: '#374151', fontWeight: 500 }}>
              <GraduationCap size={11} color="#6b7280" strokeWidth={2} /> {qualification}
            </span>
          )}
          {hospital && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.725rem', color: '#374151' }}>
              <Building2 size={11} color="#9ca3af" strokeWidth={2} /> {hospital}
            </span>
          )}
        </div>

        {/* Row 3: email */}
        {doc.email && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.35rem' }}>
            <Mail size={11} color="#9ca3af" strokeWidth={2} /> {doc.email}
          </div>
        )}

        {/* Row 4: stats grid */}
        <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
          {experience !== null && (
            <StatPill icon={Award} color="#9ca3af" text={`${experience} yrs exp`} />
          )}
          {rating !== null && (
            <StatPill icon={Star} color="#f59e0b" fill="#f59e0b" text={`${rating}${reviewCount ? ` (${reviewCount})` : ''}`} />
          )}
          {patientsCount !== null && patientsCount !== undefined && (
            <StatPill icon={Users} color="#9ca3af" text={`${patientsCount} patients`} />
          )}
          {location && (
            <StatPill icon={MapPin} color="#9ca3af" text={location} />
          )}
          {languages && (
            <StatPill icon={Globe} color="#9ca3af" text={languages} />
          )}
          {consultFee && (
            <StatPill icon={Briefcase} color="#9ca3af" text={`Fee: ${consultFee}`} />
          )}
          {availability && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: '#16a34a', fontWeight: 500 }}>
              <CheckCircle size={11} color="#16a34a" strokeWidth={2} /> {availability}
            </span>
          )}
        </div>
      </div>

      {/* Right: check circle */}
      <div className="doctor-card-check">
        {selected && <Check size={11} color="#fff" strokeWidth={3} />}
      </div>
    </div>
  )
}

function StatPill({ icon: Icon, color, fill, text }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: '#6b7280' }}>
      <Icon size={11} color={color} strokeWidth={2} fill={fill || 'none'} /> {text}
    </span>
  )
}