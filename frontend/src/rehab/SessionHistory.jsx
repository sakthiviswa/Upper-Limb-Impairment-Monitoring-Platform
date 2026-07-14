/**
 * SessionHistory.jsx — fully theme-aware via CSS variables
 * Updated: SendReportButton integrated into each SessionCard
 * Fixed: PDF download now uses proper API endpoint instead of static path
 * Mobile-responsive: Table is fully responsive without horizontal scroll
 */

import { useState, useEffect } from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import rehabApi from '../utils/rehabApi'
import { useTheme } from '../context/ThemeContext'
import SendReportButton from '../components/SendReportButton'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const STATUS_CFG = {
  improving:       { color: '#22C55E', label: 'Improving'      },
  stable:          { color: '#2563EB', label: 'Stable'          },
  needs_attention: { color: '#EF4444', label: 'Needs Attention' },
  first_session:   { color: '#64748B', label: 'First Session'   },
}

// ── Change this if your FastAPI runs on a different port ──────────────────────
const API_BASE = 'http://localhost:8000'

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.stable
  return (
    <span className="fp-badge" style={{ 
      color: c.color, 
      background: `${c.color}15`, 
      borderColor: `${c.color}40`,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 10px',
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 600,
      border: '1px solid',
      whiteSpace: 'nowrap',
    }}>
      <span className="fp-badge__dot" style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: c.color,
        display: 'inline-block',
        flexShrink: 0,
      }} />
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
    <div
      className="fp-card"
      style={{ 
        padding: noPad ? 0 : '1.25rem', 
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        overflow: 'hidden',
        ...style 
      }}
    >
      {children}
    </div>
  )
}

/* ── Session Card ─────────────────────────────────────────────────── */
function SessionCard({ s, patient }) {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <Card noPad>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: isMobile ? '12px 14px' : '14px 18px', 
        borderBottom: '1px solid var(--border-light)',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: isMobile ? 34 : 38, 
            height: isMobile ? 34 : 38, 
            borderRadius: 10,
            background: 'var(--brand-light)', 
            border: '1px solid var(--brand-border)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flexShrink: 0,
          }}>
            <span style={{ 
              fontSize: isMobile ? 10 : 11, 
              fontWeight: 700, 
              fontFamily: 'monospace', 
              color: 'var(--brand)' 
            }}>
              #{s.id}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ 
              margin: 0, 
              fontSize: isMobile ? 12 : 13, 
              fontWeight: 600, 
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              Session {s.id}
            </p>
            <p style={{ 
              margin: '2px 0 0', 
              fontSize: isMobile ? 10 : 11, 
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {new Date(s.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8, flexShrink: 0 }}>
          <StatusBadge status={s.injury_status} />
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              width: isMobile ? 32 : 28, 
              height: isMobile ? 32 : 28, 
              borderRadius: 7,
              background: 'var(--bg-card2)', 
              border: '1px solid var(--border)',
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Metrics - responsive grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit,minmax(160px,1fr))', 
        gap: isMobile ? 6 : 8, 
        padding: isMobile ? '10px 12px' : '12px 18px',
      }}>
        {[
          ['Avg',   `${s.avg_angle}°`,                               true],
          ['Max',   `${s.max_angle}°`,                               false],
          ['Acc',   `${s.accuracy}%`,                                false],
          ['Delta', `${s.angle_delta > 0 ? '+' : ''}${s.angle_delta}°`, s.angle_delta > 0],
        ].map(([l, v, hi]) => (
          <div key={l} style={{
            background: hi ? 'var(--brand-light)' : 'var(--bg-card2)',
            border: `1px solid ${hi ? 'var(--brand-border)' : 'var(--border)'}`,
            borderRadius: 10, 
            padding: isMobile ? '8px 4px' : '10px 6px', 
            textAlign: 'center',
          }}>
            <div style={{ 
              fontSize: isMobile ? 14 : 15, 
              fontWeight: 700, 
              fontFamily: 'monospace', 
              color: hi ? 'var(--brand)' : 'var(--text-primary)' 
            }}>
              {v}
            </div>
            <div style={{ 
              fontSize: isMobile ? 8 : 9, 
              fontWeight: 700, 
              letterSpacing: '0.08em', 
              textTransform: 'uppercase', 
              color: 'var(--text-muted)', 
              marginTop: isMobile ? 2 : 3 
            }}>
              {l}
            </div>
          </div>
        ))}
      </div>

      {/* Expanded */}
      {open && (
        <div style={{
          padding: isMobile ? '0 12px 12px' : '0 18px 16px',
          borderTop: '1px solid var(--border-light)',
          paddingTop: isMobile ? 10 : 14,
          display: 'flex', 
          flexDirection: 'column', 
          gap: isMobile ? 8 : 10,
        }}>
          {s.angle_delta !== 0 && (
            <div style={{
              borderRadius: 10, 
              padding: isMobile ? '8px 12px' : '10px 14px',
              border: `1px solid ${c.color}30`, 
              background: `${c.color}10`,
            }}>
              <span style={{ fontWeight: 700, fontSize: isMobile ? 12 : 13, color: c.color }}>{c.label}: </span>
              <span style={{ fontSize: isMobile ? 12 : 13, color: 'var(--text-secondary)' }}>
                {s.angle_delta > 0 ? '+' : ''}{s.angle_delta}° from previous session
              </span>
            </div>
          )}

          {/* ── FIXED: PDF download uses /api/reports/{id}/download ── */}
          {s.pdf_path
            ? (
              <a
                href={`${API_BASE}/api/reports/${s.id}/download`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 8,
                  padding: isMobile ? '10px 0' : '10px 0', 
                  background: 'var(--bg-card2)', 
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)', 
                  borderRadius: 8,
                  fontSize: isMobile ? 12 : 13, 
                  fontWeight: 600, 
                  textDecoration: 'none',
                  width: '100%',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download PDF Report
              </a>
            )
            : (
              <p style={{ textAlign: 'center', fontSize: isMobile ? 11 : 12, color: 'var(--text-muted)', margin: 0 }}>
                No PDF report available
              </p>
            )
          }

          {/* ── Send to Doctor button ── */}
          <SendReportButton
            session={s}
            doctorEmail={patient?.doctor_email || ''}
          />
        </div>
      )}
    </Card>
  )
}

