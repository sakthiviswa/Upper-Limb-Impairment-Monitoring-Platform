import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_PATHS = { patient: '/patient/dashboard', doctor: '/doctor/dashboard', admin: '/admin/dashboard' }

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm]       = useState({ email: '', password: '' })
  const [errors, setErrors]   = useState({})
  const [apiError, setApiErr] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) return setErrors(errs)
    setErrors({}); setApiErr(''); setLoading(true)
    try {
      const user = await login(form.email, form.password)
      navigate(ROLE_PATHS[user.role] ?? '/', { replace: true })
    } catch (err) {
      setApiErr(err.response?.data?.message ?? 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  return (
    <div className="auth-wrapper">
      <div className="auth-card">

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto .75rem',
            background: 'linear-gradient(135deg, #64CCC5, #176B87)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', boxShadow: '0 8px 24px rgba(100,204,197,.4)'
          }}>🏥</div>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 700, color: '#fff' }}>Welcome back</h1>
          <p style={{ color: 'rgba(218,255,251,.8)', marginTop: '.25rem', fontSize: '.9rem' }}>
            Sign in to your HealthCare Portal account
          </p>
        </div>

        {/* Form card */}
        <div className="card">
          {apiError && <div className="alert alert-error">{apiError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className={`form-input ${errors.email ? 'error' : ''}`} type="email" name="email"
                placeholder="you@example.com" value={form.email} onChange={handleChange} autoComplete="email" />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input className={`form-input ${errors.password ? 'error' : ''}`} type="password" name="password"
                placeholder="••••••••" value={form.password} onChange={handleChange} autoComplete="current-password" />
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '.5rem' }}>
              {loading ? <><div className="spinner" /> Signing in…</> : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '.875rem', color: '#4a8fa0' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#176B87', fontWeight: 600, textDecoration: 'none' }}>Create one</Link>
          </p>
        </div>

        {/* Demo hint */}
        <div style={{
          marginTop: '1rem', padding: '1rem',
          background: 'rgba(218,255,251,.15)', borderRadius: 10,
          fontSize: '.8rem', color: '#DAFFFB',
          border: '1px solid rgba(100,204,197,.3)'
        }}>
          <strong>🔑 Demo credentials:</strong><br />
          Admin → admin@healthcare.dev / Admin@1234
        </div>
      </div>
    </div>
  )
}