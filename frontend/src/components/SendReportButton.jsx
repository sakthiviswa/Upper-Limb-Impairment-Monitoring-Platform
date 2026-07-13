/**
 * SendReportButton.jsx
 * Appears inside each SessionCard (expanded section) in SessionHistory.
 *
 * Usage:
 *   <SendReportButton session={s} doctorEmail={patient?.doctor_email} />
 */

import { useState } from 'react'
import { Send, CheckCircle } from 'lucide-react'
import api from '../utils/api'
import { useToast } from './ToastProvider'

export default function SendReportButton({ session, doctorEmail }) {
  const { showToast } = useToast()
  const [status, setStatus] = useState('idle') // idle | sending | sent | error

  const handleSend = async () => {
    if (status === 'sent') return
    setStatus('sending')
    try {
      await api.post('/patient/send-session-report', {
        session_id:   session.id,
        doctor_email: doctorEmail,
      })
      setStatus('sent')
      showToast({
        type:    'request_accepted',
        title:   'Report Sent',
        message: `Session #${session.id} has been sent to your doctor for review.`,
      })
    } catch (e) {
      setStatus('error')
      showToast({
        type:    'error',
        title:   'Send Failed',
        message: e.response?.data?.message || 'Could not send report. Please try again.',
      })
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const variants = {
    idle: {
      background: 'var(--brand)',
      color: '#fff',
      border: '1px solid var(--brand)',
      cursor: 'pointer',
    },
    sending: {
      background: 'var(--brand-light)',
      color: 'var(--brand)',
      border: '1px solid var(--brand-border)',
      cursor: 'not-allowed',
      opacity: 0.8,
    },
    sent: {
      background: 'var(--success-bg)',
      color: 'var(--success)',
      border: '1px solid var(--success-border)',
      cursor: 'default',
    },
    error: {
      background: 'var(--danger-bg)',
      color: 'var(--danger)',
      border: '1px solid var(--danger-border)',
      cursor: 'pointer',
    },
  }

  return (
    <button
      onClick={handleSend}
      disabled={status === 'sending' || status === 'sent'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        width: '100%', padding: '10px 0',
        borderRadius: 8, fontSize: 13, fontWeight: 600,
        fontFamily: 'inherit', transition: 'all 0.2s',
        ...variants[status],
      }}
    >
      {status === 'sending' && <SpinIcon />}
      {status === 'sent'    && <CheckCircle size={13} strokeWidth={2.5} />}
      {(status === 'idle' || status === 'error') && <Send size={13} strokeWidth={2} />}

      {status === 'idle'    && 'Send to Doctor'}
      {status === 'sending' && 'Sending…'}
      {status === 'sent'    && 'Sent to Doctor'}
      {status === 'error'   && 'Retry Send'}
    </button>
  )
}

function SpinIcon() {
  return (
    <>
      <style>{`@keyframes srb-spin { to { transform: rotate(360deg) } }`}</style>
      <span style={{
        display: 'inline-block', width: 13, height: 13,
        border: '2px solid currentColor', borderTopColor: 'transparent',
        borderRadius: '50%', animation: 'srb-spin 0.7s linear infinite',
      }} />
    </>
  )
}