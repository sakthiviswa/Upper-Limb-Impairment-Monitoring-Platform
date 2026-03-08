/**
 * MonitoringSession.jsx
 * Enhanced with:
 *  - "Start Camera" button → camera preview phase
 *  - "Start Recording" button → actual monitoring
 *  - Premium dark-themed medical UI
 *  - Maximize/minimize, grid overlay, live chart
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, LineElement, PointElement,
  LinearScale, CategoryScale, Filler, Tooltip, Legend,
} from 'chart.js'
import { useMediaPipe }  from '../hooks/useMediaPipe'
import { calculateAngle, extractJoints, computeSessionStats } from '../utils/angleUtils'
import rehabApi from '../utils/rehabApi'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend)

const DURATION = 30
const TARGET   = 90

const STATUS_CFG = {
  improving:       { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.3)',  label: 'Improving'      },
  stable:          { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.3)',  label: 'Stable'          },
  needs_attention: { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', label: 'Needs Attention' },
  first_session:   { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)', label: 'First Session'   },
}

const STEPS = [
  { n: '01', t: 'Stand 1–2 m from camera with arm fully visible side-on' },
  { n: '02', t: 'Slowly flex elbow from full extension to maximum bend' },
  { n: '03', t: 'Hold at maximum bend for 2 seconds' },
  { n: '04', t: 'Return slowly to start position and repeat' },
]

/* ─────────────────────────── Tiny atoms ─────────────────────────── */

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.stable
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 14px', borderRadius: 99, fontSize: 11, fontWeight: 700,
      border: `1px solid ${c.border}`, color: c.color, background: c.bg,
      letterSpacing: '0.05em', textTransform: 'uppercase',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, boxShadow: `0 0 6px ${c.color}` }} />
      {c.label}
    </span>
  )
}

function MetricCard({ label, value, accent, glow }) {
  return (
    <div style={{
      background: accent ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${accent ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 14, padding: '18px 12px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
      boxShadow: glow ? '0 0 20px rgba(59,130,246,0.15)' : 'none',
      transition: 'all 0.2s',
    }}>
      <span style={{
        fontSize: 26, fontWeight: 700, fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        color: accent ? '#60a5fa' : '#e2e8f0', lineHeight: 1,
        textShadow: accent ? '0 0 20px rgba(96,165,250,0.5)' : 'none',
      }}>{value}</span>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#475569' }}>{label}</span>
    </div>
  )
}

function Spinner({ size = 18, color = '#3b82f6' }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: `2px solid ${color}22`, borderTopColor: color,
      borderRadius: '50%', animation: 'ms-spin 0.7s linear infinite',
    }} />
  )
}

/* ─────────────────────────── Icons ─────────────────────────── */
function IconCamera({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}
function IconPlay({ size = 18, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><polygon points="5 3 19 12 5 21 5 3"/></svg>
}
function IconStop({ size = 16, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
}
function IconMaximize({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
      <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
    </svg>
  )
}
function IconMinimize({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
      <line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/>
    </svg>
  )
}
function IconRefresh({ size = 15, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  )
}
function IconDownload({ size = 15, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}

/* ─────────────────────────── Grid Overlay ─────────────────────────── */
function CameraGridOverlay({ visible }) {
  if (!visible) return null
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '33.33%', width: 1, background: 'rgba(255,255,255,0.1)' }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '66.66%', width: 1, background: 'rgba(255,255,255,0.1)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: '33.33%', height: 1, background: 'rgba(255,255,255,0.1)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: '66.66%', height: 1, background: 'rgba(255,255,255,0.1)' }} />
      {[{top:10,left:10},{top:10,right:10},{bottom:10,left:10},{bottom:10,right:10}].map((pos,i) => {
        const isR = pos.right !== undefined, isB = pos.bottom !== undefined
        return (
          <div key={i} style={{ position:'absolute', ...pos }}>
            <div style={{ position:'absolute', height:2, width:16, background:'rgba(255,255,255,0.6)', borderRadius:99, top:isB?'auto':0, bottom:isB?0:'auto', left:isR?'auto':0, right:isR?0:'auto' }} />
            <div style={{ position:'absolute', width:2, height:16, background:'rgba(255,255,255,0.6)', borderRadius:99, top:isB?'auto':0, bottom:isB?0:'auto', left:isR?'auto':0, right:isR?0:'auto' }} />
          </div>
        )
      })}
    </div>
  )
}

