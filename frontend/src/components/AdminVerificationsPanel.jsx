/**
 * AdminVerificationsPanel.jsx — design-system tokens via panels.css
 */

import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import { useToast } from './ToastProvider'
import {
  RefreshCw, CheckCircle2, XCircle, User, Mail,
  BadgeCheck,
} from 'lucide-react'

function Badge({ label, variant = 'default' }) {
  const mapped = variant === 'info' ? 'brand' : variant
  return <span className={`panel-badge panel-badge--${mapped}`}>{label}</span>
}

const STATUS_META = {
  pending:       { label: 'Pending',       variant: 'warning' },
  manual_review: { label: 'Needs Review',  variant: 'warning' },
  auto_verified: { label: 'AI Verified',   variant: 'info'    },
  verified:      { label: 'Verified',      variant: 'success' },
  rejected:      { label: 'Rejected',      variant: 'danger'  },
}

const FILTERS = [
  { key: 'manual_review', label: 'Needs Review' },
  { key: 'auto_verified', label: 'AI Verified' },
  { key: 'verified',      label: 'Approved' },
  { key: 'rejected',      label: 'Rejected' },
  { key: '',              label: 'All' },
]

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
      <span style={{ color: 'var(--text-muted)', minWidth: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value ?? '—'}</span>
    </div>
  )
}

function VerificationRow({ v, onReview, expanded, onToggle, acting }) {
  const meta = STATUS_META[v.status] || STATUS_META.pending
  const canReview = v.status === 'manual_review' || v.status === 'auto_verified'
  const initials = (v.doctorName || '').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div className="panel-row">
      <div className="panel-row__main" onClick={onToggle} role="button" tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onToggle() }}>
        <div className="panel-avatar">
          {initials || <User size={14} color="var(--text-inverse)" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{v.doctorName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
            <Mail size={10} strokeWidth={2} /> {v.doctorEmail}
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', fontVariantNumeric: 'tabular-nums' }}>
          {v.overallScore != null ? `${v.overallScore}/100` : '—'}
        </div>
        <Badge label={meta.label} variant={meta.variant} />
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {expanded && (
        <div className="panel-row__detail">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <DetailRow label="ID Name (OCR)"       value={v.extractedIdName} />
            <DetailRow label="ID Number (OCR)"     value={v.extractedIdNumber} />
            <DetailRow label="Cert Name (OCR)"     value={v.extractedCertName} />
            <DetailRow label="Registration No."    value={v.extractedRegistrationNumber} />
            <DetailRow label="Issuing Authority"   value={v.extractedIssuingAuthority} />
            <DetailRow label="Face Match"          value={v.faceMatchScore != null ? `${Math.round(v.faceMatchScore * 100)}%` : '—'} />
            <DetailRow label="Name Match"          value={v.nameMatchScore != null ? `${Math.round(v.nameMatchScore * 100)}%` : '—'} />
          </div>

          {v.aiNotes && (() => {
            try {
              const parsed = JSON.parse(v.aiNotes)
              return (
                <div className="panel-note" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div><strong>Summary:</strong> {parsed.summary}</div>
                  {parsed.reasons?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {parsed.reasons.slice(0, 4).map((reason, idx) => (
                        <span key={idx} style={{ padding: '4px 8px', borderRadius: 999, background: 'var(--bg-card2)', fontSize: 12 }}>
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                  {parsed.extracted_fields && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Extracted: {Object.entries(parsed.extracted_fields).filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`).join(' • ')}
                    </div>
                  )}
                </div>
              )
            } catch {
              return <div className="panel-note">{v.aiNotes}</div>
            }
          })()}

          {canReview && (
            <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={!!acting}
                onClick={() => onReview(v.id, 'verified')}
                className="panel-btn panel-btn--success"
              >
                <CheckCircle2 size={13} strokeWidth={2.5} /> Approve
              </button>
              <button
                type="button"
                disabled={!!acting}
                onClick={() => onReview(v.id, 'manual_review')}
                className="panel-btn"
              >
                <BadgeCheck size={13} strokeWidth={2.5} /> Manual Review
              </button>
              <button
                type="button"
                disabled={!!acting}
                onClick={() => onReview(v.id, 'rejected')}
                className="panel-btn panel-btn--danger-outline"
              >
                <XCircle size={13} strokeWidth={2.5} /> Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminVerificationsPanel() {
  const { showToast } = useToast()

  const [filter,   setFilter]   = useState('manual_review')
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [acting,   setActing]   = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/admin/verifications', { params: filter ? { status: filter } : {} })
      .then(r => setItems(r.data.verifications || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  const handleReview = async (id, decision) => {
    setActing(id)
    try {
      await api.post(`/admin/verifications/${id}/review`, { decision, notes: '' })
      showToast({
        type: decision === 'verified' ? 'request_accepted' : 'request_declined',
        title: decision === 'verified' ? 'Doctor Verified' : 'Verification Rejected',
        message: decision === 'verified' ? 'The doctor has been marked as verified.' : 'The doctor has been notified.',
      })
      setItems(prev => prev.filter(v => v.id !== id))
      setExpanded(null)
    } catch (e) {
      showToast({ type: 'error', title: 'Error', message: e.response?.data?.message || 'Failed to save review.' })
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="panel-stack">
      <div className="panel-header">
        <h1 className="panel-title">Doctor Verifications</h1>
        <p className="panel-subtitle">
          Review AI-scored identity and credential submissions
        </p>
      </div>

      <div className="panel-filters">
        {FILTERS.map(f => (
          <button
            type="button"
            key={f.key || 'all'}
            onClick={() => setFilter(f.key)}
            className={`panel-btn panel-btn--pill${filter === f.key ? ' panel-btn--active' : ''}`}
          >
            {f.label}
          </button>
        ))}
        <button type="button" onClick={load} className="panel-btn panel-filters__spacer">
          <RefreshCw size={12} strokeWidth={2} /> Refresh
        </button>
      </div>

      <div className="panel-card panel-card--flush">
        {loading ? (
          <div className="panel-empty">
            <RefreshCw size={18} className="panel-empty__icon" />
            <div>Loading…</div>
          </div>
        ) : items.length === 0 ? (
          <div className="panel-empty">
            <BadgeCheck size={22} strokeWidth={1.5} className="panel-empty__icon" />
            <div>No submissions in this category</div>
          </div>
        ) : (
          items.map(v => (
            <VerificationRow
              key={v.id}
              v={v}
              expanded={expanded === v.id}
              onToggle={() => setExpanded(expanded === v.id ? null : v.id)}
              onReview={handleReview}
              acting={acting === v.id}
            />
          ))
        )}
      </div>
    </div>
  )
}
