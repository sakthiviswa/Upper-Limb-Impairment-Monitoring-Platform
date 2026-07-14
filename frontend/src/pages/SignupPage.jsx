import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, User, Stethoscope, Shield, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import AuthInput, { EmailIcon, LockIcon, UserIcon } from '../components/AuthInput'

const ROLE_PATHS = { patient: '/patient/dashboard', doctor: '/doctor/dashboard', admin: '/admin/dashboard' }

const ROLES = [
  { value: 'patient', label: 'Patient', Icon: User, desc: 'Track recovery & appointments' },
  { value: 'doctor',  label: 'Doctor',  Icon: Stethoscope, desc: 'Monitor patients & schedules' },
]

export default function SignupPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiErr] = useState('')
  const [loading, setLoading] = useState(false)

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
    } finally { setLoading(false) }
  }

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join RehabMonitor and take control of your rehabilitation journey."
    >
      {apiError && (
        <div className="auth-alert auth-alert--error">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <AuthInput label="Full Name" name="name" type="text"
          placeholder="Jane Doe" value={form.name} onChange={handleChange}
          error={errors.name} autoComplete="name" icon={<UserIcon />} required />

        <AuthInput label="Email address" name="email" type="email"
          placeholder="you@example.com" value={form.email} onChange={handleChange}
          error={errors.email} autoComplete="email" icon={<EmailIcon />} required />

        <div className="auth-pwd-row">
          <AuthInput label="Password" name="password" type="password"
            placeholder="Min. 6 chars" value={form.password} onChange={handleChange}
            error={errors.password} autoComplete="new-password" icon={<LockIcon />} required />
          <AuthInput label="Confirm" name="confirm" type="password"
            placeholder="Repeat password" value={form.confirm} onChange={handleChange}
            error={errors.confirm} autoComplete="new-password" icon={<LockIcon />} required />
        </div>

        <div className="auth-role-section">
          <div className="auth-label">
            Select your role <span className="auth-label-required">*</span>
          </div>
          <div className="auth-role-grid">
            {ROLES.map(r => {
              const active = form.role === r.value
              const RoleIcon = r.Icon
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: r.value }))}
                  className={`auth-role-card ${active ? 'auth-role-card--active' : ''}`}
                >
                  <div className="auth-role-icon">
                    <RoleIcon size={18} strokeWidth={2} />
                  </div>
                  <div className="auth-role-name">{r.label}</div>
                  <div className="auth-role-desc">{r.desc}</div>
                  {active && (
                    <div className="auth-role-check">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          {errors.role && (
            <p className="auth-field-error" style={{ marginTop: 8 }}>
              <AlertCircle size={14} />
              {errors.role}
            </p>
          )}
        </div>

        <p className="auth-terms">
          By creating an account you agree to our{' '}
          <button type="button" className="auth-link-btn">Terms of Service</button>
          {' '}and{' '}
          <button type="button" className="auth-link-btn">Privacy Policy</button>.
        </p>

        <button type="submit" disabled={loading} className="auth-submit">
          {loading
            ? <><span className="auth-spinner" /> Creating account…</>
            : <>Create Account <ArrowRight size={20} /></>
          }
        </button>
      </form>

      <p className="auth-switch">
        Already have an account?{' '}
        <Link to="/login">Sign in instead</Link>
      </p>
    </AuthLayout>
  )
}