/* ─────────────────────────── Exercise Diagram ─────────────────────────── */
function ExerciseDiagram() {
  return (
    <svg viewBox="0 0 480 170" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width:'100%', maxWidth:500 }} aria-label="Elbow flexion exercise diagram">
      {/* A: Extended */}
      <text x="70" y="14" fontSize="10" fill="#64748b" textAnchor="middle" fontWeight="600" fontFamily="system-ui">A — Extended</text>
      <circle cx="70" cy="38" r="11" fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="1.5"/>
      <line x1="70" y1="49" x2="70" y2="88" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="70" y1="60" x2="112" y2="76" stroke="#1d4ed8" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="112" y1="76" x2="155" y2="76" stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="112" cy="76" r="5" fill="#3b82f6"/>
      <circle cx="155" cy="76" r="3.5" fill="#60a5fa"/>
      <text x="130" y="70" fontSize="9" fill="#475569" fontFamily="monospace">~170°</text>
      <line x1="70" y1="88" x2="58" y2="118" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="70" y1="88" x2="82" y2="118" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Arrow */}
      <line x1="178" y1="76" x2="198" y2="76" stroke="#334155" strokeWidth="1.5"/>
      <polyline points="194,72 202,76 194,80" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* B: 90° */}
      <text x="255" y="14" fontSize="10" fill="#64748b" textAnchor="middle" fontWeight="600" fontFamily="system-ui">B — 90° Flex</text>
      <circle cx="255" cy="38" r="11" fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="1.5"/>
      <line x1="255" y1="49" x2="255" y2="88" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="255" y1="60" x2="297" y2="76" stroke="#1d4ed8" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="297" y1="76" x2="297" y2="42" stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="297" cy="76" r="5" fill="#3b82f6"/>
      <circle cx="297" cy="42" r="3.5" fill="#60a5fa"/>
      <path d="M297 62 A16 16 0 0 1 281 76" stroke="#3b82f6" strokeWidth="1.5" fill="none"/>
      <text x="302" y="62" fontSize="9" fill="#60a5fa" fontFamily="monospace" fontWeight="700">90°</text>
      <line x1="255" y1="88" x2="243" y2="118" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="255" y1="88" x2="267" y2="118" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Arrow */}
      <line x1="322" y1="76" x2="342" y2="76" stroke="#334155" strokeWidth="1.5"/>
      <polyline points="338,72 346,76 338,80" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* C: Max Flex */}
      <text x="408" y="14" fontSize="10" fill="#64748b" textAnchor="middle" fontWeight="600" fontFamily="system-ui">C — Max Flex</text>
      <circle cx="408" cy="38" r="11" fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="1.5"/>
      <line x1="408" y1="49" x2="408" y2="88" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="408" y1="60" x2="438" y2="78" stroke="#1d4ed8" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="438" y1="78" x2="424" y2="46" stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="438" cy="78" r="5" fill="#3b82f6"/>
      <circle cx="424" cy="46" r="3.5" fill="#60a5fa"/>
      <path d="M432 66 A12 12 0 0 1 426 78" stroke="#34d399" strokeWidth="1.5" fill="none"/>
      <text x="443" y="66" fontSize="9" fill="#34d399" fontFamily="monospace" fontWeight="700">~30°</text>
      <line x1="408" y1="88" x2="396" y2="118" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="408" y1="88" x2="420" y2="118" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Legend */}
      <circle cx="24" cy="148" r="4" fill="#1d4ed8"/>
      <text x="32" y="152" fontSize="9" fill="#64748b" fontFamily="system-ui">Shoulder</text>
      <circle cx="100" cy="148" r="4" fill="#3b82f6"/>
      <text x="108" y="152" fontSize="9" fill="#64748b" fontFamily="system-ui">Elbow (tracked)</text>
      <circle cx="212" cy="148" r="4" fill="#60a5fa"/>
      <text x="220" y="152" fontSize="9" fill="#64748b" fontFamily="system-ui">Wrist</text>
    </svg>
  )
}

