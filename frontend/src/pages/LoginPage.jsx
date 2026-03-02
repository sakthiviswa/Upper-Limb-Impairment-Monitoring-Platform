import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import AuthInput, { EmailIcon, LockIcon } from '../components/AuthInput'

const ROLE_PATHS = { patient: '/patient/dashboard', doctor: '/doctor/dashboard', admin: '/admin/dashboard' }

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [form, setForm]       = useState({ email: '', password: '' })
  const [errors, setErrors]   = useState({})
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
        <div style={S.apiBanner}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
            <circle cx="12" cy="12" r="10" stroke="#DC2626" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
          </svg>
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

        <div style={S.row}>
          <label style={S.checkLabel}>
            <input type="checkbox" checked={remember}
              onChange={e => setRemember(e.target.checked)} style={S.checkbox}/>
            <span style={S.checkText}>Remember me</span>
          </label>
          <button type="button" style={S.forgotBtn}>Forgot password?</button>
        </div>

        <button type="submit" disabled={loading}
          style={{...S.submitBtn, ...(loading ? S.submitDisabled : {})}}
          onMouseEnter={e => { if(!loading) e.currentTarget.style.background='#1D4ED8' }}
          onMouseLeave={e => { if(!loading) e.currentTarget.style.background='#2563EB' }}>
          {loading
            ? <span style={S.row2}><span style={S.spinner}/>Signing in…</span>
            : <span style={S.row2}>Sign In
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
          }
        </button>
      </form>

      <p style={S.switchText}>
        Don't have an account?{' '}
        <Link to="/signup" style={S.switchLink}>Create one for free</Link>
      </p>

      <div style={S.divider}>
        <div style={S.divLine}/><span style={S.divLabel}>Demo access</span><div style={S.divLine}/>
      </div>

      <div style={S.demoBox}>
        <div style={S.demoRow}>
          <span style={{fontSize:'1.25rem'}}>🔑</span>
          <div>
            <div style={S.demoTitle}>Admin credentials</div>
            <div style={S.demoCreds}>admin@healthcare.dev · Admin@1234</div>
          </div>
          <button type="button" style={S.fillBtn}
            onClick={() => setForm({email:'admin@healthcare.dev',password:'Admin@1234'})}>
            Fill
          </button>
        </div>
      </div>
    </AuthLayout>
  )
}

const S = {
  apiBanner: {display:'flex',alignItems:'flex-start',gap:'.625rem',background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:10,padding:'.75rem 1rem',fontSize:'.8125rem',color:'#DC2626',fontWeight:500,marginBottom:'1.25rem',lineHeight:1.5},
  row: {display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.375rem',marginTop:'.25rem'},
  checkLabel: {display:'flex',alignItems:'center',gap:'.5rem',cursor:'pointer'},
  checkbox: {width:16,height:16,accentColor:'#2563EB',cursor:'pointer'},
  checkText: {fontSize:'.8125rem',color:'#64748B',fontWeight:500},
  forgotBtn: {background:'none',border:'none',cursor:'pointer',fontSize:'.8125rem',color:'#2563EB',fontWeight:600,padding:0,fontFamily:'inherit'},
  submitBtn: {width:'100%',height:48,background:'#2563EB',color:'#fff',border:'none',borderRadius:10,fontSize:'1rem',fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'background .18s, box-shadow .18s',boxShadow:'0 4px 14px rgba(37,99,235,.35)'},
  submitDisabled: {background:'#93C5FD',cursor:'not-allowed',boxShadow:'none'},
  row2: {display:'flex',alignItems:'center',justifyContent:'center',gap:'.5rem'},
  spinner: {display:'inline-block',width:17,height:17,border:'2.5px solid rgba(255,255,255,.35)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'},
  switchText: {textAlign:'center',fontSize:'.8125rem',color:'#64748B',marginTop:'1.25rem'},
  switchLink: {color:'#2563EB',fontWeight:600,textDecoration:'none'},
  divider: {display:'flex',alignItems:'center',gap:'.75rem',margin:'1.375rem 0 1rem'},
  divLine: {flex:1,height:1,background:'#E2E8F0'},
  divLabel: {fontSize:'.75rem',color:'#94A3B8',fontWeight:500,textTransform:'uppercase',letterSpacing:'.06em',whiteSpace:'nowrap'},
  demoBox: {background:'#F8FAFC',border:'1px solid #E2E8F0',borderRadius:10,padding:'.875rem 1rem'},
  demoRow: {display:'flex',alignItems:'center',gap:'.75rem'},
  demoTitle: {fontSize:'.75rem',color:'#94A3B8',fontWeight:500},
  demoCreds: {fontSize:'.8125rem',color:'#374151',fontWeight:600,marginTop:'.1rem'},
  fillBtn: {marginLeft:'auto',background:'#EFF6FF',border:'1px solid #BFDBFE',color:'#2563EB',borderRadius:7,padding:'.3rem .75rem',fontSize:'.75rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit'},
}