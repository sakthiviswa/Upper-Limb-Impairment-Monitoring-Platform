import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import AuthInput, { EmailIcon, LockIcon, UserIcon } from '../components/AuthInput'

const ROLE_PATHS = { patient: '/patient/dashboard', doctor: '/doctor/dashboard', admin: '/admin/dashboard' }

const ROLES = [
  { value: 'patient', label: 'Patient',  icon: '🧑‍🦱', desc: 'Track recovery & appointments' },
  { value: 'doctor',  label: 'Doctor',   icon: '👨‍⚕️', desc: 'Monitor patients & schedules' },
  { value: 'admin',   label: 'Admin',    icon: '🛡️',  desc: 'Full system access' },
]

export default function SignupPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '', role: '' })
  const [errors, setErrors]   = useState({})
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
        <div style={S.apiBanner}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
            <circle cx="12" cy="12" r="10" stroke="#DC2626" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
          </svg>
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

        <div style={S.pwdRow}>
          <div style={{flex:1}}>
            <AuthInput label="Password" name="password" type="password"
              placeholder="Min. 6 chars" value={form.password} onChange={handleChange}
              error={errors.password} autoComplete="new-password" icon={<LockIcon />} required />
          </div>
          <div style={{flex:1}}>
            <AuthInput label="Confirm" name="confirm" type="password"
              placeholder="Repeat password" value={form.confirm} onChange={handleChange}
              error={errors.confirm} autoComplete="new-password" icon={<LockIcon />} required />
          </div>
        </div>

        <div style={S.roleSection}>
          <div style={S.roleLabel}>Select your role <span style={{color:'#EF4444'}}>*</span></div>
          <div style={S.roleGrid}>
            {ROLES.map(r => {
              const active = form.role === r.value
              return (
                <button key={r.value} type="button"
                  onClick={() => setForm(f => ({ ...f, role: r.value }))}
                  style={{...S.roleCard, ...(active ? S.roleCardActive : {})}}>
                  <span style={S.roleEmoji}>{r.icon}</span>
                  <div style={{...S.roleName, color: active ? '#1D4ED8' : '#1E293B'}}>{r.label}</div>
                  <div style={S.roleDesc}>{r.desc}</div>
                  {active && (
                    <div style={S.roleCheck}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          {errors.role && (
            <p style={S.roleErr}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
                <circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="2"/>
                <path d="M12 8v4M12 16h.01" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {errors.role}
            </p>
          )}
        </div>

        <p style={S.terms}>
          By creating an account you agree to our{' '}
          <button type="button" style={S.termsLink}>Terms of Service</button>
          {' '}and{' '}
          <button type="button" style={S.termsLink}>Privacy Policy</button>.
        </p>

        <button type="submit" disabled={loading}
          style={{...S.submitBtn, ...(loading ? S.submitDisabled : {})}}
          onMouseEnter={e => { if(!loading) e.currentTarget.style.background='#1D4ED8' }}
          onMouseLeave={e => { if(!loading) e.currentTarget.style.background='#2563EB' }}>
          {loading
            ? <span style={S.row2}><span style={S.spinner}/>Creating account…</span>
            : <span style={S.row2}>Create Account
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
          }
        </button>
      </form>

      <p style={S.switchText}>
        Already have an account?{' '}
        <Link to="/login" style={S.switchLink}>Sign in instead</Link>
      </p>
    </AuthLayout>
  )
}

const S = {
  apiBanner: {display:'flex',alignItems:'flex-start',gap:'.625rem',background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:10,padding:'.75rem 1rem',fontSize:'.8125rem',color:'#DC2626',fontWeight:500,marginBottom:'1.25rem',lineHeight:1.5},
  pwdRow: {display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.875rem'},
  roleSection: {marginBottom:'1.125rem'},
  roleLabel: {fontSize:'.8125rem',fontWeight:600,color:'#374151',marginBottom:'.5rem',letterSpacing:'.01em'},
  roleGrid: {display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'.6rem'},
  roleCard: {position:'relative',padding:'.875rem .5rem',borderRadius:10,border:'1.5px solid #E2E8F0',background:'#F8FAFC',cursor:'pointer',textAlign:'center',transition:'all .18s',fontFamily:'inherit'},
  roleCardActive: {border:'1.5px solid #2563EB',background:'#EFF6FF',boxShadow:'0 0 0 3px rgba(37,99,235,.1)'},
  roleEmoji: {fontSize:'1.4rem',display:'block',marginBottom:'.3rem'},
  roleName: {fontSize:'.8rem',fontWeight:700,marginBottom:'.2rem'},
  roleDesc: {fontSize:'.65rem',color:'#94A3B8',lineHeight:1.35},
  roleCheck: {position:'absolute',top:6,right:6,width:18,height:18,borderRadius:'50%',background:'#2563EB',display:'flex',alignItems:'center',justifyContent:'center'},
  roleErr: {display:'flex',alignItems:'center',gap:'.3rem',marginTop:'.4rem',fontSize:'.775rem',color:'#EF4444',fontWeight:500},
  terms: {fontSize:'.75rem',color:'#94A3B8',textAlign:'center',marginBottom:'1rem',lineHeight:1.55},
  termsLink: {background:'none',border:'none',cursor:'pointer',color:'#2563EB',fontWeight:600,fontSize:'.75rem',padding:0,fontFamily:'inherit'},
  submitBtn: {width:'100%',height:48,background:'#2563EB',color:'#fff',border:'none',borderRadius:10,fontSize:'1rem',fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'background .18s, box-shadow .18s',boxShadow:'0 4px 14px rgba(37,99,235,.35)'},
  submitDisabled: {background:'#93C5FD',cursor:'not-allowed',boxShadow:'none'},
  row2: {display:'flex',alignItems:'center',justifyContent:'center',gap:'.5rem'},
  spinner: {display:'inline-block',width:17,height:17,border:'2.5px solid rgba(255,255,255,.35)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'},
  switchText: {textAlign:'center',fontSize:'.8125rem',color:'#64748B',marginTop:'1.25rem'},
  switchLink: {color:'#2563EB',fontWeight:600,textDecoration:'none'},
}