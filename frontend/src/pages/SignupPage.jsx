/**
 * Signup Page
 * Role selection + form validation + API call.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_PATHS = { patient: '/patient/dashboard', doctor: '/doctor/dashboard', admin: '/admin/dashboard' }

const ROLES = [
  { value: 'patient', label: 'Patient',  icon: '🧑‍🦱', desc: 'Book appointments & view records' },
  { value: 'doctor',  label: 'Doctor',   icon: '👨‍⚕️', desc: 'Manage patients & schedules' },
  { value: 'admin',   label: 'Admin',    icon: '🛡️',  desc: 'Full system access & management' },
]

export default function SignupPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '', role: '' })
  const [errors, setErrors]   = useState({})
  const [apiError, setApiErr] = useState('')
  const [loading, setLoading] = useState(false)

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters'
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Minimum 6 characters'
    if (!form.confirm) e.confirm = 'Please confirm your password'
    else if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    if (!form.role) e.role = 'Please select a role'
    return e
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) return setErrors(errs)
    setErrors({}); setApiErr(''); setLoading(true)
    try {
      const user = await register({ name: form.name.trim(), email: form.email, password: form.password, role: form.role })
      navigate(ROLE_PATHS[user.role] ?? '/', { replace: true })
    } catch (err) {
      setApiErr(err.response?.data?.message ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: 500 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '.5rem' }}>✨</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Create your account</h1>
          <p style={{ color: 'var(--gray-600)', marginTop: '.25rem' }}>Join the HealthCare Portal today</p>
        </div>

        <div className="card">
          {apiError && <div className="alert alert-error">{apiError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            {/* Name */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className={`form-input ${errors.name ? 'error' : ''}`} type="text" name="name" placeholder="Jane Doe" value={form.name} onChange={handleChange} autoComplete="name" />
              {errors.name && <p className="error-text">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className={`form-input ${errors.email ? 'error' : ''}`} type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} autoComplete="email" />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className={`form-input ${errors.password ? 'error' : ''}`} type="password" name="password" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} autoComplete="new-password" />
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>

            {/* Confirm */}
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className={`form-input ${errors.confirm ? 'error' : ''}`} type="password" name="confirm" placeholder="Repeat password" value={form.confirm} onChange={handleChange} autoComplete="new-password" />
              {errors.confirm && <p className="error-text">{errors.confirm}</p>}
            </div>

            {/* Role selector */}
            <div className="form-group">
              <label className="form-label">Select your role</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.75rem' }}>
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: r.value }))}
                    style={{
                      padding: '.875rem .5rem',
                      borderRadius: 10,
                      border: `2px solid ${form.role === r.value ? 'var(--primary)' : 'var(--gray-200)'}`,
                      background: form.role === r.value ? 'var(--primary-light)' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all .2s',
                    }}
                  >
                    <div style={{ fontSize: '1.5rem' }}>{r.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: '.85rem', marginTop: '.25rem', color: form.role === r.value ? 'var(--primary)' : 'var(--gray-700)' }}>{r.label}</div>
                    <div style={{ fontSize: '.7rem', color: 'var(--gray-400)', marginTop: '.2rem', lineHeight: 1.3 }}>{r.desc}</div>
                  </button>
                ))}
              </div>
              {errors.role && <p className="error-text">{errors.role}</p>}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '.5rem' }}>
              {loading ? <><div className="spinner" /> Creating account…</> : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '.875rem', color: 'var(--gray-600)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}