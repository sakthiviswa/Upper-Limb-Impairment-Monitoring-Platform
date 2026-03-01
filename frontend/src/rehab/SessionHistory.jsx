/**
 * SessionHistory.jsx
 * All styling via inline CSS — zero Tailwind, zero CSS files needed.
 * All original functionality preserved.
 */

import { useState, useEffect } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, BarElement, CategoryScale,
  LinearScale, Tooltip, Legend,
} from 'chart.js'
import rehabApi from '../utils/rehabApi'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const STATUS_CFG = {
  improving:       { color: '#16a34a', bg: '#f0fdf4', border: '#86efac', dot: '#16a34a', label: 'Improving'      },
  stable:          { color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', dot: '#2563eb', label: 'Stable'          },
  needs_attention: { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', dot: '#dc2626', label: 'Needs Attention' },
  first_session:   { color: '#64748b', bg: '#f8fafc', border: '#cbd5e1', dot: '#94a3b8', label: 'First Session'   },
}

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.stable
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      border: `1px solid ${c.border}`, color: c.color, background: c.bg,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  )
}

function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 18, height: 18,
      border: '2.5px solid #bfdbfe', borderTopColor: '#2563eb',
      borderRadius: '50%', animation: 'sh-spin 0.7s linear infinite',
    }} />
  )
}

