/**
 * ToastProvider — premium toast notifications
 */

import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, XCircle, Bell, Clock, AlertCircle,
  Save, MessageSquare, Dumbbell, X,
} from 'lucide-react'

const ToastCtx = createContext(null)
export const useToast = () => useContext(ToastCtx)

const TOAST_CFG = {
  request_accepted: { Icon: CheckCircle,   color: 'var(--success)', bg: 'var(--success-bg)',  border: 'var(--success-border)', title: 'Accepted'       },
  request_declined: { Icon: XCircle,       color: 'var(--danger)',  bg: 'var(--danger-bg)',   border: 'var(--danger-border)',  title: 'Declined'       },
  doctor_request:   { Icon: Bell,          color: 'var(--brand)',   bg: 'var(--brand-light)', border: 'var(--brand-border)',   title: 'New Request'    },
  session_reminder: { Icon: Clock,         color: 'var(--info)',    bg: 'var(--info-bg)',     border: 'var(--info-border)',    title: 'Reminder'       },
  session_completed:{ Icon: Dumbbell,      color: 'var(--success)', bg: 'var(--success-bg)',  border: 'var(--success-border)', title: 'Session Done'   },
  new_message:      { Icon: MessageSquare, color: 'var(--brand)',   bg: 'var(--brand-light)', border: 'var(--brand-border)',   title: 'New Message'    },
  profile_saved:    { Icon: Save,          color: 'var(--success)', bg: 'var(--success-bg)',  border: 'var(--success-border)', title: 'Saved'          },
  error:            { Icon: AlertCircle,   color: 'var(--danger)',  bg: 'var(--danger-bg)',   border: 'var(--danger-border)',  title: 'Error'          },
}

function Toast({ id, type, title, message, actions, onClose }) {
  const cfg = TOAST_CFG[type] || TOAST_CFG.doctor_request
  const { Icon } = cfg

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="ui-card"
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        padding: '14px 16px',
        borderLeft: `3px solid ${cfg.color}`,
        minWidth: 320,
        maxWidth: 380,
        pointerEvents: 'all',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          flexShrink: 0,
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: cfg.color,
        }}
      >
        <Icon size={20} strokeWidth={2} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="text-heading" style={{ fontSize: 14, marginBottom: 2 }}>
          {title || cfg.title}
        </div>
        {message && (
          <div className="text-secondary" style={{ fontSize: 13, lineHeight: 1.5 }}>
            {message}
          </div>
        )}
        {actions?.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {actions.map((a, i) => (
              <button
                key={i}
                onClick={() => { a.onClick?.(); onClose(id) }}
                className={a.variant === 'primary' ? 'ui-btn ui-btn--primary ui-btn--sm' : 'ui-btn ui-btn--secondary ui-btn--sm'}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => onClose(id)}
        className="ui-btn ui-btn--ghost ui-btn--icon"
        aria-label="Dismiss notification"
        style={{ color: 'var(--text-muted)', padding: 4 }}
      >
        <X size={16} strokeWidth={2} />
      </button>
    </motion.div>
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
      <div
        style={{
          position: 'fixed',
          top: 'calc(var(--navbar-height) + 16px)',
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence>
          {toasts.map(t => (
            <Toast key={t.id} {...t} onClose={close} />
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}
