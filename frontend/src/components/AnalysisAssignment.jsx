/**
 * AnalysisAssignment.jsx
 * Doctor panel rendered when subTab === 'report_analysis' or 'exercise_assignment'.
 *
 * Place at: src/components/AnalysisAssignment.jsx
 */

import { useState, useEffect } from 'react'
import GraphPanel from './GraphPanel'
import {
  BarChart2, Dumbbell, User, Activity, TrendingUp,
  TrendingDown, Minus, Send, CheckCircle, FileText,
  Target, Plus, X, Edit3, RefreshCw,
} from 'lucide-react'
import api from '../utils/api'
import { useToast } from './ToastProvider'

/* ─── Shared atoms ─────────────────────────────────────────────────── */

function Card({ children, style = {}, noPad }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, boxShadow: 'var(--shadow-sm)',
      padding: noPad ? 0 : '1.25rem', overflow: 'hidden', ...style,
    }}>{children}</div>
  )
}

const inputStyle = {
  width: '100%', padding: '8px 10px', fontSize: 13,
  background: 'var(--bg-card2)', color: 'var(--text-primary)',
  border: '1px solid var(--border)', borderRadius: 8,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.04em',
}

function SpinIcon() {
  return (
    <>
      <style>{`@keyframes aa-spin { to { transform: rotate(360deg) } }`}</style>
      <span style={{
        display: 'inline-block', width: 13, height: 13,
        border: '2px solid currentColor', borderTopColor: 'transparent',
        borderRadius: '50%', animation: 'aa-spin 0.7s linear infinite',
      }} />
    </>
  )
}

function Empty({ icon: Icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)' }}>
      <Icon size={24} strokeWidth={1} style={{ marginBottom: 8, opacity: 0.3 }} />
      <div style={{ fontSize: 13, fontWeight: 500 }}>{text}</div>
    </div>
  )
}

