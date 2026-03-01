/**
 * MonitoringSession.jsx
 * All styling via inline CSS — zero Tailwind, zero CSS files needed.
 * All original functionality preserved.
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
  improving:       { color: '#16a34a', bg: '#f0fdf4', border: '#86efac', label: 'Improving'      },
  stable:          { color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', label: 'Stable'          },
  needs_attention: { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', label: 'Needs Attention' },
  first_session:   { color: '#64748b', bg: '#f8fafc', border: '#cbd5e1', label: 'First Session'   },
}

const STEPS = [
  { n: '①', t: 'Stand 1–2 m from camera with arm fully visible side-on' },
  { n: '②', t: 'Slowly flex elbow from full extension to maximum bend' },
  { n: '③', t: 'Hold at maximum bend for 2 seconds' },
  { n: '④', t: 'Return slowly to start position and repeat' },
]

/* ─────────────── tiny reusable pieces ─────────────── */

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.stable
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      border: `1px solid ${c.border}`, color: c.color, background: c.bg,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
      {c.label}
    </span>
  )
}

function MetricCard({ label, value, accent }) {
  return (
    <div style={{
      background: accent ? '#eff6ff' : '#f8fafc',
      border: `1px solid ${accent ? '#bfdbfe' : '#e2e8f0'}`,
      borderRadius: 12, padding: '16px 10px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    }}>
      <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'monospace', color: accent ? '#2563eb' : '#1e293b', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#94a3b8' }}>{label}</span>
    </div>
  )
}

function Spinner({ size = 18, color = '#2563eb' }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: `2.5px solid ${color}33`, borderTopColor: color,
      borderRadius: '50%', animation: 'ms-spin 0.7s linear infinite',
    }} />
  )
}