/* ─── Expandable Session Card ─────────────────────────────────────────────── */
function SessionCard({ s }) {
  const [open, setOpen] = useState(false)
  const c = STATUS_CFG[s.injury_status] || STATUS_CFG.stable

  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
      overflow: 'hidden', boxShadow: '0 1px 5px rgba(0,0,0,0.05)',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Card header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: '#eff6ff', border: '1px solid #bfdbfe',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: '#2563eb' }}>#{s.id}</span>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Session {s.id}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>{new Date(s.created_at).toLocaleString()}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusBadge status={s.injury_status} />
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              width: 28, height: 28, borderRadius: 8, background: '#f1f5f9',
              border: '1px solid #e2e8f0', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Metric pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '14px 18px' }}>
        {[
          ['Avg',   `${s.avg_angle}°`,  true],
          ['Max',   `${s.max_angle}°`,  false],
          ['Acc',   `${s.accuracy}%`,   false],
          ['Delta', `${s.angle_delta > 0 ? '+' : ''}${s.angle_delta}°`, s.angle_delta > 0],
        ].map(([l, v, hi]) => (
          <div key={l} style={{
            background: hi ? '#eff6ff' : '#f8fafc',
            border: `1px solid ${hi ? '#bfdbfe' : '#e2e8f0'}`,
            borderRadius: 10, padding: '10px 6px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'monospace', color: hi ? '#2563eb' : '#1e293b' }}>{v}</div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', color: '#94a3b8', marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Expanded section */}
      {open && (
        <div style={{ padding: '0 18px 16px', borderTop: '1px solid #f1f5f9', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {s.angle_delta !== 0 && (
            <div style={{ borderRadius: 12, padding: '12px 16px', border: `1px solid ${c.border}`, background: c.bg }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: c.color }}>{c.label}:&nbsp;</span>
              <span style={{ fontSize: 13, color: '#475569' }}>
                {s.angle_delta > 0 ? '+' : ''}{s.angle_delta}° from previous session
              </span>
            </div>
          )}
          {s.pdf_path ? (
            <a
              href={`/rehab/outputs/reports/${s.pdf_path.split('/').pop()}`}
              download target="_blank" rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 0', background: '#2563eb', color: '#fff',
                borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(37,99,235,0.2)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Session Report
            </a>
          ) : (
            <p style={{ textAlign: 'center', fontSize: 12, color: '#cbd5e1', margin: 0 }}>No PDF report available</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function SessionHistory({ patient }) {
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [view,     setView]     = useState('cards') // 'cards' | 'table'

  useEffect(() => {
    if (!patient?.rehab_patient_id) { setLoading(false); return }
    rehabApi.get(`/api/sessions/patient/${patient.rehab_patient_id}`)
      .then(r => setSessions(r.data))
      .catch(() => setError('Could not load session history.'))
      .finally(() => setLoading(false))
  }, [patient])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 10, color: '#64748b', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`@keyframes sh-spin { to { transform:rotate(360deg); } }`}</style>
      <Spinner /> Loading session history…
    </div>
  )

  if (error) return (
    <div role="alert" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 14, padding: '14px 18px', fontSize: 14, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {error}
    </div>
  )

  if (!sessions.length) return (
    <div style={{ textAlign: 'center', padding: '56px 32px', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
      </div>
      <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: '#475569' }}>No sessions yet</h3>
      <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>Complete your first monitoring session above to see your history here.</p>
    </div>
  )

  const sorted = [...sessions].reverse()

  // Summary numbers
  const overallAvg  = (sessions.reduce((a, s) => a + s.avg_angle, 0) / sessions.length).toFixed(1)
  const improving   = sessions.filter(s => s.injury_status === 'improving').length
  const latestDelta = sessions[sessions.length - 1]?.angle_delta || 0

  // Bar chart
  const barData = {
    labels: sorted.map(s => `S${s.id}`),
    datasets: [
      {
        label: 'Avg Angle (°)',
        data: sorted.map(s => s.avg_angle),
        backgroundColor: sorted.map(s => (STATUS_CFG[s.injury_status]?.color || '#2563eb') + '25'),
        borderColor:     sorted.map(s =>  STATUS_CFG[s.injury_status]?.color || '#2563eb'),
        borderWidth: 2, borderRadius: 6,
      },
      {
        label: `Target (${patient?.target_angle || 90}°)`,
        data: sorted.map(() => patient?.target_angle || 90),
        type: 'line', borderColor: '#cbd5e1',
        borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0, fill: false,
      },
    ],
  }
  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { color: '#f8fafc' } },
      y: { min: 0, max: 180, ticks: { color: '#94a3b8', stepSize: 45, font: { size: 11 } }, grid: { color: '#f1f5f9' } },
    },
    plugins: {
      legend: { labels: { color: '#475569', font: { size: 11 }, boxWidth: 14 } },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}°` } },
    },
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#1e293b', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes sh-spin { to { transform:rotate(360deg); } }`}</style>

      {/* ── Summary stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'Total Sessions', value: sessions.length,   sub: 'completed'   },
          { label: 'Overall Avg',    value: `${overallAvg}°`,  sub: 'angle'       },
          { label: 'Improving',      value: improving,          sub: 'sessions'    },
          { label: 'Latest Change',  value: `${latestDelta > 0 ? '+' : ''}${latestDelta}°`, sub: 'from last' },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '18px 16px', textAlign: 'center', boxShadow: '0 1px 5px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'monospace', color: '#0f172a', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#94a3b8', marginTop: 6 }}>{label}</div>
            <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Progress chart card ── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 5px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1e293b' }}>Progress Overview</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>{sessions.length} sessions · average angle per session</p>
          </div>
          {/* View toggle */}
          <div style={{ display: 'flex', gap: 6 }}>
            {['cards', 'table'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: view === v ? '#2563eb' : '#f1f5f9',
                  color: view === v ? '#fff' : '#64748b',
                  boxShadow: view === v ? '0 2px 6px rgba(37,99,235,0.2)' : 'none',
                  transition: 'all 0.15s',
                  textTransform: 'capitalize',
                }}
              >
                {v === 'cards' ? 'Cards' : 'Table'}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{ height: 240 }}>
            <Bar data={barData} options={barOpts} />
          </div>
        </div>

        {/* Status legend */}
        <div style={{ display: 'flex', gap: 18, padding: '0 24px 16px', flexWrap: 'wrap' }}>
          {Object.entries(STATUS_CFG).map(([key, c]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
              {c.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Cards view ── */}
      {view === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {sorted.map(s => <SessionCard key={s.id} s={s} />)}
        </div>
      )}

      {/* ── Table view ── */}
      {view === 'table' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 5px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1e293b' }}>All Sessions</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['#', 'Date', 'Status', 'Avg', 'Max', 'Accuracy', 'Delta', 'Report'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fff' : '#fafafa', transition: 'background 0.1s' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#1e293b', fontSize: 12 }}>#{s.id}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={s.injury_status} /></td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>{s.avg_angle}°</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#475569' }}>{s.max_angle}°</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#475569' }}>{s.accuracy}%</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, fontSize: 13,
                      color: s.angle_delta > 0 ? '#16a34a' : s.angle_delta < 0 ? '#dc2626' : '#94a3b8' }}>
                      {s.angle_delta > 0 ? '+' : ''}{s.angle_delta}°
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {s.pdf_path ? (
                        <a href={`/rehab/outputs/reports/${s.pdf_path.split('/').pop()}`}
                          download target="_blank" rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#2563eb', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          PDF
                        </a>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}