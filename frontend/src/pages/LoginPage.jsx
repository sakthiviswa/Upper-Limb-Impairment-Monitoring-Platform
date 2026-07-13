import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import AuthInput, { EmailIcon, LockIcon } from '../components/AuthInput'

const ROLE_PATHS = { patient: '/patient/dashboard', doctor: '/doctor/dashboard', admin: '/admin/dashboard' }

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(false)

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
    } finally { setLoading(false) }
  }

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your RehabMonitor account to continue your recovery journey."
    >
      {apiError && (
        <div className="auth-alert auth-alert--error">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <AuthInput label="Email address" name="email" type="email"
          placeholder="you@example.com" value={form.email} onChange={handleChange}
          error={errors.email} autoComplete="email" icon={<EmailIcon />} required />

        <AuthInput label="Password" name="password" type="password"
          placeholder="Enter your password" value={form.password} onChange={handleChange}
          error={errors.password} autoComplete="current-password" icon={<LockIcon />} required />

        <div className="auth-row">
          <label className="auth-checkbox-label">
            <input type="checkbox" className="auth-checkbox" checked={remember}
              onChange={e => setRemember(e.target.checked)} />
            Remember me
          </label>
          <button type="button" className="auth-link-btn">Forgot password?</button>
        </div>

        <button type="submit" disabled={loading} className="auth-submit">
          {loading
            ? <><span className="auth-spinner" /> Signing in…</>
            : <>Sign In <ArrowRight size={20} /></>
          }
        </button>
      </form>

      <p className="auth-switch">
        Don&apos;t have an account?{' '}
        <Link to="/signup">Create one for free</Link>
      </p>

      <div className="auth-divider">
        <div className="auth-divider-line" />
        <span className="auth-divider-label">Demo access</span>
        <div className="auth-divider-line" />
      </div>

      <div className="auth-demo">
        <div className="auth-demo-row">
          <KeyRound size={22} color="#2563EB" />
          <div>
            <div className="auth-demo-title">Admin credentials</div>
            <div className="auth-demo-creds">admin@healthcare.dev · Admin@1234</div>
          </div>
          <button type="button" className="auth-demo-fill"
            onClick={() => setForm({ email: 'admin@healthcare.dev', password: 'Admin@1234' })}>
            Fill
          </button>
        </div>
      </div>
    </AuthLayout>
  )
}