/* ─────────────── Exercise SVG diagram ─────────────── */
function ExerciseDiagram() {
  return (
    <svg viewBox="0 0 480 190" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 520 }} aria-label="Elbow flexion exercise diagram">
      {/* --- POS A: Extended --- */}
      <text x="70" y="14" fontSize="10" fill="#64748b" textAnchor="middle" fontWeight="600">A — Extended</text>
      <circle cx="70" cy="40" r="13" fill="#dbeafe" stroke="#2563eb" strokeWidth="1.5"/>
      <line x1="70" y1="53" x2="70" y2="96" stroke="#2563eb" strokeWidth="3" strokeLinecap="round"/>
      <line x1="70" y1="63" x2="115" y2="80" stroke="#1e40af" strokeWidth="4" strokeLinecap="round"/>
      <line x1="115" y1="80" x2="160" y2="80" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="115" cy="80" r="5" fill="#2563eb"/>
      <circle cx="160" cy="80" r="4" fill="#60a5fa"/>
      <path d="M127 80 A14 14 0 0 1 127 66" stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeDasharray="3 2"/>
      <text x="136" y="74" fontSize="9" fill="#94a3b8" fontFamily="monospace">~170°</text>
      <line x1="70" y1="96" x2="56" y2="130" stroke="#2563eb" strokeWidth="3" strokeLinecap="round"/>
      <line x1="70" y1="96" x2="84" y2="130" stroke="#2563eb" strokeWidth="3" strokeLinecap="round"/>

      {/* arrow */}
      <line x1="185" y1="80" x2="210" y2="80" stroke="#2563eb" strokeWidth="2"/>
      <polyline points="205,75 213,80 205,85" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>

      {/* --- POS B: 90° --- */}
      <text x="260" y="14" fontSize="10" fill="#64748b" textAnchor="middle" fontWeight="600">B — 90° Flex</text>
      <circle cx="260" cy="40" r="13" fill="#dbeafe" stroke="#2563eb" strokeWidth="1.5"/>
      <line x1="260" y1="53" x2="260" y2="96" stroke="#2563eb" strokeWidth="3" strokeLinecap="round"/>
      <line x1="260" y1="63" x2="305" y2="80" stroke="#1e40af" strokeWidth="4" strokeLinecap="round"/>
      <line x1="305" y1="80" x2="305" y2="44" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="305" cy="80" r="5" fill="#2563eb"/>
      <circle cx="305" cy="44" r="4" fill="#60a5fa"/>
      <path d="M305 64 A16 16 0 0 1 289 80" stroke="#2563eb" strokeWidth="1.5" fill="none"/>
      <text x="310" y="65" fontSize="9" fill="#2563eb" fontFamily="monospace" fontWeight="700">90°</text>
      <line x1="260" y1="96" x2="246" y2="130" stroke="#2563eb" strokeWidth="3" strokeLinecap="round"/>
      <line x1="260" y1="96" x2="274" y2="130" stroke="#2563eb" strokeWidth="3" strokeLinecap="round"/>

      {/* arrow */}
      <line x1="335" y1="80" x2="360" y2="80" stroke="#2563eb" strokeWidth="2"/>
      <polyline points="355,75 363,80 355,85" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>

      {/* --- POS C: Full Flex --- */}
      <text x="420" y="14" fontSize="10" fill="#64748b" textAnchor="middle" fontWeight="600">C — Max Flex</text>
      <circle cx="420" cy="40" r="13" fill="#dbeafe" stroke="#2563eb" strokeWidth="1.5"/>
      <line x1="420" y1="53" x2="420" y2="96" stroke="#2563eb" strokeWidth="3" strokeLinecap="round"/>
      <line x1="420" y1="63" x2="450" y2="84" stroke="#1e40af" strokeWidth="4" strokeLinecap="round"/>
      <line x1="450" y1="84" x2="435" y2="50" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="450" cy="84" r="5" fill="#2563eb"/>
      <circle cx="435" cy="50" r="4" fill="#60a5fa"/>
      <path d="M442 72 A13 13 0 0 1 437 84" stroke="#16a34a" strokeWidth="1.5" fill="none"/>
      <text x="455" y="70" fontSize="9" fill="#16a34a" fontFamily="monospace" fontWeight="700">~30°</text>
      <line x1="420" y1="96" x2="406" y2="130" stroke="#2563eb" strokeWidth="3" strokeLinecap="round"/>
      <line x1="420" y1="96" x2="434" y2="130" stroke="#2563eb" strokeWidth="3" strokeLinecap="round"/>

      {/* Legend */}
      <circle cx="30" cy="158" r="4" fill="#1e40af"/>
      <text x="38" y="162" fontSize="9" fill="#64748b">Shoulder</text>
      <circle cx="100" cy="158" r="4" fill="#2563eb"/>
      <text x="108" y="162" fontSize="9" fill="#64748b">Elbow (tracked)</text>
      <circle cx="210" cy="158" r="4" fill="#60a5fa"/>
      <text x="218" y="162" fontSize="9" fill="#64748b">Wrist</text>
    </svg>
  )
}

