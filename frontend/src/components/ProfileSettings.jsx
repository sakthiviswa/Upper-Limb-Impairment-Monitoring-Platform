/**
 * ProfileSettings.jsx — Profile (viewMode) & Settings (editable)
 * UI redesigned; all API, validation, state, and field names preserved.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { useLocation } from 'react-router-dom'
import { useToast } from './ToastProvider'
import DoctorProfileModal from './ui/DoctorProfileModal'
import { PageHeader, LoadingScreen, Avatar, Badge } from './ui'
import {
  User, Phone, Calendar, Shield, Activity,
  CheckCircle, Clock, Star, Users, MapPin, Award,
  Check, AlertCircle, Info, Bell, Settings,
  Briefcase, GraduationCap, Building2, Globe, BadgeCheck, Eye,
  Stethoscope, Save, Hospital, Mail,
} from 'lucide-react'
import '../styles/profile-settings.css'

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

  if (loading) return <LoadingScreen message="Loading profile…" fullScreen={false} />

  const displayName = form.fullName || user?.name || 'User'
  const roleLabel = role === 'doctor' ? 'Doctor' : role === 'admin' ? 'Admin' : 'Patient'

  return (
    <div className="ps-page">
      <DoctorProfileModal
        doctorId={viewingDoctorId}
        onClose={() => setViewingDoctorId(null)}
        selected={String(form.selectedDoctorId) === String(viewingDoctorId)}
        onSelect={!viewMode ? (id) => setForm(p => ({ ...p, selectedDoctorId: String(id) })) : undefined}
      />

      <PageHeader
        title={viewMode ? 'My Profile' : 'Profile Settings'}
        subtitle={viewMode ? 'View your personal and medical information' : 'Update your personal and medical details'}
        icon={viewMode ? User : Settings}
      />

      {/* Profile hero */}
      <div className="ps-hero">
        <Avatar name={displayName} size={72} />
        <div className="ps-hero__info">
          <div className="ps-hero__name-row">
            <h2 className="ps-hero__name">
              {role === 'doctor' ? `Dr. ${displayName}` : displayName}
            </h2>
            <Badge label={roleLabel} variant="brand" />
            {viewMode && <Badge label="View only" variant="default" dot={false} />}
          </div>
          {user?.email && (
            <div className="ps-hero__email">
              <Mail size={14} strokeWidth={2} />
              {user.email}
            </div>
          )}
          <div className="ps-hero__meta">
            {form.age && <span>Age {form.age}</span>}
            {form.gender && <span>{form.gender}</span>}
            {form.phoneNumber && <span>{form.phoneNumber}</span>}
            {role === 'doctor' && form.specialization && <span>{form.specialization}</span>}
            {role === 'patient' && form.injuredArm && <span>{form.injuredArm}</span>}
          </div>
        </div>
      </div>

      {role === 'patient' && (
        <div className={`ps-banner ${doctorAccepted ? 'ps-banner--accepted' : 'ps-banner--pending'}`}>
          {doctorAccepted
            ? <CheckCircle size={18} strokeWidth={2} className="ps-alert__icon" />
            : <Clock size={18} strokeWidth={2} className="ps-alert__icon" />
          }
          {doctorAccepted
            ? <span><strong>Doctor assigned:</strong> Dr. {assignedDoctor} has accepted your request.</span>
            : <span>{form.selectedDoctorId ? 'Request sent. Waiting for doctor to accept…' : 'Select a doctor and save your profile to send a care request.'}</span>
          }
        </div>
      )}

      {error && <Alert variant="error" icon={AlertCircle}>{error}</Alert>}
      {success && <Alert variant="success" icon={CheckCircle}>{success}</Alert>}
      {notifiedDoctor && (
        <Alert variant="info" icon={Info}>
          <span className="ps-alert__emphasis"><strong>Doctor notified!</strong></span>
          {' '}They have been sent your profile details.
        </Alert>
      )}

      <form className="ps-form" onSubmit={handleSubmit}>
        <fieldset disabled={viewMode}>

          <section className="ps-section">
            <SectionHead icon={User} title="Personal Information" sub="Basic identity and contact details" />
            {viewMode ? (
              <div className="ps-read-grid">
                <ReadItem icon={User} label="Full Name" value={form.fullName} />
                <ReadItem icon={Calendar} label="Age" value={form.age} />
                <ReadItem icon={User} label="Gender" value={form.gender} />
                <ReadItem icon={Phone} label="Phone" value={form.phoneNumber} />
              </div>
            ) : (
              <div className="ps-grid">
                <Field label="Full Name" icon={User}>
                  <input className="ps-input" type="text" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Your full name" />
                </Field>
                <Field label="Age" icon={Calendar} helper="Must be between 5 and 100">
                  <input className="ps-input" type="number" name="age" value={form.age} onChange={handleChange} min="5" max="100" placeholder="Age" />
                </Field>
                <Field label="Gender" icon={User}>
                  <select className="ps-select" name="gender" value={form.gender} onChange={handleChange}>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </Field>
                <Field label="Phone Number" icon={Phone} helper="10-digit mobile number">
                  <input className="ps-input" type="text" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} maxLength={10} placeholder="10-digit number" />
                </Field>
              </div>
            )}
          </section>

          {role === 'doctor' && (
            <section className="ps-section">
              <SectionHead icon={Stethoscope} title="Professional Information" sub="Credentials patients see on your profile" />
              {viewMode ? (
                <>
                  <div className="ps-read-grid">
                    <ReadItem icon={Stethoscope} label="Specialization" value={form.specialization} />
                    <ReadItem icon={GraduationCap} label="Qualification" value={form.qualification} />
                    <ReadItem icon={Hospital} label="Hospital/Clinic" value={form.hospital} />
                    <ReadItem icon={Award} label="Experience" value={form.experience ? `${form.experience} years` : ''} />
                    <ReadItem icon={MapPin} label="Location" value={form.location} />
                    <ReadItem icon={Globe} label="Languages" value={form.languages} />
                    <ReadItem icon={Briefcase} label="Consultation Fee" value={form.consultFee} />
                    <ReadItem icon={Clock} label="Availability" value={form.availability} />
                  </div>
                  {form.bio && (
                    <div className="ps-bio-block">
                      <div className="ps-bio-block__label">About</div>
                      <p className="ps-bio-block__text">{form.bio}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="ps-grid">
                    <Field label="Specialization" icon={Stethoscope}>
                      <input className="ps-input" type="text" name="specialization" value={form.specialization} onChange={handleChange} placeholder="e.g. Orthopedic Rehab" />
                    </Field>
                    <Field label="Qualification" icon={GraduationCap}>
                      <input className="ps-input" type="text" name="qualification" value={form.qualification} onChange={handleChange} placeholder="e.g. MBBS, MS Ortho" />
                    </Field>
                    <Field label="Hospital/Clinic" icon={Hospital}>
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
                  <div style={{ marginTop: 4 }}>
                    <Field label="Bio/About" icon={Info} helper="Share your approach to treatment and care">
                      <textarea
                        className="ps-textarea"
                        name="bio"
                        value={form.bio}
                        onChange={handleChange}
                        placeholder="Tell patients about yourself, your approach to treatment, etc."
                        rows={4}
                      />
                    </Field>
                  </div>
                </>
              )}
            </section>
          )}

          {role === 'patient' && (
            <>
              <section className="ps-section">
                <SectionHead icon={Activity} title="Medical Information" sub="Injury details used for rehab planning" />
                {viewMode ? (
                  <div className="ps-read-grid">
                    <ReadItem icon={Activity} label="Injured Arm" value={form.injuredArm} />
                    <ReadItem icon={Shield} label="Injury Type" value={form.injuryType} />
                    <ReadItem icon={AlertCircle} label="Severity" value={form.injurySeverity} />
                    <ReadItem icon={Calendar} label="Date of Injury" value={form.dateOfInjury} />
                  </div>
                ) : (
                  <>
                    <div className="ps-field">
                      <div className="ps-label">
                        <Activity size={18} strokeWidth={2} className="ps-label__icon" />
                        Injured Arm
                      </div>
                      <div className="ps-radio-group">
                        {['Left Arm', 'Right Arm', 'Both Arms'].map(arm => (
                          <label className="ps-radio-pill" key={arm}>
                            <input type="radio" name="injuredArm" value={arm} checked={form.injuredArm === arm} onChange={handleChange} />
                            {arm}
                          </label>
                        ))}
                      </div>
                      <p className="ps-helper">Required — select the affected limb</p>
                    </div>
                    <div className="ps-grid">
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
                  </>
                )}
              </section>

              <section className="ps-section">
                <SectionHead icon={Stethoscope} title="Select Your Doctor" sub="Choose a clinician to manage your care" />
                {doctorAccepted ? (
                  <div className="ps-assigned-chip">
                    <CheckCircle size={18} strokeWidth={2} />
                    Dr. {assignedDoctor} is your assigned doctor.
                  </div>
                ) : doctorsLoading ? (
                  <div className="ps-muted">Loading doctors…</div>
                ) : doctors.length === 0 ? (
                  <div className="ps-muted">No doctors available.</div>
                ) : (
                  <div className="ps-doctor-list">
                    {doctors.map(doc => (
                      <DoctorCard
                        key={doc.id}
                        doc={doc}
                        selected={String(form.selectedDoctorId) === String(doc.id)}
                        disabled={viewMode}
                        onSelect={() => !viewMode && setForm(p => ({ ...p, selectedDoctorId: String(doc.id) }))}
                        onViewProfile={() => setViewingDoctorId(doc.id)}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="ps-section">
                <SectionHead icon={Bell} title="Rehabilitation Preferences" sub="Session defaults and reminders" />
                {viewMode ? (
                  <div className="ps-read-grid">
                    <ReadItem icon={Clock} label="Session Duration" value={form.sessionDuration ? `${form.sessionDuration} sec` : ''} />
                    <ReadItem icon={Settings} label="Difficulty" value={form.difficultyLevel} />
                    <ReadItem icon={Bell} label="Reminders" value={form.reminderEnabled ? 'Enabled' : 'Disabled'} />
                  </div>
                ) : (
                  <>
                    <div className="ps-grid">
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
                    <label className="ps-checkbox">
                      <input type="checkbox" name="reminderEnabled" checked={form.reminderEnabled} onChange={handleChange} />
                      <Bell size={18} strokeWidth={2} className="ps-checkbox__icon" />
                      Enable daily session reminders
                    </label>
                  </>
                )}
              </section>
            </>
          )}
        </fieldset>

        {!viewMode && (
          <div className="ps-actions">
            <button type="submit" className="ps-save-btn" disabled={saving}>
              {saving ? (
                <>
                  <span className="ps-save-btn__spinner" aria-hidden />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={20} strokeWidth={2} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

function ReadItem({ icon: Icon, label, value }) {
  return (
    <div className="ps-read-item">
      <div className="ps-read-item__icon">
        <Icon size={16} strokeWidth={2} />
      </div>
      <div>
        <div className="ps-read-item__label">{label}</div>
        <div className="ps-read-item__value">{value || '—'}</div>
      </div>
    </div>
  )
}

function DoctorCard({ doc, selected, disabled, onSelect, onViewProfile }) {
  const initials = (doc.name || '').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('')

  return (
    <div
      className={[
        'ps-doctor-card',
        selected ? 'ps-doctor-card--selected' : '',
        disabled ? 'ps-doctor-card--disabled' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="ps-doctor-card__avatar" onClick={onSelect} role="presentation">
        {initials || <User size={20} color="#fff" strokeWidth={2} />}
      </div>

      <div className="ps-doctor-card__body" onClick={onSelect} role="presentation">
        <div className="ps-doctor-card__name-row">
          <span className="ps-doctor-card__name">Dr. {doc.name}</span>
          {doc.verified && <BadgeCheck size={16} strokeWidth={2} className="ps-doctor-card__verified" />}
          {doc.specialization && (
            <span className="ps-doctor-card__spec">{doc.specialization}</span>
          )}
        </div>
        {doc.qualification && (
          <div className="ps-doctor-card__meta">
            <GraduationCap size={14} strokeWidth={2} />
            {doc.qualification}
            {doc.hospital && (
              <>
                <span className="ps-doctor-card__meta-sep">·</span>
                <Building2 size={14} strokeWidth={2} />
                {doc.hospital}
              </>
            )}
          </div>
        )}
        <div className="ps-doctor-card__chips">
          {doc.rating != null && <DocChip icon={Star} color="#F59E0B" fill="#F59E0B" text={`${doc.rating}${doc.review_count ? ` (${doc.review_count})` : ''}`} />}
          {doc.experience != null && <DocChip icon={Award} text={`${doc.experience} yrs`} />}
          {doc.patients_count != null && <DocChip icon={Users} text={`${doc.patients_count} patients`} />}
          {doc.location && <DocChip icon={MapPin} text={doc.location} />}
          {doc.languages && <DocChip icon={Globe} text={doc.languages} />}
          {doc.consult_fee && <DocChip icon={Briefcase} text={`Fee: ${doc.consult_fee}`} />}
        </div>
      </div>

      <div className="ps-doctor-card__actions">
        <button
          type="button"
          className="ps-doctor-view-btn"
          onClick={e => { e.stopPropagation(); onViewProfile() }}
        >
          <Eye size={14} strokeWidth={2} />
          View
        </button>
        <div
          className={`ps-doctor-check ${selected ? 'ps-doctor-check--selected' : ''}`}
          onClick={onSelect}
          role="presentation"
        >
          {selected && <Check size={12} color="#fff" strokeWidth={3} />}
        </div>
      </div>
    </div>
  )
}

function DocChip({ icon: Icon, color, fill, text }) {
  return (
    <span className="ps-doc-chip">
      <Icon size={12} color={color || 'var(--text-muted)'} strokeWidth={2} fill={fill || 'none'} />
      {text}
    </span>
  )
}

function SectionHead({ icon: Icon, title, sub }) {
  return (
    <div className="ps-section-head">
      <div className="ps-section-head__icon">
        <Icon size={22} strokeWidth={2} />
      </div>
      <div>
        <h3 className="ps-section-head__title">{title}</h3>
        {sub && <p className="ps-section-head__sub">{sub}</p>}
      </div>
    </div>
  )
}

function Field({ label, icon: Icon, helper, children }) {
  return (
    <div className="ps-field">
      <label className="ps-label">
        {Icon && <Icon size={18} strokeWidth={2} className="ps-label__icon" />}
        {label}
      </label>
      {children}
      {helper && <p className="ps-helper">{helper}</p>}
    </div>
  )
}

function Alert({ variant, icon: Icon, children }) {
  return (
    <div className={`ps-alert ps-alert--${variant}`}>
      <Icon size={18} strokeWidth={2} className="ps-alert__icon" />
      <div>{children}</div>
    </div>
  )
}
