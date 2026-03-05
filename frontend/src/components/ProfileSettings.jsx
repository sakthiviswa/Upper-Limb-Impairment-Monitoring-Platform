import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { useLocation } from 'react-router-dom'
import './ProfileSettings.css'

export default function ProfileSettings({ viewMode: propViewMode }) {
  const { user } = useAuth()
  const role = user?.role
  const location = useLocation()
  const viewMode = propViewMode !== undefined ? propViewMode : location.pathname === '/profile'

  const [form, setForm] = useState({
    fullName: '',
    age: '',
    gender: '',
    phoneNumber: '',
    injuredArm: '',
    injuryType: '',
    injurySeverity: '',
    dateOfInjury: '',
    doctorName: '',
    sessionDuration: '',
    difficultyLevel: '',
    reminderEnabled: false,
  })

  const [loading, setLoading]             = useState(true)
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState('')
  const [success, setSuccess]             = useState('')
  const [doctorAccepted, setDoctorAccepted] = useState(false)
  const [assignedDoctor, setAssignedDoctor] = useState('')
  const [notifiedDoctors, setNotifiedDoctors] = useState(false)

  useEffect(() => {
    let mounted = true
    api
      .get('/user/profile')
      .then((res) => {
        if (!mounted) return
        const base = {
          fullName:    res.data.fullName    || '',
          age:         res.data.age         || '',
          gender:      res.data.gender      || '',
          phoneNumber: res.data.phoneNumber || '',
        }
        if (role === 'patient') {
          setForm({
            ...base,
            injuredArm:      res.data.injuredArm      || '',
            injuryType:      res.data.injuryType      || '',
            injurySeverity:  res.data.injurySeverity  || '',
            dateOfInjury:    res.data.dateOfInjury    || '',
            doctorName:      res.data.doctorName      || '',
            sessionDuration: res.data.sessionDuration || '',
            difficultyLevel: res.data.difficultyLevel || '',
            reminderEnabled: res.data.reminderEnabled || false,
          })
          setDoctorAccepted(res.data.doctorAccepted || false)
          setAssignedDoctor(res.data.doctorName     || '')
        } else {
          setForm({ ...base, injuredArm: '', injuryType: '', injurySeverity: '',
            dateOfInjury: '', doctorName: '', sessionDuration: '',
            difficultyLevel: '', reminderEnabled: false })
        }
      })
      .catch((e) => {
        console.error(e)
        setError('Failed to load profile.')
      })
      .finally(() => setLoading(false))
    return () => { mounted = false }
  }, [role])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const validate = () => {
    if (form.age && (form.age < 5 || form.age > 100)) {
      setError('Age must be between 5 and 100.')
      return false
    }
    if (form.phoneNumber && !/^\d{10}$/.test(form.phoneNumber)) {
      setError('Phone number must be exactly 10 digits.')
      return false
    }
    if (role === 'patient' && !form.injuredArm) {
      setError('Please select injured arm.')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (viewMode) return
    if (!validate()) return
    setSaving(true)
    setSuccess('')
    setNotifiedDoctors(false)

    const payload = {
      fullName:    form.fullName,
      age:         form.age,
      gender:      form.gender,
      phoneNumber: form.phoneNumber,
    }
    if (role === 'patient') {
      Object.assign(payload, {
        injuredArm:      form.injuredArm,
        injuryType:      form.injuryType,
        injurySeverity:  form.injurySeverity,
        dateOfInjury:    form.dateOfInjury,
        doctorName:      form.doctorName,
        sessionDuration: form.sessionDuration,
        difficultyLevel: form.difficultyLevel,
        reminderEnabled: form.reminderEnabled,
      })
    }

    try {
      const res = await api.put('/user/profile', payload)
      setSuccess('Profile saved successfully.')
      if (res.data.notifiedDoctors) {
        setNotifiedDoctors(true)
        setSuccess('Profile saved! All doctors have been notified about your request.')
      }
      // Refresh doctor acceptance status
      if (res.data.profile) {
        setDoctorAccepted(res.data.profile.doctorAccepted || false)
        setAssignedDoctor(res.data.profile.doctorName || '')
      }
    } catch (e) {
      console.error(e)
      setError(e.response?.data?.message || 'Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="profile-settings">
        <div className="spinner">Loading...</div>
      </div>
    )
  }

  return (
    <div className="profile-settings">
      <h2>{viewMode ? 'My Profile' : 'Profile Settings'}</h2>

      {/* Doctor acceptance banner – patients only */}
      {role === 'patient' && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.875rem 1rem',
          borderRadius: 8,
          background: doctorAccepted ? '#f0fdf4' : '#fefce8',
          border: `1px solid ${doctorAccepted ? '#86efac' : '#fde047'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          fontSize: '0.875rem',
        }}>
          <span style={{ fontSize: '1.1rem' }}>{doctorAccepted ? '✅' : '⏳'}</span>
          <div>
            {doctorAccepted ? (
              <>
                <strong style={{ color: '#15803d' }}>Doctor assigned!</strong>
                {' '}<span style={{ color: '#166534' }}>
                  Dr. {assignedDoctor} has accepted your request and is your assigned doctor.
                </span>
              </>
            ) : (
              <span style={{ color: '#854d0e' }}>
                {form.age
                  ? 'Your request has been sent to all doctors. Waiting for a doctor to accept…'
                  : 'Complete your profile to notify doctors and get assigned.'}
              </span>
            )}
          </div>
        </div>
      )}

      {error   && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Doctor notification sent banner */}
      {notifiedDoctors && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.875rem 1rem',
          borderRadius: 8,
          background: '#eff6ff',
          border: '1px solid #93c5fd',
          fontSize: '0.875rem',
          color: '#1e40af',
        }}>
          📨 <strong>Notification sent!</strong> All registered doctors have been notified about your profile.
          You'll receive a notification here once a doctor accepts your request.
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-form">
        <fieldset disabled={viewMode}>
          <section className="section">
            <h3>Personal Information</h3>
            <label>
              Full Name
              <input type="text" name="fullName" value={form.fullName} onChange={handleChange} />
            </label>
            <label>
              Age
              <input type="number" name="age" value={form.age} onChange={handleChange} min="5" max="100" />
            </label>
            <label>
              Gender
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label>
              Phone Number
              <input type="text" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} maxLength={10} />
            </label>
          </section>

          {role === 'patient' && (
            <>
              <section className="section">
                <h3>Medical Information</h3>
                <label>
                  Injured Arm
                  <div className="radio-group">
                    {['Left Arm', 'Right Arm', 'Both Arms'].map((arm) => (
                      <label key={arm}>
                        <input type="radio" name="injuredArm" value={arm}
                          checked={form.injuredArm === arm} onChange={handleChange} />{' '}{arm}
                      </label>
                    ))}
                  </div>
                </label>
                <label>
                  Injury Type
                  <select name="injuryType" value={form.injuryType} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="Fracture">Fracture</option>
                    <option value="Muscle Tear">Muscle Tear</option>
                    <option value="Nerve Injury">Nerve Injury</option>
                    <option value="Post-Surgery">Post-Surgery</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label>
                  Injury Severity
                  <select name="injurySeverity" value={form.injurySeverity} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                  </select>
                </label>
                <label>
                  Date of Injury
                  <input type="date" name="dateOfInjury" value={form.dateOfInjury} onChange={handleChange} />
                </label>
                <label>
                  Doctor Name
                  <input type="text" name="doctorName" value={form.doctorName} onChange={handleChange}
                    readOnly={doctorAccepted}
                    style={doctorAccepted ? { background: '#f9fafb', color: '#6b7280' } : {}}
                    title={doctorAccepted ? 'Assigned by your doctor' : ''} />
                </label>
              </section>

              <section className="section">
                <h3>Rehabilitation Preferences</h3>
                <label>
                  Session Duration (seconds)
                  <input type="number" name="sessionDuration" value={form.sessionDuration} onChange={handleChange} />
                </label>
                <label>
                  Difficulty Level
                  <select name="difficultyLevel" value={form.difficultyLevel} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" name="reminderEnabled" checked={form.reminderEnabled} onChange={handleChange} />{' '}
                  Enable Reminders
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