/* ─────────────── Main Component ─────────────── */
export default function MonitoringSession({ patient, onSessionComplete }) {
  const [phase,          setPhase]      = useState('idle')
  const [timeLeft,       setTimeLeft]   = useState(DURATION)
  const [currentAngle,   setAngle]      = useState(null)
  const [liveAngles,     setLive]       = useState([])
  const [summary,        setSummary]    = useState(null)
  const [backendSession, setBS]         = useState(null)
  const [submitting,     setSubmitting] = useState(false)
  const [apiError,       setApiError]   = useState('')
  const [showGuide,      setShowGuide]  = useState(true)
  const [btnHover,       setBtnHover]   = useState(false)

  const videoRef       = useRef(null)
  const canvasRef      = useRef(null)
  const timerRef       = useRef(null)
  const startTimeRef   = useRef(null)
  const angleBufferRef = useRef([])

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
    videoRef, canvasRef, onPoseResult, enabled: phase === 'monitoring',
  })

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

  const _finishSession = useCallback(() => {
    const collected = [...angleBufferRef.current]
    const stats = computeSessionStats(collected.map(p => p.angle), patient?.target_angle || TARGET)
    setSummary({ ...stats, series: collected })
    setPhase('complete')
    _submitToBackend(collected)
  }, [patient])

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

  const startMonitoring = () => {
    setLive([]); setSummary(null); setBS(null); setApiError(''); setAngle(null); setPhase('monitoring')
  }
  const reset = () => {
    clearInterval(timerRef.current); setPhase('idle'); setLive([]); setSummary(null); setAngle(null)
  }

  const chartData = {
    labels: liveAngles.map(p => `${p.t}s`),
    datasets: [
      {
        label: 'Elbow Angle',
        data: liveAngles.map(p => p.angle),
        borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.07)',
        borderWidth: 2, pointRadius: 0, tension: 0.4, fill: true,
      },
      {
        label: `Target (${patient?.target_angle || TARGET}°)`,
        data: liveAngles.map(() => patient?.target_angle || TARGET),
        borderColor: '#94a3b8', borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0, fill: false,
      },
    ],
  }
  const chartOpts = {
    responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
    scales: {
      x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { color: '#f1f5f9' } },
      y: { min: 0, max: 180, ticks: { color: '#94a3b8', stepSize: 45, font: { size: 11 } }, grid: { color: '#f1f5f9' } },
    },
    plugins: { legend: { labels: { color: '#475569', font: { size: 11 }, boxWidth: 14 } } },
  }

  const timerPct = ((DURATION - timeLeft) / DURATION) * 100
  const r = 46; const circ = 2 * Math.PI * r

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#1e293b', background: '#f8fafc', minHeight: '100vh', padding: 24, boxSizing: 'border-box' }}>
      <style>{`
        @keyframes ms-spin { to { transform: rotate(360deg); } }
        @keyframes ms-pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>

      {/* ══════════════ IDLE ══════════════ */}
      {phase === 'idle' && (
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Page title */}
          <div>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#0f172a' }}>Monitoring Session</h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>AI-powered elbow angle tracking via webcam</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, alignItems: 'start' }}>

            {/* LEFT: Exercise guide card */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b' }}>Exercise Guide</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, border: '1px solid #bfdbfe', color: '#2563eb', background: '#eff6ff' }}>Elbow Flexion / Extension</span>
              </div>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                <ExerciseDiagram />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
                  {STEPS.map((s, i) => (
                    <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ color: '#2563eb', fontWeight: 700, fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{s.n}</span>
                      <span style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{s.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Ready card + tips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Ready to Monitor</h3>
                <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>
                  Position yourself so your full arm is visible. We'll track your <strong style={{ color: '#1e293b' }}>shoulder → elbow → wrist</strong> for {DURATION} seconds.
                </p>

                {/* Info rows */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '4px 16px', marginBottom: 20 }}>
                  {[
                    ['Patient',       patient?.name || '—'],
                    ['Target Angle',  `${patient?.target_angle || TARGET}°`],
                    ['Duration',      `${DURATION} seconds`],
                    ['Report',        'Auto-sent to doctor'],
                  ].map(([k, v], i, arr) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>{k}</span>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{v}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={startMonitoring}
                  onMouseEnter={() => setBtnHover(true)}
                  onMouseLeave={() => setBtnHover(false)}
                  disabled={!patient?.rehab_patient_id}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    padding: '14px 0', background: btnHover ? '#1d4ed8' : '#2563eb',
                    color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
                    cursor: patient?.rehab_patient_id ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                    boxShadow: '0 4px 14px rgba(37,99,235,0.3)', transition: 'background 0.2s',
                    opacity: patient?.rehab_patient_id ? 1 : 0.5,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Start 30-Second Session
                </button>
                {!patient?.rehab_patient_id && (
                  <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 8 }}>Rehab profile required to start.</p>
                )}
              </div>

              {/* Camera tips */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 16, padding: '16px 20px' }}>
                <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#2563eb' }}>Camera Tips</p>
                {['Ensure good lighting on your arm', 'Wear a fitted sleeve or roll it up', 'Keep your body centered in frame', 'Avoid fast or jerky movements'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1e40af', padding: '3px 0' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#93c5fd', flexShrink: 0 }} />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MONITORING ══════════════ */}
      {phase === 'monitoring' && (
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Live Monitoring</h2>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748b' }}>Patient: <strong>{patient?.name || '—'}</strong></p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'ms-pulse 1.2s infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#ef4444' }}>Recording</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, alignItems: 'start' }}>

            {/* ── BIG CAMERA PANEL ── */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              {/* Camera bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'ms-pulse 1.2s infinite' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b' }}>Live Camera Feed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {!poseReady && !poseError && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                      <Spinner size={14} /> Initializing…
                    </span>
                  )}
                  {poseError && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>Camera error</span>}
                  <button
                    onClick={() => setShowGuide(g => !g)}
                    style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 12px', fontSize: 12, color: '#475569', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {showGuide ? 'Hide Guide' : 'Show Guide'}
                  </button>
                </div>
              </div>

              {/* VIDEO — large */}
              <div style={{ position: 'relative', background: '#0f172a', lineHeight: 0 }}>
                <video
                  ref={videoRef} autoPlay playsInline muted
                  style={{ width: '100%', display: 'block', objectFit: 'cover', minHeight: 460, maxHeight: 560 }}
                />
                <canvas
                  ref={canvasRef}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                />

                {/* Loading overlay */}
                {!poseReady && !poseError && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.78)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#e2e8f0', fontSize: 14 }}>
                    <Spinner size={32} color="#60a5fa" />
                    <span style={{ fontWeight: 500 }}>Initializing pose detection…</span>
                  </div>
                )}
                {poseError && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fca5a5', fontSize: 14, fontWeight: 600 }}>⚠ {poseError}</span>
                  </div>
                )}

                {/* Exercise guide overlay */}
                {showGuide && (
                  <div style={{ position: 'absolute', top: 12, right: 12, width: 186, background: 'rgba(255,255,255,0.97)', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.14)' }}>
                    <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#2563eb' }}>Exercise Steps</p>
                    {STEPS.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                        <span style={{ color: '#2563eb', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{s.n}</span>
                        <span style={{ fontSize: 11, color: '#475569', lineHeight: 1.4 }}>{s.t}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Current angle chip — bottom left */}
                <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'rgba(255,255,255,0.97)', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 20px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', textAlign: 'center', minWidth: 110 }}>
                  <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'monospace', color: '#2563eb', lineHeight: 1 }}>
                    {currentAngle !== null ? `${currentAngle}°` : '—'}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', color: '#64748b', marginTop: 4 }}>Elbow Angle</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Target: <strong style={{ color: '#475569' }}>{patient?.target_angle || TARGET}°</strong></div>
                </div>

                {/* Frames chip — bottom right */}
                <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(255,255,255,0.92)', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#64748b' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>{liveAngles.length}</span> frames
                </div>
              </div>

              {/* Progress bar under video */}
              {currentAngle !== null && (
                <div style={{ padding: '12px 18px 14px', borderTop: '1px solid #f1f5f9', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 5 }}>
                    <span>Current vs Target</span>
                    <span style={{ fontWeight: 600, color: currentAngle >= (patient?.target_angle || TARGET) ? '#16a34a' : '#2563eb' }}>
                      {currentAngle >= (patient?.target_angle || TARGET) ? 'On Target' : 'Below Target'}
                    </span>
                  </div>
                  <div style={{ height: 7, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      width: `${Math.min(100, (currentAngle / 180) * 100)}%`,
                      background: currentAngle >= (patient?.target_angle || TARGET) ? '#16a34a' : '#2563eb',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#cbd5e1', marginTop: 4 }}>
                    <span>0°</span>
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>Target: {patient?.target_angle || TARGET}°</span>
                    <span>180°</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Circular timer */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#94a3b8' }}>Time Remaining</p>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="7" />
                    <circle cx="60" cy="60" r={r} fill="none" stroke="#2563eb" strokeWidth="7"
                      strokeDasharray={circ} strokeDashoffset={circ - (circ * timerPct / 100)}
                      strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
                  </svg>
                  <div style={{ position: 'absolute', textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'monospace', color: '#0f172a', lineHeight: 1 }}>{timeLeft}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: 1, marginTop: 2 }}>SEC</div>
                  </div>
                </div>

                {/* Mini stats */}
                {liveAngles.length > 5 && (() => {
                  const s = computeSessionStats(liveAngles.map(p => p.angle), patient?.target_angle)
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, width: '100%' }}>
                      {[['Avg', `${s.avg}°`], ['Max', `${s.max}°`], ['Min', `${s.min}°`], ['Acc', `${s.accuracy}%`]].map(([l, v]) => (
                        <div key={l} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 4px', textAlign: 'center' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: '#2563eb' }}>{v}</div>
                          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', color: '#94a3b8', marginTop: 2 }}>{l}</div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {/* Live chart */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', flex: 1 }}>
                <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#94a3b8' }}>Live Angle Feed</p>
                <div style={{ height: 200 }}>
                  <Line data={chartData} options={chartOpts} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ COMPLETE ══════════════ */}
      {phase === 'complete' && summary && (
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Header */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '28px 32px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Session Complete</h2>
            <p style={{ margin: '0 0 14px', color: '#64748b', fontSize: 14 }}>{DURATION}-second session · {summary.count} frames collected</p>
            {backendSession && <StatusBadge status={backendSession.injury_status} />}
          </div>

          {/* Status delta banner */}
          {backendSession && (() => {
            const c = STATUS_CFG[backendSession.injury_status] || STATUS_CFG.stable
            return (
              <div style={{ borderRadius: 16, padding: '18px 24px', border: `1.5px solid ${c.border}`, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: c.color }}>{c.label}</p>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
                    {backendSession.angle_delta !== 0
                      ? `${backendSession.angle_delta > 0 ? '+' : ''}${backendSession.angle_delta}° change from last session`
                      : 'First session — baseline established'}
                  </p>
                </div>
                <span style={{ fontSize: 34, fontWeight: 700, fontFamily: 'monospace', color: c.color }}>
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
            ].map(([l, v, a]) => <MetricCard key={l} label={l} value={v} accent={a} />)}
          </div>

          {/* Summary chart */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#94a3b8' }}>Session Recording — Angle vs Time</p>
            <div style={{ height: 220 }}>
              <Line
                data={{
                  labels: summary.series.map(p => `${p.t}s`),
                  datasets: [
                    { label: 'Elbow Angle', data: summary.series.map(p => p.angle), borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.07)', borderWidth: 2, pointRadius: 0, tension: 0.4, fill: true },
                    { label: `Target (${patient?.target_angle || TARGET}°)`, data: summary.series.map(() => patient?.target_angle || TARGET), borderColor: '#94a3b8', borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0, fill: false },
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
              <div role="alert" style={{ width: '100%', background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 12, padding: '12px 16px', fontSize: 13 }}>
                {apiError}
              </div>
            )}
            {backendSession?.pdf_path && !submitting && (
              <a
                href={`/rehab/outputs/reports/${backendSession.pdf_path.split('/').pop()}`}
                download target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', background: '#2563eb', color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: 'none', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download PDF Report
              </a>
            )}
            <button
              onClick={reset}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', background: '#fff', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              New Session
            </button>
          </div>
        </div>
      )}
    </div>
  )
}