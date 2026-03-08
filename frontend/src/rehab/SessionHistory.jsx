/**
 * SessionHistory.jsx — fully theme-aware via CSS variables
 */

import { useState, useEffect } from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import rehabApi from '../utils/rehabApi'
import { useTheme } from '../context/ThemeContext'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const STATUS_CFG = {
  improving:       { color: '#10b981', label: 'Improving'      },
  stable:          { color: '#3b82f6', label: 'Stable'          },
  needs_attention: { color: '#ef4444', label: 'Needs Attention' },
  first_session:   { color: '#94a3b8', label: 'First Session'   },
}

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.stable
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
      color: c.color,
      background: `${c.color}15`,
      border: `1px solid ${c.color}40`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color }} />
      {c.label}
    </span>
  )
}

function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 22, height: 22,
      border: '3px solid var(--border)', borderTopColor: 'var(--brand)',
      borderRadius: '50%', animation: 'sh-spin 0.7s linear infinite',
    }} />
  )
}

function Card({ children, style = {}, noPad }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, boxShadow: 'var(--shadow-sm)',
      padding: noPad ? 0 : '1.25rem', overflow: 'hidden', ...style,
    }}>
      {children}
    </div>
  )
}

/* ── Session Card ─────────────────────────────────────────────────── */
function SessionCard({ s }) {
  const [open, setOpen] = useState(false)
  const c = STATUS_CFG[s.injury_status] || STATUS_CFG.stable

  return (
    <Card noPad>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'var(--brand-light)', border: '1px solid var(--brand-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: 'var(--brand)' }}>#{s.id}</span>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Session {s.id}</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{new Date(s.created_at).toLocaleString()}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusBadge status={s.injury_status} />
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'var(--bg-card2)', border: '1px solid var(--border)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '12px 18px' }}>
        {[
          ['Avg',   `${s.avg_angle}°`,  true],
          ['Max',   `${s.max_angle}°`,  false],
          ['Acc',   `${s.accuracy}%`,   false],
          ['Delta', `${s.angle_delta > 0 ? '+' : ''}${s.angle_delta}°`, s.angle_delta > 0],
        ].map(([l, v, hi]) => (
          <div key={l} style={{
            background: hi ? 'var(--brand-light)' : 'var(--bg-card2)',
            border: `1px solid ${hi ? 'var(--brand-border)' : 'var(--border)'}`,
            borderRadius: 10, padding: '10px 6px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'monospace', color: hi ? 'var(--brand)' : 'var(--text-primary)' }}>{v}</div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Expanded */}
      {open && (
        <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--border-light)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {s.angle_delta !== 0 && (
            <div style={{ borderRadius: 10, padding: '10px 14px', border: `1px solid ${c.color}30`, background: `${c.color}10` }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: c.color }}>{c.label}: </span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.angle_delta > 0 ? '+' : ''}{s.angle_delta}° from previous session</span>
            </div>
          )}
          {s.pdf_path
            ? <a href={`/rehab/outputs/reports/${s.pdf_path.split('/').pop()}`} download target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', background: 'var(--brand)', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download Session Report
              </a>
            : <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>No PDF report available</p>
          }
        </div>
      )}
    </Card>
  )
}

/* ── Main ─────────────────────────────────────────────────────────── */
export default function SessionHistory({ patient }) {
  const { isDark } = useTheme()
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [view,     setView]     = useState('cards')

  useEffect(() => {
    if (!patient?.rehab_patient_id) { setLoading(false); return }
    rehabApi.get(`/api/sessions/patient/${patient.rehab_patient_id}`)
      .then(r => setSessions(r.data))
      .catch(() => setError('Could not load session history.'))
      .finally(() => setLoading(false))
  }, [patient])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 10, color: 'var(--text-muted)' }}>
      <style>{`@keyframes sh-spin{to{transform:rotate(360deg)}}`}</style>
      <Spinner /> Loading session history…
    </div>
  )

  if (error) return (
    <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 12, padding: '14px 18px', fontSize: 13 }}>{error}</div>
  )

  if (!sessions.length) return (
    <Card style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-card2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
      </div>
      <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>No sessions yet</h3>
      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>Complete your first monitoring session to see history here.</p>
    </Card>
  )

  const sorted = [...sessions].reverse()
  const overallAvg  = (sessions.reduce((a, s) => a + s.avg_angle, 0) / sessions.length).toFixed(1)
  const improving   = sessions.filter(s => s.injury_status === 'improving').length
  const latestDelta = sessions[sessions.length - 1]?.angle_delta || 0

  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'
  const tickColor = isDark ? '#4b5563' : '#94a3b8'
  const cardBg    = isDark ? '#1f2937' : '#fff'
  const tooltipBg = isDark ? '#0f172a' : '#fff'
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0'

  const barData = {
    labels: sorted.map(s => `S${s.id}`),
    datasets: [
      {
        label: 'Avg Angle (°)',
        data: sorted.map(s => s.avg_angle),
        backgroundColor: sorted.map(s => `${(STATUS_CFG[s.injury_status]?.color || '#3b82f6')}25`),
        borderColor:     sorted.map(s =>   STATUS_CFG[s.injury_status]?.color || '#3b82f6'),
        borderWidth: 2, borderRadius: 6,
      },
      {
        label: `Target (${patient?.target_angle || 90}°)`,
        data: sorted.map(() => patient?.target_angle || 90),
        type: 'line', borderColor: isDark ? '#475569' : '#cbd5e1',
        borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0, fill: false,
      },
    ],
  }

  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      x: { ticks: { color: tickColor, font: { size: 11 } }, grid: { color: gridColor } },
      y: { min: 0, max: 180, ticks: { color: tickColor, stepSize: 45, font: { size: 11 } }, grid: { color: gridColor } },
    },
    plugins: {
      legend: { labels: { color: isDark ? '#94a3b8' : '#475569', font: { size: 11 }, boxWidth: 14 } },
      tooltip: {
        backgroundColor: tooltipBg, titleColor: isDark ? '#f1f5f9' : '#0f172a',
        bodyColor: isDark ? '#94a3b8' : '#475569', borderColor: tooltipBorder, borderWidth: 1,
        callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}°` },
      },
    },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes sh-spin{to{transform:rotate(360deg)}}`}</style>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'Total Sessions', value: sessions.length   },
          { label: 'Overall Avg',    value: `${overallAvg}°` },
          { label: 'Improving',      value: improving          },
          { label: 'Latest Change',  value: `${latestDelta > 0 ? '+' : ''}${latestDelta}°` },
        ].map(({ label, value }) => (
          <Card key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 6 }}>{label}</div>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card noPad>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Progress Overview</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sessions.length} sessions · average angle per session</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['cards', 'table'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: view === v ? 'var(--brand)' : 'var(--bg-card2)',
                color: view === v ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${view === v ? 'var(--brand)' : 'var(--border)'}`,
                transition: 'all 0.15s',
              }}>
                {v === 'cards' ? 'Cards' : 'Table'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ height: 240 }}>
            <Bar data={barData} options={barOpts} />
          </div>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 18, padding: '0 24px 16px', flexWrap: 'wrap' }}>
          {Object.entries(STATUS_CFG).map(([key, c]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
              {c.label}
            </div>
          ))}
        </div>
      </Card>

      {/* Cards view */}
      {view === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {sorted.map(s => <SessionCard key={s.id} s={s} />)}
        </div>
      )}

      {/* Table view */}
      {view === 'table' && (
        <Card noPad>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>All Sessions</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['#', 'Date', 'Status', 'Avg', 'Max', 'Accuracy', 'Delta', 'Report'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', background: 'var(--bg-card2)', borderBottom: '1px solid var(--border-light)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border-light)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', fontSize: 12 }}>#{s.id}</td>
                    <td style={{ padding: '11px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '11px 16px' }}><StatusBadge status={s.injury_status} /></td>
                    <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand)' }}>{s.avg_angle}°</td>
                    <td style={{ padding: '11px 16px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{s.max_angle}°</td>
                    <td style={{ padding: '11px 16px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{s.accuracy}%</td>
                    <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: s.angle_delta > 0 ? 'var(--success)' : s.angle_delta < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {s.angle_delta > 0 ? '+' : ''}{s.angle_delta}°
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      {s.pdf_path
                        ? <a href={`/rehab/outputs/reports/${s.pdf_path.split('/').pop()}`} download target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--brand)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            PDF
                          </a>
                        : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}