/**
 * ToastProvider.jsx — top-right toasts, theme-aware
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  CheckCircle, XCircle, Bell, Clock, AlertCircle,
  Save, MessageSquare, Dumbbell, X,
} from 'lucide-react'

const ToastCtx = createContext(null)
export const useToast = () => useContext(ToastCtx)

const TOAST_CFG = {
  request_accepted: { Icon: CheckCircle,   color: '#10b981', bg: 'var(--success-bg)',  border: 'var(--success-border)', title: 'Accepted'       },
  request_declined: { Icon: XCircle,       color: '#ef4444', bg: 'var(--danger-bg)',   border: 'var(--danger-border)',  title: 'Declined'       },
  doctor_request:   { Icon: Bell,          color: '#3b82f6', bg: 'var(--brand-light)', border: 'var(--brand-border)',   title: 'New Request'    },
  session_reminder: { Icon: Clock,         color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', title: 'Reminder'    },
  session_completed:{ Icon: Dumbbell,      color: '#0d9488', bg: 'rgba(13,148,136,0.08)', border: 'rgba(13,148,136,0.2)', title: 'Session Done'},
  new_message:      { Icon: MessageSquare, color: '#db2777', bg: 'rgba(219,39,119,0.08)', border: 'rgba(219,39,119,0.2)', title: 'New Message' },
  profile_saved:    { Icon: Save,          color: '#10b981', bg: 'var(--success-bg)',  border: 'var(--success-border)', title: 'Saved'          },
  error:            { Icon: AlertCircle,   color: '#ef4444', bg: 'var(--danger-bg)',   border: 'var(--danger-border)',  title: 'Error'          },
}

function Toast({ id, type, title, message, actions, onClose }) {
  const cfg = TOAST_CFG[type] || TOAST_CFG.doctor_request
  const { Icon } = cfg
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // mount animation
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      padding: '12px 14px',
      background: 'var(--bg-card)',
      border: `1px solid ${cfg.border}`,
      borderLeft: `3px solid ${cfg.color}`,
      borderRadius: 12,
      boxShadow: 'var(--shadow-lg)',
      minWidth: 300, maxWidth: 360,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateX(0)' : 'translateX(24px)',
      transition: 'opacity 0.25s ease, transform 0.25s ease',
      fontFamily: "'Sora', sans-serif",
      pointerEvents: 'all',
    }}>
      {/* Icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={15} color={cfg.color} strokeWidth={2} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
          {title || cfg.title}
        </div>
        {message && (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {message}
          </div>
        )}
        {actions?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {actions.map((a, i) => (
              <button key={i} onClick={() => { a.onClick?.(); onClose(id) }} style={{
                padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                background: a.variant === 'primary' ? cfg.color : 'var(--bg-hover)',
                color: a.variant === 'primary' ? '#fff' : 'var(--text-secondary)',
              }}>
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Close */}
      <button onClick={() => onClose(id)} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-muted)', padding: 2, flexShrink: 0,
        display: 'flex', alignItems: 'center',
      }}>
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  )
}

let _id = 0

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((opts) => {
    const id = ++_id
    setToasts(p => [...p, { id, ...opts }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000)
  }, [])

  const close = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id))
  }, [])

  return (
    <ToastCtx.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed', top: 72, right: 20,
        display: 'flex', flexDirection: 'column', gap: 10,
        zIndex: 9999, pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <Toast key={t.id} {...t} onClose={close} />
        ))}
      </div>
    </ToastCtx.Provider>
  )
}