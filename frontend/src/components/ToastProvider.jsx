/**
 * ToastProvider + useToast hook
 * Renders toast popups in the TOP-RIGHT corner.
 * Uses only Lucide React icons, no emoji icons.
 *
 * Usage:
 *   1. Wrap your app:  <ToastProvider><App /></ToastProvider>
 *   2. In any component:
 *        const { showToast } = useToast()
 *        showToast({ type: 'request_accepted', title: '...', message: '...' })
 *
 * Place at: src/components/ToastProvider.jsx
 */

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import {
  UserPlus, CheckCircle2, XCircle, Dumbbell, AlertTriangle,
  Bell, Trophy, TrendingDown, MessageSquare, CalendarCheck,
  FileBarChart2, ClipboardList, X, Save,
} from 'lucide-react'

/* ── Toast config map ─────────────────────────────────────────────── */
const TOAST_CONFIG = {
  doctor_request:      { icon: UserPlus,       color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'Patient Request' },
  request_accepted:    { icon: CheckCircle2,   color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Accepted' },
  request_declined:    { icon: XCircle,        color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Declined' },
  session_completed:   { icon: Dumbbell,       color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', label: 'Session Done' },
  session_missed:      { icon: AlertTriangle,  color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Session Missed' },
  session_reminder:    { icon: Bell,           color: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe', label: 'Reminder' },
  progress_milestone:  { icon: Trophy,         color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Milestone' },
  progress_concern:    { icon: TrendingDown,   color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Concern' },
  new_message:         { icon: MessageSquare,  color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8', label: 'Message' },
  appointment_booked:  { icon: CalendarCheck,  color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'Appointment' },
  report_ready:        { icon: FileBarChart2,  color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', label: 'Report' },
  profile_incomplete:  { icon: ClipboardList,  color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Profile' },
  profile_saved:       { icon: Save,           color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Saved' },
  error:               { icon: XCircle,        color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Error' },
}

const DEFAULT_DURATION = 5000

/* ── Context ──────────────────────────────────────────────────────── */
const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

/* ── Provider ─────────────────────────────────────────────────────── */
export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 340)
  }, [])

  const showToast = useCallback(({
    type = 'session_completed',
    title,
    message,
    duration = DEFAULT_DURATION,
    actions,
  }) => {
    const id = ++idRef.current
    setToasts(prev => [{ id, type, title, message, duration, actions, exiting: false }, ...prev])
    if (duration > 0) setTimeout(() => removeToast(id), duration)
    return id
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

/* ── Container (top-right) ────────────────────────────────────────── */
function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null
  return (
    <div style={{
      position: 'fixed',
      top: '1.25rem',
      right: '1.25rem',        /* ← TOP RIGHT */
      left: 'auto',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.625rem',
      width: 356,
      maxWidth: 'calc(100vw - 2.5rem)',
      pointerEvents: 'none',
      fontFamily: "'Sora', sans-serif",
    }}>
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  )
}

/* ── Single Toast ─────────────────────────────────────────────────── */
function Toast({ toast, onClose }) {
  const cfg = TOAST_CONFIG[toast.type] || TOAST_CONFIG.session_completed
  const Icon = cfg.icon

  return (
    <div
      style={{
        pointerEvents: 'all',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderLeft: `3.5px solid ${cfg.color}`,
        borderRadius: 10,
        padding: '0.875rem 1rem',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start',
        boxShadow: '0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
        animation: toast.exiting
          ? 'toastOut 0.32s ease forwards'
          : 'toastIn 0.36s cubic-bezier(0.34,1.56,0.64,1) both',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 34, height: 34, borderRadius: 8,
        background: '#fff',
        border: `1px solid ${cfg.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={16} color={cfg.color} strokeWidth={2} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{
              fontSize: '0.575rem', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: cfg.color,
              background: '#fff',
              border: `1px solid ${cfg.border}`,
              borderRadius: 4, padding: '0.15rem 0.4rem',
            }}>
              {cfg.label}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 2, borderRadius: 4, color: '#9ca3af',
              display: 'flex', alignItems: 'center',
              transition: 'color 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#374151'}
            onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>

        {/* Title */}
        {toast.title && (
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.2rem', lineHeight: 1.35 }}>
            {toast.title}
          </div>
        )}

        {/* Message */}
        {toast.message && (
          <div style={{ fontSize: '0.775rem', color: '#6b7280', lineHeight: 1.45, marginBottom: toast.actions ? '0.5rem' : 0 }}>
            {toast.message}
          </div>
        )}

        {/* Action buttons */}
        {toast.actions && toast.actions.length > 0 && (
          <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem' }}>
            {toast.actions.map((action, i) => (
              <button
                key={i}
                onClick={() => { action.onClick?.(); onClose() }}
                style={{
                  padding: '0.3rem 0.7rem',
                  borderRadius: 6,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  background: action.variant === 'primary' ? cfg.color : '#fff',
                  color: action.variant === 'primary' ? '#fff' : '#374151',
                  border: action.variant === 'primary' ? 'none' : `1px solid ${cfg.border}`,
                  transition: 'opacity 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {toast.duration > 0 && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          height: 2.5, background: cfg.color, opacity: 0.4,
          borderRadius: '0 0 10px 0',
          animation: `toastProgress ${toast.duration}ms linear forwards`,
        }} />
      )}

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(105%); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0);    max-height: 160px; }
          to   { opacity: 0; transform: translateX(105%); max-height: 0; padding: 0; margin: 0; }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  )
}