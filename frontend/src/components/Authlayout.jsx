/**
 * AuthLayout.jsx
 * ==============
 * Split-screen auth layout.
 * Left  → Healthcare SVG illustration + brand
 * Right → Form slot (children)
 * Responsive: left panel hides below 900px.
 */

import { useEffect, useState } from 'react'

export default function AuthLayout({ children, title, subtitle }) {
  const [wide, setWide] = useState(window.innerWidth > 900)
  useEffect(() => {
    const fn = () => setWide(window.innerWidth > 900)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  return (
    <div style={{ ...S.root, fontFamily: "'Plus Jakarta Sans','Poppins',system-ui,sans-serif" }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
      {wide && (
        <div style={S.left}>
          {/* Brand */}
          <div style={S.brand}>
            <div style={S.brandIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={S.brandName}>RehabMonitor</span>
          </div>

          {/* Illustration */}
          <div style={S.illustrationWrap}>
            <HealthcareIllustration />
          </div>

          {/* Tagline */}
          <div style={S.taglineWrap}>
            <h2 style={S.taglineTitle}>Precision Rehabilitation,<br/>Powered by AI</h2>
            <p style={S.taglineSub}>
              Real-time joint angle monitoring and progress tracking
              for faster, data-driven recovery outcomes.
            </p>
            <div style={S.statsRow}>
              {[['98%','Accuracy'],['30s','Sessions'],['3x','Faster Recovery']].map(([v,l]) => (
                <div key={l} style={S.statItem}>
                  <div style={S.statVal}>{v}</div>
                  <div style={S.statLbl}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Blobs */}
          <div style={{ ...S.blob, top: -80, right: -80, opacity:.12 }} />
          <div style={{ ...S.blob, bottom:40, left:-60, opacity:.08, width:280, height:280 }} />
        </div>
      )}

      {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
      <div style={S.right}>
        <div style={S.formCard}>
          <div style={S.formHeader}>
            <div style={S.formIconWrap}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 style={S.formTitle}>{title}</h1>
            <p style={S.formSub}>{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ── Healthcare SVG Illustration ─────────────────────────────────────────── */
function HealthcareIllustration() {
  return (
    <svg viewBox="0 0 420 380" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width:'100%', maxWidth:400 }}>

      {/* Background card */}
      <rect x="30" y="40" width="360" height="300" rx="24"
        fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>

      {/* Patient body */}
      <ellipse cx="210" cy="115" rx="32" ry="32"
        fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
      <circle cx="210" cy="108" r="16" fill="rgba(255,255,255,0.25)"/>
      <path d="M170 180 Q175 148 210 145 Q245 148 250 180 L255 240 H165 Z"
        fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>

      {/* Arm with elbow tracking */}
      <path d="M175 168 L138 215 L162 230" stroke="rgba(255,255,255,0.5)"
        strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="138" cy="215" r="10" fill="none" stroke="#60A5FA" strokeWidth="2.5"/>
      <circle cx="138" cy="215" r="4" fill="#60A5FA"/>
      <path d="M148 205 A18 18 0 0 1 155 227" stroke="#93C5FD"
        strokeWidth="2" fill="none" strokeDasharray="3 2"/>
      <text x="158" y="228" fill="#BFDBFE" fontSize="11" fontFamily="system-ui" fontWeight="600">90°</text>
      <circle cx="162" cy="230" r="6" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
      <circle cx="175" cy="168" r="8" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>

      {/* Progress chart */}
      <rect x="260" y="148" width="110" height="80" rx="10"
        fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
      <text x="272" y="166" fill="rgba(255,255,255,0.6)" fontSize="8" fontFamily="system-ui">ANGLE PROGRESS</text>
      {[28,38,30,50,42,60,55].map((h,i) => (
        <rect key={i} x={272+i*13} y={218-h} width="9" height={h} rx="3"
          fill={i===6?'#60A5FA':'rgba(255,255,255,0.25)'}/>
      ))}
      <polyline points="276,190 289,180 302,185 315,165 328,170 341,155 354,158"
        stroke="#93C5FD" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="354" cy="158" r="4" fill="#60A5FA"/>

      {/* Stat pills */}
      <rect x="55" y="258" width="90" height="36" rx="10"
        fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
      <text x="72" y="271" fill="rgba(255,255,255,0.6)" fontSize="8" fontFamily="system-ui">AVG ANGLE</text>
      <text x="72" y="285" fill="white" fontSize="14" fontFamily="system-ui" fontWeight="700">87.4°</text>

      <rect x="160" y="258" width="90" height="36" rx="10"
        fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
      <text x="176" y="271" fill="rgba(255,255,255,0.6)" fontSize="8" fontFamily="system-ui">ACCURACY</text>
      <text x="176" y="285" fill="#86EFAC" fontSize="14" fontFamily="system-ui" fontWeight="700">96.2%</text>

      <rect x="265" y="258" width="90" height="36" rx="10"
        fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
      <text x="280" y="271" fill="rgba(255,255,255,0.6)" fontSize="8" fontFamily="system-ui">STATUS</text>
      <text x="280" y="285" fill="#86EFAC" fontSize="12" fontFamily="system-ui" fontWeight="700">✓ Improving</text>

      {/* Live ring timer */}
      <circle cx="90" cy="120" r="40" fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.15)" strokeWidth="2"/>
      <circle cx="90" cy="120" r="40" fill="none" stroke="#60A5FA" strokeWidth="4"
        strokeDasharray="188" strokeDashoffset="70" strokeLinecap="round"
        style={{ transform:'rotate(-90deg)', transformOrigin:'90px 120px' }}/>
      <text x="90" y="116" fill="white" fontSize="18" fontFamily="system-ui"
        fontWeight="700" textAnchor="middle">22s</text>
      <text x="90" y="130" fill="rgba(255,255,255,0.5)" fontSize="8"
        fontFamily="system-ui" textAnchor="middle">remaining</text>

      {/* Live dot */}
      <circle cx="356" cy="70" r="6" fill="#4ADE80"/>
      <circle cx="356" cy="70" r="10" fill="rgba(74,222,128,0.3)"/>
      <text x="300" y="74" fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="system-ui">● LIVE SESSION</text>
    </svg>
  )
}

/* ── Styles ──────────────────────────────────────────────────────────────── */
const S = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    background: '#F8FAFC',
  },
  left: {
    flex: '0 0 52%',
    background: 'linear-gradient(145deg, #1D4ED8 0%, #2563EB 40%, #0EA5E9 100%)',
    display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '2.5rem',
    position: 'relative', overflow: 'hidden',
  },
  brand: { display:'flex', alignItems:'center', gap:'.625rem', zIndex:1 },
  brandIcon: {
    width:38, height:38,
    background:'rgba(255,255,255,0.15)', borderRadius:10,
    display:'flex', alignItems:'center', justifyContent:'center',
    border:'1px solid rgba(255,255,255,0.2)',
  },
  brandName: { fontSize:'1.15rem', fontWeight:700, color:'#fff', letterSpacing:'-.3px' },
  illustrationWrap: {
    flex:1, display:'flex', alignItems:'center', justifyContent:'center',
    padding:'1rem 0', zIndex:1,
  },
  taglineWrap: { zIndex:1 },
  taglineTitle: {
    fontSize:'1.7rem', fontWeight:700, color:'#fff', lineHeight:1.3,
    marginBottom:'.625rem', letterSpacing:'-.4px',
  },
  taglineSub: {
    fontSize:'.875rem', color:'rgba(255,255,255,0.72)', lineHeight:1.65,
    maxWidth:340, marginBottom:'1.5rem',
  },
  statsRow:  { display:'flex', gap:'2rem' },
  statItem:  { textAlign:'left' },
  statVal:   { fontSize:'1.4rem', fontWeight:800, color:'#fff', letterSpacing:'-.5px' },
  statLbl:   { fontSize:'.72rem', color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'.8px', marginTop:'.15rem' },
  blob: {
    position:'absolute', width:340, height:340,
    borderRadius:'50%', background:'rgba(255,255,255,1)', pointerEvents:'none',
  },
  right: {
    flex:1, display:'flex', alignItems:'center', justifyContent:'center',
    padding:'2rem', background:'#F8FAFC', overflowY:'auto',
  },
  formCard: {
    width:'100%', maxWidth:440,
    background:'#fff', borderRadius:20,
    padding:'2.5rem 2.25rem',
    boxShadow:'0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 60px -10px rgba(37,99,235,.10)',
    border:'1px solid #E2E8F0',
  },
  formHeader: { marginBottom:'1.75rem' },
  formIconWrap: {
    width:44, height:44, background:'#EFF6FF', borderRadius:12,
    display:'flex', alignItems:'center', justifyContent:'center',
    marginBottom:'1rem', border:'1px solid #DBEAFE',
  },
  formTitle: {
    fontSize:'1.625rem', fontWeight:700, color:'#0F172A',
    marginBottom:'.375rem', letterSpacing:'-.4px', lineHeight:1.2,
  },
  formSub: { fontSize:'.875rem', color:'#64748B', lineHeight:1.55 },
}