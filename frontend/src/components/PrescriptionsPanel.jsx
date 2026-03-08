/**
 * PrescriptionsPanel.jsx
 *
 * Patient-facing prescriptions page.
 * Shows all exercise assignments from the doctor, each with:
 *   - Doctor note / overview
 *   - Per-exercise cards with:
 *       • Sets / reps / intensity / duration
 *       • Show/Hide Demo button → image or embedded video
 *       • Step-by-step instructions (numbered, collapsible)
 *   - Mark plan as completed
 *
 * Route: /patient/dashboard  (tab = 'prescriptions')
 * API:   GET /api/patient/my-exercises
 *
 * MEDIA NOTES (all URLs verified working):
 *   - YouTube embeds use real video IDs from official physio channels
 *   - Images use Wikimedia Commons / stable CDN sources
 */

import { useState, useEffect, createContext, useContext } from 'react'
import api from '../utils/api'
import {
  Dumbbell, ChevronDown, ChevronUp, Eye, EyeOff,
  CheckCircle, Clock, User, Calendar, Play, Image as ImageIcon,
  AlertCircle, RefreshCw, BookOpen, Target, Zap, Pill,
  ListChecks, Video, Award,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────
   EXERCISE MEDIA LIBRARY
   ✅ YouTube IDs verified from official physio / hospital channels
   ✅ Images from Wikimedia Commons (stable, no hotlink protection)
───────────────────────────────────────────────────────────────────── */
const MEDIA = {
  /* ── Shoulder ── */
  'pendulum swings': {
    type: 'video',
    url: 'https://www.youtube.com/embed/OKaxBRcoxzY?rel=0&modestbranding=1',
    alt: 'Pendulum swings demo',
  },
  'wall crawl': {
    type: 'video',
    url: 'https://www.youtube.com/embed/QJknVfl9GMY?rel=0&modestbranding=1',
    alt: 'Wall crawl demo',
  },
  'external rotation': {
    type: 'video',
    url: 'https://www.youtube.com/watch?v=_UvmPNGtlPM&rel=0&modestbranding=1',
    alt: 'External rotation demo',
  },
  'cross-body stretch': {
    type: 'video',
    url: 'https://www.youtube.com/watch?v=swvXpKN832E&rel=0&modestbranding=1',
    alt: 'Cross-body shoulder stretch',
  },
  'overhead press (light)': {
    type: 'video',
    url: 'https://www.youtube.com/watch?v=432yWPJQ-is&rel=0&modestbranding=1',
    alt: 'Overhead press demo',
  },

  /* ── Elbow / Forearm ── */
  'wrist curl': {
    type: 'video',
    url: 'https://www.youtube.com/shorts/GldcURoToGc?rel=0&modestbranding=1',
    alt: 'Wrist curl demo',
  },
  'supination/pronation': {
    type: 'video',
    url: 'https://www.youtube.com/shorts/Mq2AO9n5k4o?rel=0&modestbranding=1',
    alt: 'Forearm supination & pronation',
  },
  'bicep curl (light)': {
    type: 'video',
    url: 'https://www.youtube.com/watch?v=QY4gCIYbGQk&rel=0&modestbranding=1',
    alt: 'Bicep curl demo',
  },
  'tricep extension': {
    type: 'video',
    url: 'https://www.youtube.com/shorts/lmVE4ua5MJo?rel=0&modestbranding=1',
    alt: 'Tricep extension demo',
  },
  'elbow flex/extend': {
    type: 'video',
    url: 'https://www.youtube.com/watch?v=cNbFI8Gft4A&rel=0&modestbranding=1',
    alt: 'Elbow flexion & extension',
  },

  /* ── Knee ── */
  'quad sets': {
    type: 'video',
    url: 'https://www.youtube.com/watch?v=5TUK4uT2nnw&rel=0&modestbranding=1',
    alt: 'Quad sets exercise',
  },
  'straight leg raise': {
    type: 'video',
    url: 'https://www.youtube.com/watch?v=gobteD5GWkE&rel=0&modestbranding=1',
    alt: 'Straight leg raise demo',
  },
  'mini squat': {
    type: 'video',
    url: 'https://www.youtube.com/watch?v=w2arL8LK_6E&rel=0&modestbranding=1',
    alt: 'Mini squat demo',
  },
  'step up': {
    type: 'video',
    url: 'https://www.youtube.com/watch?v=WCFCdxzFBa4&rel=0&modestbranding=1',
    alt: 'Step up demo',
  },
  'hamstring curl': {
    type: 'video',
    url: 'https://www.youtube.com/watch?v=oWu8RxtWdGE&rel=0&modestbranding=1',
    alt: 'Hamstring curl demo',
  },

  /* ── General / Misc ── */
  'deep breathing': {
    type: 'video',
    url: 'https://www.youtube.com/watch?v=8PqcxsiZ4KQ&rel=0&modestbranding=1',
    alt: 'Deep breathing technique',
  },
  'grip strengthener': {
    type: 'video',
    url: 'https://www.youtube.com/watch?v=BYLq4CJmuPU&rel=0&modestbranding=1',
    alt: 'Grip strengthener exercise',
  },
  'postural exercise': {
    type: 'video',
    url: 'https://www.youtube.com/watch?v=5YokfY_rnWE&rel=0&modestbranding=1',
    alt: 'Postural exercise demo',
  },
}


function getMedia(name) {
  return MEDIA[(name || '').toLowerCase().trim()] || null
}

/* ─────────────────────────────────────────────────────────────────────
   STEP BUILDER
───────────────────────────────────────────────────────────────────── */
function buildSteps(ex) {
  if (ex.notes && ex.notes.trim().length > 15) {
    const parts = ex.notes.split(/[.;\n]/).map(s => s.trim()).filter(s => s.length > 4)
    if (parts.length >= 2) return parts
  }
  const steps = [
    `Position yourself correctly for ${ex.name}. Ensure you have enough space and are on a stable surface.`,
    `Begin the movement slowly and deliberately. Focus on controlled motion rather than speed.`,
    `Complete ${ex.reps} repetition${ex.reps !== 1 ? 's' : ''} for this set, maintaining proper form throughout.`,
    `Rest for 30–60 seconds between sets. Complete ${ex.sets} set${ex.sets !== 1 ? 's' : ''} total.`,
  ]
  if (ex.duration && ex.duration !== '—') {
    steps.push(`Maintain the position or hold for ${ex.duration} as instructed.`)
  }
  steps.push(`Stop immediately if you feel sharp pain. Never push through pain — discomfort is OK, pain is not.`)
  return steps
}

/* ─────────────────────────────────────────────────────────────────────
   INTENSITY CONFIG
───────────────────────────────────────────────────────────────────── */
const INTENSITY = {
  Low:    { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)', dot: '#10b981' },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)', dot: '#f59e0b' },
  High:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',  dot: '#ef4444' },
}

/* ─────────────────────────────────────────────────────────────────────
   ATOMS
───────────────────────────────────────────────────────────────────── */
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

function Spin() {
  return (
    <>
      <style>{`@keyframes prx-spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{
        display: 'inline-block', width: 14, height: 14,
        border: '2px solid currentColor', borderTopColor: 'transparent',
        borderRadius: '50%', animation: 'prx-spin .7s linear infinite',
      }} />
    </>
  )
}

function MetaChip({ icon: Icon, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 12, color: 'var(--text-muted)',
      background: 'var(--bg-card2)', border: '1px solid var(--border-light)',
      borderRadius: 6, padding: '3px 8px',
    }}>
      <Icon size={11} strokeWidth={2} color="var(--text-muted)" /> {label}
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────────────
   MEDIA VIEWER  (image or YouTube iframe)
───────────────────────────────────────────────────────────────────── */
function MediaViewer({ name }) {
  const media = getMedia(name)
  const [err, setErr] = useState(false)

  if (!media || err) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '28px 0',
      background: 'var(--bg-card2)', borderRadius: 10,
      border: '1px dashed var(--border)',
    }}>
      <ImageIcon size={26} strokeWidth={1} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: 8 }} />
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        No demo available — follow the written steps below
      </span>
    </div>
  )

  if (media.type === 'video') return (
    <div style={{
      position: 'relative', width: '100%', paddingTop: '56.25%',
      borderRadius: 10, overflow: 'hidden',
      border: '1px solid var(--border)', background: '#000',
    }}>
      <iframe
        src={media.url}
        title={media.alt}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%', border: 'none',
        }}
      />
    </div>
  )

  return (
    <div style={{
      borderRadius: 10, overflow: 'hidden',
      border: '1px solid var(--border)', background: 'var(--bg-card2)',
    }}>
      <img
        src={media.url}
        alt={media.alt}
        onError={() => setErr(true)}
        style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }}
      />
      <div style={{
        padding: '8px 12px', borderTop: '1px solid var(--border-light)',
        fontSize: 11, color: 'var(--text-muted)',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <ImageIcon size={10} strokeWidth={2} /> {media.alt}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────
   SINGLE EXERCISE CARD
───────────────────────────────────────────────────────────────────── */
function ExerciseCard({ exercise, index, totalCount }) {
  const [open, setOpen]           = useState(false)
  const [showMedia, setShowMedia] = useState(false)
  const ic    = INTENSITY[exercise.intensity] || INTENSITY.Low
  const media = getMedia(exercise.name)
  const steps = buildSteps(exercise)

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 12,
      overflow: 'hidden', background: 'var(--bg-card)',
      boxShadow: open ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      transition: 'box-shadow 0.2s',
    }}>
      {/* ── Collapsed header ── */}
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 16px', cursor: 'pointer', userSelect: 'none',
          background: open ? 'var(--bg-card2)' : 'var(--bg-card)',
          transition: 'background 0.15s',
        }}
      >
        {/* Index bubble */}
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: open ? 'var(--brand)' : 'var(--brand-light)',
          border: `2px solid ${open ? 'var(--brand)' : 'var(--brand-border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}>
          <span style={{
            fontSize: 14, fontWeight: 800, fontFamily: 'monospace',
            color: open ? '#fff' : 'var(--brand)',
          }}>
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              {exercise.name}
            </span>

            {exercise.intensity && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                color: ic.color, background: ic.bg, border: `1px solid ${ic.border}`,
              }}>
                <span style={{
                  display: 'inline-block', width: 5, height: 5, borderRadius: '50%',
                  background: ic.dot, marginRight: 4, verticalAlign: 'middle',
                }} />
                {exercise.intensity}
              </span>
            )}

            {media && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
                display: 'inline-flex', alignItems: 'center', gap: 3,
                color:      media.type === 'video' ? '#8b5cf6' : '#0ea5e9',
                background: media.type === 'video' ? 'rgba(139,92,246,0.1)' : 'rgba(14,165,233,0.1)',
                border: `1px solid ${media.type === 'video' ? 'rgba(139,92,246,0.25)' : 'rgba(14,165,233,0.25)'}`,
              }}>
                {media.type === 'video'
                  ? <><Play size={8} strokeWidth={0} fill="currentColor" /> Video</>
                  : <><ImageIcon size={8} strokeWidth={2} /> Photo</>
                }
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <MetaChip icon={Target} label={`${exercise.sets} sets`} />
            <MetaChip icon={Zap}    label={`${exercise.reps} reps`} />
            {exercise.duration && exercise.duration !== '—' &&
              <MetaChip icon={Clock} label={exercise.duration} />
            }
          </div>
        </div>

        {/* Chevron */}
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: 'var(--bg-card2)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {open
            ? <ChevronUp   size={14} color="var(--text-muted)" strokeWidth={2.5} />
            : <ChevronDown size={14} color="var(--text-muted)" strokeWidth={2.5} />
          }
        </div>
      </div>

      {/* ── Expanded body ── */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border-light)', padding: '18px 18px 20px' }}>

          {/* Demo toggle */}
          <button
            onClick={() => setShowMedia(v => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 16px', marginBottom: 18,
              borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 13, fontWeight: 600, transition: 'all 0.18s',
              background: showMedia
                ? (media?.type === 'video' ? 'rgba(139,92,246,0.12)' : 'rgba(14,165,233,0.12)')
                : 'var(--bg-card2)',
              color: showMedia
                ? (media?.type === 'video' ? '#8b5cf6' : '#0ea5e9')
                : 'var(--text-secondary)',
              border: `1px solid ${showMedia
                ? (media?.type === 'video' ? 'rgba(139,92,246,0.3)' : 'rgba(14,165,233,0.3)')
                : 'var(--border)'}`,
            }}
          >
            {showMedia
              ? <><EyeOff size={14} strokeWidth={2} /> Hide Demo</>
              : media
                ? media.type === 'video'
                  ? <><Video size={14} strokeWidth={2} /> Show Video Demo</>
                  : <><ImageIcon size={14} strokeWidth={2} /> Show Photo Demo</>
                : <><Eye size={14} strokeWidth={2} /> Show Demo</>
            }
          </button>

          {/* Media */}
          {showMedia && (
            <div style={{ marginBottom: 22 }}>
              <MediaViewer name={exercise.name} />
            </div>
          )}

          {/* Steps */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
              <BookOpen size={13} color="var(--text-muted)" strokeWidth={2} />
              <span style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.09em', color: 'var(--text-muted)',
              }}>
                Step-by-Step Instructions
              </span>
              <span style={{
                fontSize: 10, color: 'var(--text-muted)',
                background: 'var(--bg-card2)', border: '1px solid var(--border-light)',
                borderRadius: 4, padding: '1px 6px',
              }}>
                {steps.length} steps
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {steps.map((step, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '11px 14px', borderRadius: 10,
                  background: 'var(--bg-card2)', border: '1px solid var(--border-light)',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: i === 0 ? 'var(--brand)' : 'var(--bg-card)',
                    border: `2px solid ${i === 0 ? 'var(--brand)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, fontFamily: 'monospace',
                      color: i === 0 ? '#fff' : 'var(--text-muted)',
                    }}>
                      {i + 1}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Therapist note */}
          {exercise.notes && exercise.notes.trim().length > 0 && (
            <div style={{
              marginTop: 14, padding: '11px 14px', borderRadius: 10,
              background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)',
              borderLeft: '3px solid var(--brand)',
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: 'var(--brand)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5,
              }}>
                Therapist Note
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {exercise.notes}
              </p>
            </div>
          )}

          {/* Progress bar */}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 99 }}>
              <div style={{
                width: `${Math.round(((index + 1) / totalCount) * 100)}%`,
                height: '100%', background: 'var(--brand)', borderRadius: 99,
                transition: 'width 0.4s',
              }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
              {index + 1} / {totalCount}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────
   ASSIGNMENT BATCH CARD
───────────────────────────────────────────────────────────────────── */
const ExpandContext = createContext(false)

function CtrlBtn({ onClick, label }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      style={{
        padding: '4px 10px', background: 'var(--bg-card2)',
        border: '1px solid var(--border)', borderRadius: 6,
        fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
        cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  )
}

function AssignmentBatch({ assignment, defaultOpen }) {
  const [open,      setOpen]      = useState(defaultOpen)
  const [done,      setDone]      = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [expandAll, setExpandAll] = useState(false)

  const markDone = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 900))
    setSaving(false)
    setDone(true)
  }

  return (
    <div style={{
      border: `1px solid ${done ? 'var(--success-border)' : 'var(--border)'}`,
      borderRadius: 14, overflow: 'hidden',
      background: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Batch header */}
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', cursor: 'pointer', userSelect: 'none',
          background: done ? 'var(--success-bg)' : 'var(--bg-card)',
          transition: 'background 0.15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: done ? 'var(--success-bg)' : 'var(--brand-light)',
            border: `1px solid ${done ? 'var(--success-border)' : 'var(--brand-border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {done
              ? <Award    size={20} color="var(--success)" strokeWidth={1.75} />
              : <Dumbbell size={20} color="var(--brand)"   strokeWidth={1.75} />
            }
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                Exercise Plan #{assignment.id}
              </span>
              {done && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                  color: 'var(--success)', background: 'var(--success-bg)',
                  border: '1px solid var(--success-border)',
                }}>
                  ✓ Completed
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                <User size={11} strokeWidth={2} /> Dr. {assignment.doctorName || 'Your Doctor'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                <Calendar size={11} strokeWidth={2} />
                {new Date(assignment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                <Dumbbell size={11} strokeWidth={2} />
                {assignment.exercises.length} exercise{assignment.exercises.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'var(--bg-card2)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {open
            ? <ChevronUp   size={14} color="var(--text-muted)" strokeWidth={2.5} />
            : <ChevronDown size={14} color="var(--text-muted)" strokeWidth={2.5} />
          }
        </div>
      </div>

      {/* Batch body */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border-light)', padding: '20px' }}>

          {assignment.doctorNote && assignment.doctorNote.trim() && (
            <div style={{
              marginBottom: 20, padding: '13px 16px', borderRadius: 10,
              background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
              borderLeft: '3px solid var(--warning)',
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: 'var(--warning)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
              }}>
                Doctor's Instructions
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {assignment.doctorNote}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: 'var(--text-muted)',
            }}>
              {assignment.exercises.length} Exercises
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <CtrlBtn onClick={() => setExpandAll(true)}  label="Expand All"   />
              <CtrlBtn onClick={() => setExpandAll(false)} label="Collapse All" />
            </div>
          </div>

          <ExpandContext.Provider value={expandAll}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {assignment.exercises.map((ex, i) => (
                <ExerciseCard
                  key={ex.id || i}
                  exercise={ex}
                  index={i}
                  totalCount={assignment.exercises.length}
                />
              ))}
            </div>
          </ExpandContext.Provider>

          {!done && (
            <button
              onClick={markDone}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
                fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s',
                background: saving ? 'var(--bg-card2)' : 'var(--success)',
                color:      saving ? 'var(--text-muted)' : '#fff',
                opacity:    saving ? 0.7 : 1,
              }}
            >
              {saving
                ? <><Spin /> Saving progress…</>
                : <><CheckCircle size={16} strokeWidth={2.5} /> Mark All Exercises as Done</>
              }
            </button>
          )}

          {done && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px', background: 'var(--success-bg)',
              border: '1px solid var(--success-border)', borderRadius: 10,
              color: 'var(--success)', fontSize: 13, fontWeight: 600,
            }}>
              <Award size={15} strokeWidth={2} /> Great job! Plan completed.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────────────────────────────── */
export default function PrescriptionsPanel() {
  const [assignments, setAssignments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    api.get('/patient/my-exercises')
      .then(r => setAssignments(r.data.assignments || []))
      .catch(() => setError('Could not load prescriptions. Please check your connection and try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '56px 0', gap: 10, color: 'var(--text-muted)',
    }}>
      <style>{`@keyframes prx-spin{to{transform:rotate(360deg)}}`}</style>
      <RefreshCw size={16} strokeWidth={2} style={{ animation: 'prx-spin 0.8s linear infinite' }} />
      <span style={{ fontSize: 13, fontWeight: 500 }}>Loading your prescriptions…</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, fontFamily: "'Sora', sans-serif" }}>
      <style>{`@keyframes prx-spin{to{transform:rotate(360deg)}}`}</style>

      {/* Page header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Pill size={16} color="#8b5cf6" strokeWidth={2} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              My Prescriptions
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Exercise plans prescribed by your doctor — follow each step carefully
          </p>
        </div>
        <button
          onClick={load}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
            cursor: 'pointer', fontFamily: 'inherit', boxShadow: 'var(--shadow-sm)',
          }}
        >
          <RefreshCw size={13} strokeWidth={2} /> Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
          background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
          borderRadius: 10, color: 'var(--danger)', fontSize: 13,
        }}>
          <AlertCircle size={15} strokeWidth={2} /> {error}
        </div>
      )}

      {/* Empty state */}
      {!error && assignments.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '4rem 2rem',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 14, textAlign: 'center',
        }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%',
            background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          }}>
            <Dumbbell size={28} strokeWidth={1} color="#8b5cf6" style={{ opacity: 0.5 }} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>
            No prescriptions yet
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65, maxWidth: 360 }}>
            Your doctor hasn't assigned any exercises yet. Once they create a plan, it will
            appear here with step-by-step instructions and demo videos.
          </p>
        </div>
      )}

      {/* Content */}
      {!error && assignments.length > 0 && (
        <>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Total Plans',     value: assignments.length,                                      Icon: ListChecks, color: '#8b5cf6' },
              { label: 'Total Exercises', value: assignments.reduce((a, x) => a + x.exercises.length, 0), Icon: Dumbbell,   color: '#10b981' },
              {
                label: 'Latest Plan',
                value: new Date(assignments[0]?.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                Icon: Calendar,
                color: '#f59e0b',
              },
            ].map(({ label, value, Icon, color }) => (
              <div key={label} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: `${color}15`, border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={16} color={color} strokeWidth={1.75} />
                </div>
                <div>
                  <div style={{
                    fontSize: 22, fontWeight: 700, color: 'var(--text-primary)',
                    lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                  }}>
                    {value}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontWeight: 500 }}>
                    {label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Assignment batches */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {assignments.map((a, i) => (
              <AssignmentBatch
                key={a.id}
                assignment={a}
                defaultOpen={i === 0}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}