/* ═══════════════════════════ MAIN COMPONENT ═══════════════════════════ */
export default function MonitoringSession({ patient, onSessionComplete }) {
  // phase: 'idle' → 'camera_preview' → 'monitoring' → 'complete'
  const [phase,          setPhase]      = useState('idle')
  const [cameraReady,    setCameraReady] = useState(false)
  const [timeLeft,       setTimeLeft]   = useState(DURATION)
  const [currentAngle,   setAngle]      = useState(null)
  const [liveAngles,     setLive]       = useState([])
  const [summary,        setSummary]    = useState(null)
  const [backendSession, setBS]         = useState(null)
  const [submitting,     setSubmitting] = useState(false)
  const [apiError,       setApiError]   = useState('')
  const [showGuide,      setShowGuide]  = useState(false)
  const [isMaximized,    setMaximized]  = useState(false)
  const [showGrid,       setShowGrid]   = useState(true)
  const [countdown,      setCountdown]  = useState(null) // 3-2-1 before recording
  const [cameraError,    setCameraError] = useState('')

  const videoRef       = useRef(null)
  const canvasRef      = useRef(null)
  const timerRef       = useRef(null)
  const startTimeRef   = useRef(null)
  const angleBufferRef = useRef([])
  const streamRef      = useRef(null)

  /* ── Start camera preview (no MediaPipe yet) ── */
  const startCamera = useCallback(async () => {
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
          setCameraReady(true)
        }
      }
      setPhase('camera_preview')
    } catch (err) {
      setCameraError(err.name === 'NotAllowedError'
        ? 'Camera access denied. Please allow camera permissions.'
        : 'Could not access camera. Check your device.')
    }
  }, [])

  /* ── Stop stream helper ── */
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraReady(false)
  }, [])

  /* ── MediaPipe pose detection — only active during monitoring ── */
  const onPoseResult = useCallback((landmarks) => {
    if (phase !== 'monitoring' || !landmarks) return
    const joints = extractJoints(landmarks)
    if (!joints) return
    const angle = calculateAngle(joints.shoulder, joints.elbow, joints.wrist)
    setAngle(angle)
    const t = (Date.now() - startTimeRef.current) / 1000
    const point = { t: Math.round(t * 10) / 10, angle }
    angleBufferRef.current.push(point)
    setLive(prev => [...prev.slice(-89), point])
  }, [phase])

  const { ready: poseReady, error: poseError } = useMediaPipe({
    videoRef, canvasRef, onPoseResult,
    enabled: phase === 'monitoring',
  })

  /* ── 3-2-1 countdown before recording ── */
  const startCountdown = useCallback(() => {
    let n = 3
    setCountdown(n)
    const id = setInterval(() => {
      n -= 1
      if (n <= 0) {
        clearInterval(id)
        setCountdown(null)
        // Begin actual monitoring
        setLive([]); setSummary(null); setBS(null); setApiError(''); setAngle(null)
        setPhase('monitoring')
      } else {
        setCountdown(n)
      }
    }, 1000)
  }, [])

  /* ── Recording timer ── */
  useEffect(() => {
    if (phase !== 'monitoring') return
    startTimeRef.current = Date.now()
    setTimeLeft(DURATION)
    angleBufferRef.current = []
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); _finishSession(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  /* ── Escape key ── */
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape' && isMaximized) setMaximized(false) }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [isMaximized])

  /* ── Cleanup stream on unmount ── */
  useEffect(() => () => { stopStream(); clearInterval(timerRef.current) }, [])

  const _finishSession = useCallback(() => {
    const collected = [...angleBufferRef.current]
    const stats = computeSessionStats(collected.map(p => p.angle), patient?.target_angle || TARGET)
    setSummary({ ...stats, series: collected })
    setPhase('complete')
    stopStream()
    _submitToBackend(collected)
  }, [patient, stopStream])

  const _submitToBackend = async (series) => {
    if (!patient?.rehab_patient_id) return
    setSubmitting(true); setApiError('')
    try {
      const { data } = await rehabApi.post('/api/sessions/submit', {
        patient_id: patient.rehab_patient_id,
        angle_series: series,
        duration_secs: DURATION,
        doctor_notes: '',
      })
      setBS(data); onSessionComplete?.(data)
    } catch (err) {
      setApiError(err.response?.data?.detail || 'Failed to save session.')
    } finally { setSubmitting(false) }
  }

  const reset = () => {
    clearInterval(timerRef.current)
    stopStream()
    setPhase('idle'); setLive([]); setSummary(null); setAngle(null)
    setMaximized(false); setCountdown(null); setCameraError('')
  }

  const cancelCamera = () => {
    stopStream()
    setPhase('idle')
    setCameraError('')
  }

  /* ── Derived ── */
  const timerPct  = ((DURATION - timeLeft) / DURATION) * 100
  const r = 46, circ = 2 * Math.PI * r
  const angleColor = currentAngle === null ? '#64748b'
    : currentAngle >= (patient?.target_angle || TARGET) ? '#34d399'
    : currentAngle >= (patient?.target_angle || TARGET) * 0.7 ? '#fbbf24'
    : '#f87171'

  const chartData = {
    labels: liveAngles.map(p => `${p.t}s`),
    datasets: [
      { label: 'Elbow Angle', data: liveAngles.map(p => p.angle), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.06)', borderWidth: 2, pointRadius: 0, tension: 0.4, fill: true },
      { label: `Target (${patient?.target_angle || TARGET}°)`, data: liveAngles.map(() => patient?.target_angle || TARGET), borderColor: '#334155', borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0, fill: false },
    ],
  }
  const chartOpts = {
    responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
    scales: {
      x: { ticks: { color: '#475569', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { min: 0, max: 180, ticks: { color: '#475569', stepSize: 45, font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    },
    plugins: { legend: { labels: { color: '#64748b', font: { size: 11 }, boxWidth: 12 } } },
  }

  /* ══════════════════════════════ BASE SHELL ══════════════════════════════ */
  return (
    <div style={{
      fontFamily: "'Sora', 'Segoe UI', system-ui, sans-serif",
      color: '#e2e8f0',
      background: '#0a0f1e',
      minHeight: '100vh',
      padding: 0,
      boxSizing: 'border-box',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes ms-spin   { to { transform: rotate(360deg); } }
        @keyframes ms-pulse  { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes ms-fadein { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
        @keyframes ms-slideup{ from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ms-countdown { 0%{opacity:0;transform:scale(0.6)} 20%{opacity:1;transform:scale(1.1)} 80%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(0.8)} }
        @keyframes ms-scanline { 0%{top:-4px} 100%{top:100%} }
        @keyframes ms-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        .ms-cam-maximize-overlay { position:fixed!important; inset:0!important; z-index:1000!important; border-radius:0!important; border:none!important; animation:ms-fadein 0.2s ease; }
        .ms-icon-btn { display:flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04); cursor:pointer; transition:all 0.15s; color:#64748b; }
        .ms-icon-btn:hover { border-color:rgba(59,130,246,0.4); background:rgba(59,130,246,0.1); color:#60a5fa; }
        .ms-pill-btn { display:flex; align-items:center; gap:6px; padding:5px 12px; border-radius:8px; font-size:11px; font-weight:600; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04); cursor:pointer; transition:all 0.15s; color:#94a3b8; font-family:inherit; letter-spacing:0.02em; }
        .ms-pill-btn:hover { border-color:rgba(59,130,246,0.4); background:rgba(59,130,246,0.1); color:#60a5fa; }
        .ms-pill-btn.active { border-color:rgba(59,130,246,0.4); background:rgba(59,130,246,0.1); color:#60a5fa; }
        .ms-section { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07); border-radius:16px; overflow:hidden; }
        .ms-section-header { padding:14px 20px; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:space-between; }
        .ms-label { font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#475569; }
        .ms-divider { width:1px; height:18px; background:rgba(255,255,255,0.08); margin:0 4px; }
      `}</style>

      <div style={{ padding: 24 }}>

        {/* ════════════════ IDLE ════════════════ */}
        {phase === 'idle' && (
          <div style={{ maxWidth: 1020, margin: '0 auto', animation: 'ms-fadein 0.3s ease' }}>

            {/* Page title */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconCamera size={17} color="#60a5fa" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em' }}>Monitoring Session</h2>
                  <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>AI-powered elbow angle tracking · MediaPipe pose detection</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, alignItems: 'start' }}>

              {/* Left: Exercise Guide */}
              <div className="ms-section">
                <div className="ms-section-header">
                  <span className="ms-label">Exercise Guide</span>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99, border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', background: 'rgba(59,130,246,0.08)' }}>
                    Elbow Flexion / Extension
                  </span>
                </div>
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                  <ExerciseDiagram />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
                    {STEPS.map((s, i) => (
                      <div key={i} style={{
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10,
                      }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#3b82f6', fontWeight: 700, fontSize: 13, lineHeight: 1, flexShrink: 0, opacity: 0.8 }}>{s.n}</span>
                        <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.55 }}>{s.t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Setup */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Session info card */}
                <div className="ms-section">
                  <div className="ms-section-header">
                    <span className="ms-label">Session Setup</span>
                  </div>
                  <div style={{ padding: '0 20px' }}>
                    {[
                      ['Patient',      patient?.name || '—'],
                      ['Target Angle', `${patient?.target_angle || TARGET}°`],
                      ['Duration',     `${DURATION} seconds`],
                      ['Report',       'Auto-sent to doctor'],
                    ].map(([k, v], i, arr) => (
                      <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom: i<arr.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none', fontSize:13 }}>
                        <span style={{ color:'#64748b' }}>{k}</span>
                        <span style={{ fontWeight:600, color:'#e2e8f0', fontFamily: k==='Target Angle' || k==='Duration' ? "'JetBrains Mono', monospace" : 'inherit' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: 20, paddingTop: 16 }}>
                    {cameraError && (
                      <div style={{ background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.25)', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#f87171', marginBottom:12, lineHeight:1.5 }}>
                        {cameraError}
                      </div>
                    )}
                    <button
                      onClick={startCamera}
                      disabled={!patient?.rehab_patient_id}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        padding: '14px 0',
                        background: patient?.rehab_patient_id ? 'linear-gradient(135deg, #1d4ed8, #3b82f6)' : 'rgba(255,255,255,0.04)',
                        color: patient?.rehab_patient_id ? '#fff' : '#475569',
                        border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
                        cursor: patient?.rehab_patient_id ? 'pointer' : 'not-allowed',
                        fontFamily: 'inherit',
                        boxShadow: patient?.rehab_patient_id ? '0 4px 20px rgba(59,130,246,0.35), 0 0 0 1px rgba(59,130,246,0.2)' : 'none',
                        transition: 'all 0.2s',
                        opacity: patient?.rehab_patient_id ? 1 : 0.5,
                        letterSpacing: '0.01em',
                      }}
                    >
                      <IconCamera size={18} color="currentColor" />
                      Start Camera
                    </button>
                    {!patient?.rehab_patient_id && (
                      <p style={{ textAlign: 'center', fontSize: 11, color: '#475569', marginTop: 8, margin: '8px 0 0' }}>Rehab profile required.</p>
                    )}
                  </div>
                </div>

                {/* Tips */}
                <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 14, padding: '16px 18px' }}>
                  <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#3b82f6' }}>Camera Tips</p>
                  {['Ensure good lighting on your arm', 'Wear a fitted sleeve or roll it up', 'Keep your body centered in frame', 'Avoid fast or jerky movements'].map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#60a5fa', padding: '3px 0', opacity: 0.85 }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ CAMERA PREVIEW ════════════════ */}
        {(phase === 'camera_preview' || phase === 'monitoring') && (
          <div style={{ maxWidth: isMaximized ? '100%' : 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: isMaximized ? 0 : 20, animation: phase==='camera_preview' ? 'ms-fadein 0.3s ease' : undefined }}>

            {/* Header */}
            {!isMaximized && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                    {phase === 'camera_preview' ? 'Camera Preview' : 'Live Monitoring'}
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>
                    Patient: <strong style={{ color: '#94a3b8' }}>{patient?.name || '—'}</strong>
                    {phase === 'camera_preview' && ' · Position yourself, then start recording'}
                  </p>
                </div>
                {phase === 'monitoring' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f87171', animation: 'ms-pulse 1.2s infinite' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f87171' }}>Recording</span>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: isMaximized ? '1fr' : '1.5fr 1fr', gap: isMaximized ? 0 : 20, alignItems: 'start' }}>

              {/* ── BIG CAMERA PANEL ── */}
              <div
                className={isMaximized ? 'ms-cam-maximize-overlay' : 'ms-section'}
                style={{
                  background: '#0a0f1e',
                  display: 'flex', flexDirection: 'column',
                  borderRadius: isMaximized ? 0 : 16,
                  overflow: 'hidden',
                }}
              >
                {/* Camera toolbar */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(0,0,0,0.3)', flexShrink: 0, zIndex: 2,
                }}>
                  {/* Left */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cameraReady ? '#34d399' : '#f87171', boxShadow: cameraReady ? '0 0 6px #34d399' : '0 0 6px #f87171' }} />
                      <span className="ms-label">{cameraReady ? 'Camera Active' : 'Connecting…'}</span>
                    </div>
                    {phase === 'monitoring' && (
                      <>
                        <div className="ms-divider" />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', animation: 'ms-blink 1s infinite' }} />
                          <span className="ms-label" style={{ color: '#f87171' }}>REC</span>
                        </div>
                        {isMaximized && (
                          <>
                            <div className="ms-divider" />
                            <span style={{ fontSize: 11, color: '#64748b' }}>Patient: <strong style={{ color: '#94a3b8' }}>{patient?.name || '—'}</strong></span>
                          </>
                        )}
                      </>
                    )}
                    {phase === 'monitoring' && !poseReady && !poseError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
                        <Spinner size={12} color="#60a5fa" /> Initializing pose…
                      </div>
                    )}
                  </div>

                  {/* Right */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {/* Grid toggle */}
                    <button
                      title={showGrid ? 'Hide grid' : 'Show grid'}
                      onClick={() => setShowGrid(g => !g)}
                      className={`ms-icon-btn ${showGrid ? 'active' : ''}`}
                      style={showGrid ? { borderColor:'rgba(59,130,246,0.4)', background:'rgba(59,130,246,0.1)', color:'#60a5fa' } : {}}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                      </svg>
                    </button>

                    {/* Guide toggle */}
                    <button
                      onClick={() => setShowGuide(g => !g)}
                      className={`ms-pill-btn ${showGuide ? 'active' : ''}`}
                    >
                      {showGuide ? 'Hide Guide' : 'Show Guide'}
                    </button>

                    <div className="ms-divider" />

                    {/* Maximize */}
                    <button
                      title={isMaximized ? 'Minimize (Esc)' : 'Maximize'}
                      onClick={() => setMaximized(m => !m)}
                      className="ms-pill-btn"
                      style={isMaximized ? { borderColor:'rgba(59,130,246,0.4)', background:'rgba(59,130,246,0.1)', color:'#60a5fa' } : {}}
                    >
                      {isMaximized ? <><IconMinimize size={12} color="currentColor" /> Minimize</> : <><IconMaximize size={12} color="currentColor" /> Maximize</>}
                    </button>
                  </div>
                </div>

                {/* Video area */}
                <div style={{ position: 'relative', background: '#000', lineHeight: 0, flex: isMaximized ? 1 : 'none' }}>
                  <video
                    ref={videoRef} autoPlay playsInline muted
                    style={{
                      width: '100%', display: 'block', objectFit: 'cover',
                      minHeight: isMaximized ? 'calc(100vh - 52px - 60px)' : 440,
                      maxHeight: isMaximized ? 'none' : 520,
                      transform: 'scaleX(-1)', // Mirror for natural preview
                    }}
                  />
                  <canvas
                    ref={canvasRef}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', transform: 'scaleX(-1)' }}
                  />

                  <CameraGridOverlay visible={showGrid} />

                  {/* Scanline effect during recording */}
                  {phase === 'monitoring' && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(transparent, rgba(248,113,113,0.25), transparent)', animation: 'ms-scanline 2.5s linear infinite', pointerEvents: 'none', zIndex: 2 }} />
                  )}

                  {/* Camera preview overlay — before recording starts */}
                  {phase === 'camera_preview' && !countdown && (
                    <div style={{
                      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)',
                      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                      paddingBottom: 28, zIndex: 10,
                    }}>
                      <div style={{ textAlign: 'center', animation: 'ms-slideup 0.25s ease' }}>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 16, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                          Position your arm in frame, then press Start Recording
                        </p>
                        <button
                          onClick={startCountdown}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 10,
                            padding: '14px 32px',
                            background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                            color: '#fff', border: 'none', borderRadius: 50,
                            fontSize: 15, fontWeight: 700, cursor: 'pointer',
                            fontFamily: 'inherit', letterSpacing: '0.02em',
                            boxShadow: '0 4px 24px rgba(239,68,68,0.5), 0 0 0 1px rgba(239,68,68,0.3)',
                          }}
                        >
                          <IconPlay size={16} color="#fff" />
                          Start Recording
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3-2-1 Countdown overlay */}
                  {countdown !== null && (
                    <div style={{
                      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      zIndex: 20,
                    }}>
                      <div style={{
                        fontSize: 100, fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: '#fff',
                        textShadow: '0 0 60px rgba(59,130,246,0.8)',
                        animation: 'ms-countdown 1s ease forwards',
                        key: countdown,
                      }}>
                        {countdown}
                      </div>
                    </div>
                  )}

                  {/* Pose loading overlay */}
                  {phase === 'monitoring' && !poseReady && !poseError && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,15,30,0.75)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 13, color: '#94a3b8', zIndex: 5 }}>
                      <Spinner size={28} color="#60a5fa" />
                      <span style={{ fontWeight: 500 }}>Initializing pose detection…</span>
                    </div>
                  )}
                  {poseError && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,15,30,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                      <span style={{ color: '#f87171', fontSize: 13, fontWeight: 600 }}>Camera error: {poseError}</span>
                    </div>
                  )}

                  {/* Guide overlay */}
                  {showGuide && (
                    <div style={{
                      position: 'absolute', top: 12, right: 12,
                      width: 190, background: 'rgba(10,15,30,0.92)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 14,
                      boxShadow: '0 8px 30px rgba(0,0,0,0.4)', zIndex: 10,
                      backdropFilter: 'blur(10px)',
                      animation: 'ms-slideup 0.2s ease',
                    }}>
                      <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3b82f6' }}>Exercise Steps</p>
                      {STEPS.map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#3b82f6', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{s.n}</span>
                          <span style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.45 }}>{s.t}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Angle chip — bottom left (monitoring only) */}
                  {phase === 'monitoring' && (
                    <div style={{
                      position: 'absolute', bottom: 16, left: 16,
                      background: 'rgba(10,15,30,0.9)',
                      border: `1.5px solid ${angleColor}44`,
                      borderRadius: 16, padding: '14px 20px',
                      boxShadow: `0 4px 20px ${angleColor}22`,
                      textAlign: 'center', minWidth: 120, zIndex: 10,
                      backdropFilter: 'blur(10px)',
                    }}>
                      <div style={{ fontSize: isMaximized ? 48 : 38, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: angleColor, lineHeight: 1, transition: 'color 0.3s', textShadow: `0 0 20px ${angleColor}66` }}>
                        {currentAngle !== null ? `${currentAngle}°` : '—'}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#475569', marginTop: 4 }}>Elbow Angle</div>
                      <div style={{ fontSize: 11, color: '#334155', marginTop: 3 }}>Target: <strong style={{ color: '#64748b' }}>{patient?.target_angle || TARGET}°</strong></div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 6 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: angleColor, animation: 'ms-pulse 1.5s infinite', boxShadow: `0 0 6px ${angleColor}` }} />
                        <span style={{ fontSize: 10, fontWeight: 600, color: angleColor }}>
                          {currentAngle === null ? 'Detecting…'
                            : currentAngle >= (patient?.target_angle || TARGET) ? 'On Target'
                            : currentAngle >= (patient?.target_angle || TARGET) * 0.7 ? 'Close'
                            : 'Below Target'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Live stats (maximized) */}
                  {isMaximized && phase === 'monitoring' && liveAngles.length > 5 && (() => {
                    const s = computeSessionStats(liveAngles.map(p => p.angle), patient?.target_angle)
                    return (
                      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 10 }}>
                        {[['Avg', `${s.avg}°`], ['Max', `${s.max}°`], ['Min', `${s.min}°`], ['Acc', `${s.accuracy}%`]].map(([l, v]) => (
                          <div key={l} style={{ background: 'rgba(10,15,30,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
                            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#60a5fa' }}>{v}</div>
                            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#475569' }}>{l}</div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}

                  {/* Timer chip (maximized) */}
                  {isMaximized && phase === 'monitoring' && (
                    <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10, background: 'rgba(10,15,30,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '10px 18px', backdropFilter: 'blur(10px)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="52" height="52" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                          <circle cx="26" cy="26" r="20" fill="none" stroke="#3b82f6" strokeWidth="4"
                            strokeDasharray={2 * Math.PI * 20} strokeDashoffset={(2 * Math.PI * 20) - (2 * Math.PI * 20 * timerPct / 100)}
                            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
                        </svg>
                        <div style={{ position: 'absolute', left: 26, top: 22, width: 52, textAlign: 'center' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#f1f5f9' }}>{timeLeft}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#475569' }}>Time Left</div>
                          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{liveAngles.length} frames</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Frames badge */}
                  {!isMaximized && phase === 'monitoring' && (
                    <div style={{ position: 'absolute', bottom: 14, right: 14, background: 'rgba(10,15,30,0.85)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '5px 12px', fontSize: 11, color: '#64748b', zIndex: 10, backdropFilter: 'blur(8px)' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#94a3b8' }}>{liveAngles.length}</span> frames
                    </div>
                  )}
                </div>

                {/* Bottom bar: angle progress (monitoring, not maximized) */}
                {!isMaximized && phase === 'monitoring' && currentAngle !== null && (
                  <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#475569', marginBottom: 5 }}>
                      <span>Angle Progress</span>
                      <span style={{ fontWeight: 600, color: angleColor, textShadow: `0 0 10px ${angleColor}66` }}>
                        {currentAngle >= (patient?.target_angle || TARGET) ? 'On Target' : currentAngle >= (patient?.target_angle || TARGET) * 0.7 ? 'Close' : 'Below Target'}
                      </span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, width: `${Math.min(100, (currentAngle / 180) * 100)}%`, background: `linear-gradient(90deg, #3b82f6, ${angleColor})`, transition: 'width 0.3s ease', boxShadow: `0 0 8px ${angleColor}66` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#334155', marginTop: 4 }}>
                      <span>0°</span>
                      <span style={{ color: '#475569', fontWeight: 600 }}>Target: {patient?.target_angle || TARGET}°</span>
                      <span>180°</span>
                    </div>
                  </div>
                )}

                {/* Bottom action bar (camera_preview, not maximized) */}
                {!isMaximized && phase === 'camera_preview' && !countdown && (
                  <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      onClick={startCountdown}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '11px 0',
                        background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                        color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.02em',
                        boxShadow: '0 4px 16px rgba(239,68,68,0.4)',
                      }}
                    >
                      <IconPlay size={14} color="#fff" /> Start Recording
                    </button>
                    <button
                      onClick={cancelCamera}
                      style={{
                        padding: '11px 18px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 10, fontSize: 13, fontWeight: 600,
                        color: '#64748b', cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* ── RIGHT COLUMN (not maximized) ── */}
              {!isMaximized && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Camera preview state info */}
                  {phase === 'camera_preview' && !countdown && (
                    <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 14, padding: '20px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399', animation: 'ms-pulse 2s infinite' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#34d399' }}>Camera Ready</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                        Your camera is live. Position yourself so your full arm — <strong style={{ color: '#94a3b8' }}>shoulder to wrist</strong> — is visible in the frame.
                      </p>
                      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {['Stand side-on to the camera', 'Keep arm visible from shoulder to wrist', 'Ensure good lighting'].map((t, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569' }}>
                            <div style={{ width: 18, height: 18, borderRadius: 6, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, color: '#3b82f6', fontFamily: 'monospace' }}>{i+1}</span>
                            </div>
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Circular timer (monitoring) */}
                  {phase === 'monitoring' && (
                    <div className="ms-section" style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                      <p style={{ margin: 0 }} className="ms-label">Time Remaining</p>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
                          <circle cx="60" cy="60" r={r} fill="none" stroke="#3b82f6" strokeWidth="7"
                            strokeDasharray={circ} strokeDashoffset={circ - (circ * timerPct / 100)}
                            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear', filter: 'drop-shadow(0 0 6px #3b82f6)' }} />
                        </svg>
                        <div style={{ position: 'absolute', textAlign: 'center' }}>
                          <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#f1f5f9', lineHeight: 1, textShadow: '0 0 20px rgba(59,130,246,0.4)' }}>{timeLeft}</div>
                          <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.1em', marginTop: 2 }}>SEC</div>
                        </div>
                      </div>
                      {liveAngles.length > 5 && (() => {
                        const s = computeSessionStats(liveAngles.map(p => p.angle), patient?.target_angle)
                        return (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, width: '100%' }}>
                            {[['Avg', `${s.avg}°`], ['Max', `${s.max}°`], ['Min', `${s.min}°`], ['Acc', `${s.accuracy}%`]].map(([l, v]) => (
                              <div key={l} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 4px', textAlign: 'center' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#60a5fa' }}>{v}</div>
                                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#475569', marginTop: 2 }}>{l}</div>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {/* Live chart */}
                  {phase === 'monitoring' && (
                    <div className="ms-section" style={{ padding: '18px 20px', flex: 1 }}>
                      <p style={{ margin: '0 0 12px' }} className="ms-label">Live Angle Feed</p>
                      <div style={{ height: 200 }}>
                        <Line data={chartData} options={chartOpts} />
                      </div>
                    </div>
                  )}

                  {/* Stop early (monitoring) */}
                  {phase === 'monitoring' && (
                    <button
                      onClick={() => { clearInterval(timerRef.current); _finishSession() }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '11px 0',
                        background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                        borderRadius: 10, fontSize: 13, fontWeight: 600,
                        color: '#f87171', cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all 0.15s',
                      }}
                    >
                      <IconStop size={13} color="#f87171" /> Stop Recording Early
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════ COMPLETE ════════════════ */}
        {phase === 'complete' && summary && (
          <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20, animation: 'ms-fadein 0.3s ease' }}>

            {/* Header card */}
            <div className="ms-section" style={{ padding: '28px 32px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 0 20px rgba(52,211,153,0.15)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em' }}>Session Complete</h2>
              <p style={{ margin: '0 0 14px', color: '#475569', fontSize: 13 }}>{DURATION}-second session · {summary.count} frames collected</p>
              {backendSession && <StatusBadge status={backendSession.injury_status} />}
            </div>

            {/* Status banner */}
            {backendSession && (() => {
              const c = STATUS_CFG[backendSession.injury_status] || STATUS_CFG.stable
              return (
                <div style={{ borderRadius: 14, padding: '18px 24px', border: `1px solid ${c.border}`, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: c.color }}>{c.label}</p>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
                      {backendSession.angle_delta !== 0
                        ? `${backendSession.angle_delta > 0 ? '+' : ''}${backendSession.angle_delta}° change from last session`
                        : 'First session — baseline established'}
                    </p>
                  </div>
                  <span style={{ fontSize: 36, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: c.color, textShadow: `0 0 20px ${c.color}66` }}>
                    {backendSession.angle_delta > 0 ? '+' : ''}{backendSession.angle_delta}°
                  </span>
                </div>
              )
            })()}

            {/* Metrics grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                ['Avg Angle',   `${summary.avg}°`,         true],
                ['Max Angle',   `${summary.max}°`,         false],
                ['Min Angle',   `${summary.min}°`,         false],
                ['Accuracy',    `${summary.accuracy}%`,    true],
                ['Consistency', `${summary.consistency}%`, false],
                ['Std Dev',     `${summary.stdDev}°`,      false],
              ].map(([l, v, a]) => <MetricCard key={l} label={l} value={v} accent={a} glow={a} />)}
            </div>

            {/* Chart */}
            <div className="ms-section" style={{ padding: '20px 24px' }}>
              <p style={{ margin: '0 0 14px' }} className="ms-label">Session Recording — Angle vs Time</p>
              <div style={{ height: 220 }}>
                <Line
                  data={{
                    labels: summary.series.map(p => `${p.t}s`),
                    datasets: [
                      { label: 'Elbow Angle', data: summary.series.map(p => p.angle), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.06)', borderWidth: 2, pointRadius: 0, tension: 0.4, fill: true },
                      { label: `Target (${patient?.target_angle || TARGET}°)`, data: summary.series.map(() => patient?.target_angle || TARGET), borderColor: '#334155', borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0, fill: false },
                    ],
                  }}
                  options={chartOpts}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              {submitting && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
                  <Spinner size={16} /> Saving session and generating report…
                </span>
              )}
              {apiError && (
                <div style={{ width: '100%', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', borderRadius: 12, padding: '12px 16px', fontSize: 13 }}>
                  {apiError}
                </div>
              )}
              {backendSession?.pdf_path && !submitting && (
                <a
                  href={`/rehab/outputs/reports/${backendSession.pdf_path.split('/').pop()}`}
                  download target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 16px rgba(59,130,246,0.35)' }}
                >
                  <IconDownload size={15} color="#fff" /> Download PDF Report
                </a>
              )}
              <button
                onClick={reset}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <IconRefresh size={15} color="currentColor" /> New Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}