function PatientPicker({ patients, loading, selectedId, onSelect }) {
  return (
    <Card>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
        Select Patient
      </div>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
          <style>{`@keyframes aa-spin { to { transform: rotate(360deg) } }`}</style>
          <RefreshCw size={13} style={{ animation: 'aa-spin 0.8s linear infinite' }} />
          Loading patients…
        </div>
      ) : patients.length === 0 ? (
        <Empty icon={User} text="No accepted patients yet" />
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {patients.map(p => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                background: selectedId === p.id ? 'var(--brand)' : 'var(--bg-card2)',
                color:      selectedId === p.id ? '#fff'       : 'var(--text-secondary)',
                border: `1px solid ${selectedId === p.id ? 'var(--brand)' : 'var(--border)'}`,
              }}
            >
              <div style={{ fontSize: 13 }}>{p.name}</div>
              {p.injuryType && (
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1 }}>{p.injuryType}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}

/* ─── Status config ─────────────────────────────────────────────────── */
const STATUS_CFG = {
  improving:       { color: '#10b981', label: 'Improving',       Icon: TrendingUp   },
  stable:          { color: '#3b82f6', label: 'Stable',          Icon: Minus        },
  needs_attention: { color: '#ef4444', label: 'Needs Attention', Icon: TrendingDown },
  first_session:   { color: '#94a3b8', label: 'First Session',   Icon: Activity     },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.stable
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
      color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}35`,
    }}>
      <cfg.Icon size={11} strokeWidth={2.5} /> {cfg.label}
    </span>
  )
}

/* ─── Doctor Insight Box ─────────────────────────────────────────────── */
function DoctorInsightBox({ session, patientId, showToast }) {
  const [note,   setNote]   = useState(session.doctor_notes || '')
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const saveNote = async () => {
    setSaving(true)
    try {
      await api.post(`/doctor/session-note/${session.id}`, {
        patient_id: patientId,
        note,
      })
      setSaved(true)
      showToast({ type: 'request_accepted', title: 'Note Saved', message: 'Your analysis note has been recorded.' })
      setTimeout(() => setSaved(false), 3000)
    } catch {
      showToast({ type: 'error', title: 'Save Failed', message: 'Could not save note. Try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ marginTop: 8 }}>
      <label style={labelStyle}>Doctor's Analysis Note</label>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Write clinical observations, recommendations, or flags for this session…"
        rows={3}
        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }}
      />
      <button
        onClick={saveNote}
        disabled={saving}
        style={{
          marginTop: 8, display: 'flex', alignItems: 'center', gap: 5,
          padding: '7px 14px',
          background: saved ? 'var(--success-bg)' : 'var(--bg-card2)',
          color:      saved ? 'var(--success)'    : 'var(--text-secondary)',
          border: `1px solid ${saved ? 'var(--success-border)' : 'var(--border)'}`,
          borderRadius: 7, fontSize: 12, fontWeight: 600,
          cursor: saving ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', opacity: saving ? 0.7 : 1, transition: 'all 0.2s',
        }}
      >
        {saved    && <><CheckCircle size={12} strokeWidth={2.5} /> Saved</>}
        {saving   && <><SpinIcon /> Saving…</>}
        {!saved && !saving && <><Edit3 size={12} strokeWidth={2} /> Save Note</>}
      </button>
    </div>
  )
}

/* ─── Exercise library ───────────────────────────────────────────────── */
const EXERCISE_PRESETS = {
  shoulder: [
    { id: 'sh1', name: 'Pendulum Swings',      sets: 3, reps: 10, duration: '30s', intensity: 'Low',    notes: 'Lean forward, let arm hang, move in small circles.' },
    { id: 'sh2', name: 'Wall Crawl',            sets: 3, reps: 12, duration: '—',   intensity: 'Low',    notes: 'Walk fingers up wall to shoulder height, then back down.' },
    { id: 'sh3', name: 'External Rotation',     sets: 3, reps: 15, duration: '—',   intensity: 'Medium', notes: 'Elbow at 90°, rotate arm outward with resistance band.' },
    { id: 'sh4', name: 'Cross-body Stretch',    sets: 3, reps: 1,  duration: '30s', intensity: 'Low',    notes: 'Pull arm across chest, hold 30 seconds each side.' },
    { id: 'sh5', name: 'Overhead Press (light)',sets: 3, reps: 10, duration: '—',   intensity: 'High',   notes: 'Use light weight. Stop if pain exceeds 4/10.' },
  ],
  elbow: [
    { id: 'el1', name: 'Wrist Curl',            sets: 3, reps: 15, duration: '—',   intensity: 'Low',    notes: 'Forearm on table, curl wrist up and down slowly.' },
    { id: 'el2', name: 'Supination/Pronation',  sets: 3, reps: 12, duration: '—',   intensity: 'Low',    notes: 'Hold a hammer, rotate forearm palm-up to palm-down.' },
    { id: 'el3', name: 'Bicep Curl (light)',     sets: 3, reps: 10, duration: '—',   intensity: 'Medium', notes: 'Light weight only. Full range of motion, controlled.' },
    { id: 'el4', name: 'Tricep Extension',       sets: 3, reps: 12, duration: '—',   intensity: 'Medium', notes: 'Overhead, bend and extend elbow slowly.' },
    { id: 'el5', name: 'Elbow Flex/Extend',      sets: 3, reps: 15, duration: '—',   intensity: 'Low',    notes: 'Passive range of motion. Gently push near end range.' },
  ],
  knee: [
    { id: 'kn1', name: 'Quad Sets',             sets: 3, reps: 15, duration: '10s', intensity: 'Low',    notes: 'Tighten quad, press knee down, hold 10 sec.' },
    { id: 'kn2', name: 'Straight Leg Raise',    sets: 3, reps: 12, duration: '—',   intensity: 'Low',    notes: 'Lift leg to 45°, hold 2 sec, lower slowly.' },
    { id: 'kn3', name: 'Mini Squat',             sets: 3, reps: 10, duration: '—',   intensity: 'Medium', notes: 'Hold chair for balance. Squat to 30° only.' },
    { id: 'kn4', name: 'Step Up',                sets: 3, reps: 10, duration: '—',   intensity: 'Medium', notes: 'Use low step. Lead with affected leg.' },
    { id: 'kn5', name: 'Hamstring Curl',         sets: 3, reps: 12, duration: '—',   intensity: 'Medium', notes: 'Prone, curl heel to glute, controlled pace.' },
  ],
  general: [
    { id: 'gn1', name: 'Deep Breathing',         sets: 1, reps: 10, duration: '5s',  intensity: 'Low',    notes: 'Promotes circulation and relaxation.' },
    { id: 'gn2', name: 'Grip Strengthener',      sets: 3, reps: 15, duration: '—',   intensity: 'Low',    notes: 'Squeeze stress ball, hold 3 sec.' },
    { id: 'gn3', name: 'Postural Exercise',      sets: 2, reps: 10, duration: '—',   intensity: 'Low',    notes: 'Chin tucks and shoulder blade squeezes.' },
  ],
}

const INTENSITY_COLORS = {
  Low:    { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)' },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
  High:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)'  },
}

/* ─── Main ───────────────────────────────────────────────────────────── */
export default function AnalysisAssignment({ subTab }) {
  const { showToast } = useToast()

  const [patients,     setPatients]     = useState([])
  const [selectedPt,   setSelectedPt]   = useState(null)
  const [sessions,     setSessions]     = useState([])
  const [loadingPts,   setLoadingPts]   = useState(true)
  const [loadingSess,  setLoadingSess]  = useState(false)

  // Exercise assignment state
  const [category,     setCategory]     = useState('shoulder')
  const [selected,     setSelected]     = useState([])
  const [customExs,    setCustomExs]    = useState([])
  const [addingCustom, setAddingCustom] = useState(false)
  const [newCustom,    setNewCustom]    = useState({
    name: '', sets: 3, reps: 10, duration: '', intensity: 'Low', notes: '',
  })
  const [doctorNote,   setDoctorNote]   = useState('')
  const [sending,      setSending]      = useState(false)
  const [sent,         setSent]         = useState(false)

  useEffect(() => {
    api.get('/doctor/accepted-patients')
      .then(r => setPatients(r.data.patients || []))
      .catch(console.error)
      .finally(() => setLoadingPts(false))
  }, [])

  useEffect(() => {
    if (!selectedPt) return
    setLoadingSess(true)
    setSessions([])
    api.get(`/doctor/patient-sessions/${selectedPt.id}`)
      .then(r => setSessions(r.data.sessions || []))
      .catch(console.error)
      .finally(() => setLoadingSess(false))
  }, [selectedPt])

  const togglePreset   = ex => setSelected(prev =>
    prev.find(e => e.id === ex.id) ? prev.filter(e => e.id !== ex.id) : [...prev, ex]
  )
  const removeSelected = id => setSelected(prev => prev.filter(e => e.id !== id))
  const removeCustom   = i  => setCustomExs(prev => prev.filter((_, idx) => idx !== i))

  const addCustom = () => {
    if (!newCustom.name.trim()) return
    setCustomExs(prev => [...prev, { ...newCustom, id: `custom_${Date.now()}` }])
    setNewCustom({ name: '', sets: 3, reps: 10, duration: '', intensity: 'Low', notes: '' })
    setAddingCustom(false)
  }

  const handleAssign = async () => {
    if (!selectedPt) {
      showToast({ type: 'error', title: 'No Patient', message: 'Select a patient first.' })
      return
    }
    const all = [...selected, ...customExs]
    if (!all.length) {
      showToast({ type: 'error', title: 'No Exercises', message: 'Add at least one exercise.' })
      return
    }
    setSending(true)
    try {
      await api.post('/doctor/assign-exercises', {
        patient_id:  selectedPt.id,
        exercises:   all,
        doctor_note: doctorNote,
      })
      setSent(true)
      showToast({
        type:    'request_accepted',
        title:   'Exercises Assigned',
        message: `${all.length} exercise(s) assigned to ${selectedPt.name}.`,
      })
      setTimeout(() => setSent(false), 4000)
    } catch (e) {
      showToast({ type: 'error', title: 'Failed', message: e.response?.data?.message || 'Could not assign.' })
    } finally {
      setSending(false)
    }
  }

  /* ══ Report Analysis ══════════════════════════════════════════════════ */
  if (subTab === 'report_analysis') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Report Analysis
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Review patient session reports, angle data and movement graphs
          </p>
        </div>

        <PatientPicker
          patients={patients} loading={loadingPts}
          selectedId={selectedPt?.id} onSelect={setSelectedPt}
        />

        {selectedPt && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Sessions for {selectedPt.name}
              </div>
              {loadingSess && (
                <>
                  <style>{`@keyframes aa-spin { to { transform: rotate(360deg) } }`}</style>
                  <RefreshCw size={12} color="var(--text-muted)" style={{ animation: 'aa-spin 0.8s linear infinite' }} />
                </>
              )}
            </div>

            {!loadingSess && sessions.length === 0 && (
              <Empty icon={FileText} text="No sessions yet. Patient needs to send a report first." />
            )}

            {sessions.map(s => {
              const cfg   = STATUS_CFG[s.injury_status] || STATUS_CFG.stable
              const delta = s.angle_delta
              return (
                <Card key={s.id}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <cfg.Icon size={16} color={cfg.color} strokeWidth={2} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                          Session #{s.id}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {new Date(s.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={s.injury_status} />
                  </div>

                  {/* Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
                    {[
                      { label: 'Avg Angle', value: `${s.avg_angle}°`,                   hi: true  },
                      { label: 'Max Angle', value: `${s.max_angle}°`,                   hi: false },
                      { label: 'Accuracy',  value: `${s.accuracy}%`,                    hi: false },
                      { label: 'Delta',     value: `${delta > 0 ? '+' : ''}${delta}°`,  hi: delta > 0 },
                    ].map(({ label, value, hi }) => (
                      <div key={label} style={{
                        background: hi ? 'var(--brand-light)' : 'var(--bg-card2)',
                        border: `1px solid ${hi ? 'var(--brand-border)' : 'var(--border)'}`,
                        borderRadius: 10, padding: '10px 8px', textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: hi ? 'var(--brand)' : 'var(--text-primary)' }}>
                          {value}
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginTop: 3 }}>
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Graphs ── */}
                  <GraphPanel
                    sessionId={s.id}
                    hasAngleGraph={!!s.graph_path}
                    hasProgressGraph={!!s.progress_path}
                  />

                  {/* Divider */}
                  <div style={{ height: 1, background: 'var(--border)', margin: '14px 0 0' }} />

                  <DoctorInsightBox session={s} patientId={selectedPt.id} showToast={showToast} />
                </Card>
              )
            })}
          </>
        )}
      </div>
    )
  }

  /* ══ Exercise Assignment ══════════════════════════════════════════════ */
  if (subTab === 'exercise_assignment') {
    const allExercises = [...selected, ...customExs]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Exercise Assignment
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Prescribe rehabilitation exercises for your patient
          </p>
        </div>

        <PatientPicker
          patients={patients} loading={loadingPts}
          selectedId={selectedPt?.id} onSelect={setSelectedPt}
        />

        {selectedPt && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

            {/* ── Left: Library + Custom ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Card>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
                  Exercise Library
                </div>

                {/* Category tabs */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                  {Object.keys(EXERCISE_PRESETS).map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)} style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
                      background: category === cat ? 'var(--brand)' : 'var(--bg-card2)',
                      color:      category === cat ? '#fff'       : 'var(--text-secondary)',
                      border: `1px solid ${category === cat ? 'var(--brand)' : 'var(--border)'}`,
                    }}>
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Exercise rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {EXERCISE_PRESETS[category].map(ex => {
                    const isAdded = !!selected.find(e => e.id === ex.id)
                    const ic = INTENSITY_COLORS[ex.intensity]
                    return (
                      <div key={ex.id} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '12px 14px', borderRadius: 10,
                        background: isAdded ? 'var(--brand-light)' : 'var(--bg-card2)',
                        border: `1px solid ${isAdded ? 'var(--brand-border)' : 'var(--border)'}`,
                        transition: 'all 0.15s',
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                              {ex.name}
                            </span>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                              color: ic.color, background: ic.bg, border: `1px solid ${ic.border}`,
                            }}>
                              {ex.intensity}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                            {ex.sets} sets × {ex.reps} reps {ex.duration !== '—' ? `· ${ex.duration}` : ''}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                            {ex.notes}
                          </div>
                        </div>
                        <button
                          onClick={() => togglePreset(ex)}
                          style={{
                            flexShrink: 0, width: 28, height: 28, borderRadius: 7,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.15s',
                            background: isAdded ? 'var(--brand)' : 'var(--bg-card)',
                            border: `1px solid ${isAdded ? 'var(--brand)' : 'var(--border)'}`,
                          }}
                        >
                          {isAdded
                            ? <CheckCircle size={13} color="#fff" strokeWidth={2.5} />
                            : <Plus size={13} color="var(--text-muted)" strokeWidth={2.5} />
                          }
                        </button>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* Custom exercise */}
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Custom Exercise
                  </div>
                  <button
                    onClick={() => setAddingCustom(v => !v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                      background: addingCustom ? 'var(--danger-bg)' : 'var(--bg-card2)',
                      color:      addingCustom ? 'var(--danger)'    : 'var(--text-secondary)',
                      border: `1px solid ${addingCustom ? 'var(--danger-border)' : 'var(--border)'}`,
                      borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {addingCustom ? <><X size={12} /> Cancel</> : <><Plus size={12} /> Add Custom</>}
                  </button>
                </div>

                {addingCustom && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={labelStyle}>Exercise Name *</label>
                        <input
                          value={newCustom.name}
                          onChange={e => setNewCustom(p => ({ ...p, name: e.target.value }))}
                          placeholder="e.g. Resistance Band Pull"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Intensity</label>
                        <select
                          value={newCustom.intensity}
                          onChange={e => setNewCustom(p => ({ ...p, intensity: e.target.value }))}
                          style={inputStyle}
                        >
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Sets</label>
                        <input type="number" min={1} value={newCustom.sets}
                          onChange={e => setNewCustom(p => ({ ...p, sets: +e.target.value }))}
                          style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Reps</label>
                        <input type="number" min={1} value={newCustom.reps}
                          onChange={e => setNewCustom(p => ({ ...p, reps: +e.target.value }))}
                          style={inputStyle} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Duration (optional)</label>
                      <input value={newCustom.duration}
                        onChange={e => setNewCustom(p => ({ ...p, duration: e.target.value }))}
                        placeholder="e.g. 30s hold" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Instructions</label>
                      <textarea value={newCustom.notes}
                        onChange={e => setNewCustom(p => ({ ...p, notes: e.target.value }))}
                        placeholder="Describe how to perform this exercise…"
                        rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
                    </div>
                    <button onClick={addCustom} style={{
                      padding: '9px 0', background: 'var(--brand)', color: '#fff',
                      border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      Add to Assignment
                    </button>
                  </div>
                )}

                {customExs.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: addingCustom ? 12 : 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                      Your Custom Exercises
                    </div>
                    {customExs.map((ex, i) => (
                      <div key={ex.id} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        padding: '10px 12px', background: 'var(--success-bg)',
                        border: '1px solid var(--success-border)', borderRadius: 10,
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                            {ex.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {ex.sets} sets × {ex.reps} reps
                          </div>
                        </div>
                        <button onClick={() => removeCustom(i)} style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--danger)', display: 'flex', padding: 2,
                        }}>
                          <X size={13} strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* ── Right: Summary + Assign ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 16 }}>
              <Card>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                  Assignment for {selectedPt.name}
                </div>

                {allExercises.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                    <Dumbbell size={24} strokeWidth={1} style={{ marginBottom: 8, opacity: 0.3 }} />
                    <div>No exercises added yet</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    {allExercises.map(ex => (
                      <div key={ex.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 12px', background: 'var(--bg-card2)',
                        border: '1px solid var(--border)', borderRadius: 9,
                      }}>
                        <Target size={12} color="var(--brand)" strokeWidth={2} style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ex.name}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {ex.sets}×{ex.reps}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (ex.id.startsWith('custom_')) removeCustom(customExs.findIndex(e => e.id === ex.id))
                            else removeSelected(ex.id)
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 2 }}
                        >
                          <X size={11} strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Doctor note */}
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Doctor's Note</label>
                  <textarea
                    value={doctorNote}
                    onChange={e => setDoctorNote(e.target.value)}
                    placeholder="Add instructions, frequency, or cautions for the patient…"
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                  />
                </div>

                {/* Assign button */}
                <button
                  onClick={handleAssign}
                  disabled={sending || allExercises.length === 0}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    width: '100%', padding: '11px 0',
                    borderRadius: 10, fontSize: 14, fontWeight: 700,
                    fontFamily: 'inherit', transition: 'all 0.2s',
                    cursor: allExercises.length === 0 || sending ? 'not-allowed' : 'pointer',
                    opacity: sending ? 0.7 : 1,
                    background: sent              ? 'var(--success)'   : allExercises.length === 0 ? 'var(--bg-card2)' : 'var(--brand)',
                    color:      sent              ? '#fff'             : allExercises.length === 0 ? 'var(--text-muted)' : '#fff',
                    border:     `1px solid ${sent ? 'var(--success)'  : allExercises.length === 0 ? 'var(--border)'    : 'var(--brand)'}`,
                  }}
                >
                  {sent    && <><CheckCircle size={15} strokeWidth={2.5} /> Assigned!</>}
                  {sending && <><SpinIcon /> Assigning…</>}
                  {!sent && !sending && (
                    <><Send size={15} strokeWidth={2} />
                      Assign {allExercises.length > 0
                        ? `${allExercises.length} Exercise${allExercises.length > 1 ? 's' : ''}`
                        : 'Exercises'}
                    </>
                  )}
                </button>
              </Card>
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}