/* ── Mobile Table Row Component ── */
function MobileTableRow({ s, patient }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '12px 14px',
      borderBottom: '1px solid var(--border-light)',
      background: 'var(--bg-card)',
    }}>
      {/* Row 1: ID, Date, Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            color: 'var(--text-primary)',
            fontSize: 13,
          }}>
            #{s.id}
          </span>
          <span style={{
            color: 'var(--text-muted)',
            fontSize: 11,
          }}>
            {new Date(s.created_at).toLocaleDateString(undefined, { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric' 
            })}
          </span>
        </div>
        <StatusBadge status={s.injury_status} />
      </div>

      {/* Row 2: Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 6,
      }}>
        {[
          ['Avg', `${s.avg_angle}°`],
          ['Max', `${s.max_angle}°`],
          ['Acc', `${s.accuracy}%`],
          ['Delta', `${s.angle_delta > 0 ? '+' : ''}${s.angle_delta}°`],
        ].map(([l, v]) => (
          <div key={l} style={{
            background: 'var(--bg-card2)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '6px 4px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'monospace',
              color: 'var(--text-primary)',
            }}>
              {v}
            </div>
            <div style={{
              fontSize: 8,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginTop: 1,
            }}>
              {l}
            </div>
          </div>
        ))}
      </div>

      {/* Row 3: Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
      }}>
        {s.pdf_path ? (
          <a
            href={`${API_BASE}/api/reports/${s.id}/download`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: 'var(--brand-light)',
              border: '1px solid var(--brand-border)',
              borderRadius: 6,
              color: 'var(--brand)',
              fontSize: 11,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            PDF
          </a>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>No PDF</span>
        )}
        <SendReportButton 
          session={s} 
          doctorEmail={patient?.doctor_email || ''} 
        />
      </div>
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────────────── */
export default function SessionHistory({ patient, sessionCount, refreshKey = 0 }) {
  const { isDark } = useTheme()
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [view,     setView]     = useState('cards')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const effectiveSessionCount = typeof sessionCount === 'number' ? sessionCount : sessions.length

  useEffect(() => {
    if (!patient?.rehab_patient_id) { setLoading(false); return }
    setLoading(true)
    rehabApi.get(`/api/sessions/patient/${patient.rehab_patient_id}`)
      .then(r => setSessions(r.data))
      .catch(() => setError('Could not load session history.'))
      .finally(() => setLoading(false))
  }, [patient?.rehab_patient_id, refreshKey])

  if (loading) return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: isMobile ? '32px 0' : '48px 0', 
      gap: 10, 
      color: 'var(--text-muted)',
      flexDirection: isMobile ? 'column' : 'row',
    }}>
      <style>{`@keyframes sh-spin{to{transform:rotate(360deg)}}`}</style>
      <Spinner /> 
      <span style={{ fontSize: isMobile ? 13 : 14 }}>
        Loading session history…
      </span>
    </div>
  )

  if (error) return (
    <div style={{ 
      background: 'var(--danger-bg)', 
      border: '1px solid var(--danger-border)', 
      color: 'var(--danger)', 
      borderRadius: 12, 
      padding: isMobile ? '12px 14px' : '14px 18px', 
      fontSize: isMobile ? 12 : 13 
    }}>
      {error}
    </div>
  )

  if (!sessions.length) return (
    <Card style={{ 
      padding: isMobile ? '2.5rem 1.5rem' : '3.5rem 2rem', 
      textAlign: 'center' 
    }}>
      <div style={{ 
        width: isMobile ? 48 : 56, 
        height: isMobile ? 48 : 56, 
        borderRadius: '50%', 
        background: 'var(--bg-card2)', 
        border: '1px solid var(--border)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        margin: '0 auto 14px' 
      }}>
        <svg width={isMobile ? 20 : 24} height={isMobile ? 20 : 24} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
          <rect x="9" y="3" width="6" height="4" rx="1"/>
          <line x1="9" y1="12" x2="15" y2="12"/>
          <line x1="9" y1="16" x2="13" y2="16"/>
        </svg>
      </div>
      <h3 style={{ 
        margin: '0 0 6px', 
        fontSize: isMobile ? 15 : 16, 
        fontWeight: 600, 
        color: 'var(--text-secondary)' 
      }}>
        No sessions yet
      </h3>
      <p style={{ 
        margin: 0, 
        color: 'var(--text-muted)', 
        fontSize: isMobile ? 12 : 13 
      }}>
        Complete your first monitoring session to see history here.
      </p>
    </Card>
  )

  const sorted      = [...sessions].reverse()
  const overallAvg  = (sessions.reduce((a, s) => a + s.avg_angle, 0) / sessions.length).toFixed(1)
  const improving   = sessions.filter(s => s.injury_status === 'improving').length
  const latestDelta = sessions[sessions.length - 1]?.angle_delta || 0

  const gridColor    = isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'
  const tickColor    = isDark ? '#4b5563' : '#94a3b8'
  const tooltipBg    = isDark ? '#0f172a' : '#fff'
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0'

  const barData = {
    labels: sorted.map(s => `S${s.id}`),
    datasets: [
      {
        label: 'Avg Angle (°)',
        data: sorted.map(s => s.avg_angle),
        backgroundColor: sorted.map(s => `${(STATUS_CFG[s.injury_status]?.color || '#2563EB')}25`),
        borderColor:     sorted.map(s =>   STATUS_CFG[s.injury_status]?.color || '#2563EB'),
        borderWidth: 2, 
        borderRadius: 6,
      },
      {
        label: `Target (${patient?.target_angle || 90}°)`,
        data: sorted.map(() => patient?.target_angle || 90),
        type: 'line', 
        borderColor: isDark ? '#475569' : '#cbd5e1',
        borderWidth: 1.5, 
        borderDash: [5, 4], 
        pointRadius: 0, 
        fill: false,
      },
    ],
  }

  const barOpts = {
    responsive: true, 
    maintainAspectRatio: false,
    scales: {
      x: { 
        ticks: { 
          color: tickColor, 
          font: { size: isMobile ? 9 : 11 },
          maxTicksLimit: isMobile ? 6 : 20,
        }, 
        grid: { color: gridColor } 
      },
      y: { 
        min: 0, 
        max: 180, 
        ticks: { 
          color: tickColor, 
          stepSize: isMobile ? 30 : 45, 
          font: { size: isMobile ? 9 : 11 } 
        }, 
        grid: { color: gridColor } 
      },
    },
    plugins: {
      legend: { 
        labels: { 
          color: isDark ? '#94a3b8' : '#475569', 
          font: { size: isMobile ? 9 : 11 }, 
          boxWidth: isMobile ? 10 : 14,
        } 
      },
      tooltip: {
        backgroundColor: tooltipBg, 
        titleColor: isDark ? '#f1f5f9' : '#0f172a',
        bodyColor: isDark ? '#94a3b8' : '#475569', 
        borderColor: tooltipBorder, 
        borderWidth: 1,
        callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}°` },
      },
    },
  }

  return (
    <div className="fp-root" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: isMobile ? 14 : 20,
      width: '100%',
    }}>
      <style>{`@keyframes sh-spin{to{transform:rotate(360deg)}}`}</style>

      {/* Summary cards - responsive */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit,minmax(200px,1fr))', 
        gap: isMobile ? 10 : 14,
      }}>
        {[
          { label: 'Total Sessions', value: effectiveSessionCount },
          { label: 'Overall Avg',    value: `${overallAvg}°` },
          { label: 'Improving',      value: improving          },
          { label: 'Latest Change',  value: `${latestDelta > 0 ? '+' : ''}${latestDelta}°` },
        ].map(({ label, value }) => (
          <Card key={label} style={{ 
            textAlign: 'center',
            padding: isMobile ? '12px 8px' : '16px 12px',
          }}>
            <div style={{ 
              fontSize: isMobile ? 22 : 26, 
              fontWeight: 700, 
              fontFamily: 'monospace', 
              color: 'var(--text-primary)', 
              lineHeight: 1 
            }}>
              {value}
            </div>
            <div style={{ 
              fontSize: isMobile ? 9 : 11, 
              fontWeight: 700, 
              letterSpacing: '0.08em', 
              textTransform: 'uppercase', 
              color: 'var(--text-muted)', 
              marginTop: isMobile ? 4 : 6 
            }}>
              {label}
            </div>
          </Card>
        ))}
      </div>

      {/* Chart - responsive */}
      <Card noPad>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: isMobile ? '10px 14px' : '14px 20px', 
          borderBottom: '1px solid var(--border-light)',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <div>
            <div style={{ 
              fontSize: isMobile ? 13 : 14, 
              fontWeight: 700, 
              color: 'var(--text-primary)' 
            }}>
              Progress Overview
            </div>
            <div style={{ 
              fontSize: isMobile ? 10 : 12, 
              color: 'var(--text-muted)', 
              marginTop: 2 
            }}>
              {effectiveSessionCount} sessions · average angle per session
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['cards', 'table'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: isMobile ? '4px 10px' : '6px 14px', 
                borderRadius: 8, 
                fontSize: isMobile ? 10 : 12, 
                fontWeight: 600,
                cursor: 'pointer', 
                fontFamily: 'inherit',
                background: view === v ? 'var(--brand)' : 'var(--bg-card2)',
                color:      view === v ? '#fff'       : 'var(--text-secondary)',
                border: `1px solid ${view === v ? 'var(--brand)' : 'var(--border)'}`,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}>
                {v === 'cards' ? 'Cards' : 'Table'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: isMobile ? '12px 14px' : '20px 24px' }}>
          <div style={{ height: isMobile ? 180 : 240 }}>
            <Bar data={barData} options={barOpts} />
          </div>
        </div>
        {/* Legend */}
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? 10 : 18, 
          padding: isMobile ? '0 12px 12px' : '0 24px 16px', 
          flexWrap: 'wrap',
          justifyContent: isMobile ? 'center' : 'flex-start',
        }}>
          {Object.entries(STATUS_CFG).map(([key, c]) => (
            <div key={key} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4, 
              fontSize: isMobile ? 10 : 12, 
              color: 'var(--text-muted)',
            }}>
              <span style={{ 
                width: isMobile ? 6 : 8, 
                height: isMobile ? 6 : 8, 
                borderRadius: '50%', 
                background: c.color, 
                flexShrink: 0 
              }} />
              {c.label}
            </div>
          ))}
        </div>
      </Card>

      {/* Cards view - responsive grid */}
      {view === 'cards' && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(280px,1fr))', 
          gap: isMobile ? 12 : 14,
        }}>
          {sorted.map(s => <SessionCard key={s.id} s={s} patient={patient} />)}
        </div>
      )}

      {/* Table view - fully responsive without horizontal scroll */}
      {view === 'table' && (
        <Card noPad>
          <div style={{ 
            padding: isMobile ? '10px 14px' : '14px 20px', 
            borderBottom: '1px solid var(--border-light)' 
          }}>
            <div style={{ 
              fontSize: isMobile ? 13 : 14, 
              fontWeight: 700, 
              color: 'var(--text-primary)' 
            }}>
              All Sessions
            </div>
          </div>
          
          {/* Mobile Table View */}
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {sorted.map(s => (
                <MobileTableRow key={s.id} s={s} patient={patient} />
              ))}
            </div>
          ) : (
            /* Desktop Table View */
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                fontSize: 13,
                minWidth: 800,
              }}>
                <thead>
                  <tr>
                    {['#', 'Date', 'Status', 'Avg', 'Max', 'Acc', 'Delta', 'Report', 'Send'].map(h => (
                      <th key={h} style={{
                        padding: '10px 16px', 
                        textAlign: 'left', 
                        fontSize: 10,
                        fontWeight: 700, 
                        letterSpacing: '0.08em', 
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)', 
                        background: 'var(--bg-card2)',
                        borderBottom: '1px solid var(--border-light)', 
                        whiteSpace: 'nowrap',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(s => (
                    <tr key={s.id} style={{ 
                      borderBottom: '1px solid var(--border-light)',
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ 
                        padding: '11px 16px', 
                        fontFamily: 'monospace', 
                        fontWeight: 700, 
                        color: 'var(--text-primary)', 
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                      }}>
                        #{s.id}
                      </td>
                      <td style={{ 
                        padding: '11px 16px', 
                        color: 'var(--text-muted)', 
                        whiteSpace: 'nowrap',
                      }}>
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <StatusBadge status={s.injury_status} />
                      </td>
                      <td style={{ 
                        padding: '11px 16px', 
                        fontFamily: 'monospace', 
                        fontWeight: 700, 
                        color: 'var(--brand)',
                        whiteSpace: 'nowrap',
                      }}>
                        {s.avg_angle}°
                      </td>
                      <td style={{ 
                        padding: '11px 16px', 
                        fontFamily: 'monospace', 
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                      }}>
                        {s.max_angle}°
                      </td>
                      <td style={{ 
                        padding: '11px 16px', 
                        fontFamily: 'monospace', 
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                      }}>
                        {s.accuracy}%
                      </td>
                      <td style={{ 
                        padding: '11px 16px', 
                        fontFamily: 'monospace', 
                        fontWeight: 700, 
                        fontSize: 13, 
                        color: s.angle_delta > 0 ? 'var(--success)' : s.angle_delta < 0 ? 'var(--danger)' : 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                      }}>
                        {s.angle_delta > 0 ? '+' : ''}{s.angle_delta}°
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                        {s.pdf_path ? (
                          <a
                            href={`${API_BASE}/api/reports/${s.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: 4, 
                              color: 'var(--brand)', 
                              fontSize: 12, 
                              fontWeight: 600, 
                              textDecoration: 'none',
                              padding: '4px 10px',
                              borderRadius: 4,
                              background: 'var(--brand-light)',
                              border: '1px solid var(--brand-border)',
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                              <polyline points="7 10 12 15 17 10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            PDF
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                        <SendReportButton 
                          session={s} 
                          doctorEmail={patient?.doctor_email || ''} 
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}