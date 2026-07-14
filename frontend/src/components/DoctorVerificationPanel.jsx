/**
 * DoctorVerificationPanel.jsx — design-system tokens via panels.css
 * Face Image + Government ID + Medical Certificate -> AI Verification -> Identity Confirmed
 */

import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import { useToast } from './ToastProvider'
import {
  UploadCloud, User, IdCard, FileBadge2, BadgeCheck, Clock,
  AlertCircle, CheckCircle2, XCircle, RefreshCw, Image as ImageIcon,
  Eye, ShieldCheck, FileText, Sparkles,
} from 'lucide-react'

function Badge({ label, variant = 'default' }) {
  const cls = ['panel-badge', `panel-badge--${variant === 'info' ? 'brand' : variant}`].join(' ')
  return <span className={cls}>{label}</span>
}

const STATUS_META = {
  not_submitted: { label: 'Not Submitted', variant: 'default', Icon: AlertCircle },
  pending:       { label: 'Pending',       variant: 'warning', Icon: Clock       },
  manual_review: { label: 'Under Review',  variant: 'warning', Icon: Clock       },
  auto_verified: { label: 'Verified (AI)', variant: 'success', Icon: CheckCircle2},
  verified:      { label: 'Verified',      variant: 'success', Icon: BadgeCheck  },
  rejected:      { label: 'Rejected',      variant: 'danger',  Icon: XCircle     },
}

function FileDropField({ label, description, Icon, file, onChange }) {
  return (
    <label className={`panel-drop${file ? ' panel-drop--filled' : ''}`}>
      <input
        type="file"
        accept="image/*"
        onChange={e => onChange(e.target.files?.[0] || null)}
        style={{ display: 'none' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="panel-icon-box panel-icon-box--sm panel-icon-box--brand" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <Icon size={16} strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{description}</div>
        </div>
        {file
          ? <CheckCircle2 size={16} color="var(--success)" strokeWidth={2} />
          : <UploadCloud size={16} color="var(--text-muted)" strokeWidth={2} />}
      </div>
      {file && (
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ImageIcon size={11} strokeWidth={2} /> {file.name}
        </div>
      )}
    </label>
  )
}

function ScoreRow({ label, value }) {
  if (value === null || value === undefined) return null
  const pct = Math.round(value <= 1 ? value * 100 : value)
  const color = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)'
  return (
    <div className="panel-score">
      <span className="panel-score__label">{label}</span>
      <div className="panel-score__track">
        <div className="panel-score__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="panel-score__pct">{pct}%</span>
    </div>
  )
}

export default function DoctorVerificationPanel() {
  const { showToast } = useToast()

  const [status,     setStatus]     = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [faceImage,     setFaceImage]     = useState(null)
  const [governmentId,  setGovernmentId]  = useState(null)
  const [medicalCert,   setMedicalCert]   = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const loadStatus = useCallback(() => {
    setLoading(true)
    api.get('/doctors/verification-status')
      .then(r => setStatus(r.data))
      .catch(() => setStatus({ status: 'not_submitted' }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadStatus() }, [loadStatus])

  const canSubmit = faceImage && governmentId && medicalCert && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setUploadProgress(10)
    try {
      const form = new FormData()
      form.append('face_image', faceImage)
      form.append('government_id', governmentId)
      form.append('medical_certificate', medicalCert)

      setUploadProgress(35)
      const res = await api.post('/doctors/verify-certificate', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setUploadProgress(100)
      setStatus(res.data)
      setFaceImage(null); setGovernmentId(null); setMedicalCert(null)

      const isAuto = res.data.status === 'auto_verified'
      const score = res.data.overallScore ?? 0
      showToast({
        type: isAuto ? 'request_accepted' : 'doctor_request',
        title: isAuto ? 'Verified!' : 'Submitted for Review',
        message: isAuto
          ? `Your identity was verified automatically with ${score}/100 confidence.`
          : `Your documents were submitted and are pending admin review with ${score}/100 confidence.`,
      })
    } catch (e) {
      showToast({
        type: 'error', title: 'Submission Failed',
        message: e.response?.data?.message || 'Could not submit verification documents.',
      })
    } finally {
      setSubmitting(false)
      setUploadProgress(0)
    }
  }

  if (loading) {
    return (
      <div className="panel-card panel-empty">
        <RefreshCw size={18} className="panel-empty__icon" />
        <div>Loading verification status…</div>
      </div>
    )
  }

  const meta = STATUS_META[status?.status] || STATUS_META.not_submitted
  const StatusIcon = meta.Icon
  const canResubmit = ['not_submitted', 'rejected'].includes(status?.status)
  const iconTone = meta.variant === 'success' ? 'success' : meta.variant === 'danger' ? 'danger' : meta.variant === 'default' ? 'brand' : 'warning'

  return (
    <div className="panel-stack">

      <div className="panel-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className={`panel-icon-box panel-icon-box--${iconTone}`}>
            <StatusIcon size={18} strokeWidth={2} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="panel-section-title" style={{ marginBottom: 3 }}>
              Verification Status
            </div>
            <Badge label={meta.label} variant={meta.variant} />
          </div>
          {status?.status !== 'not_submitted' && (
            <button type="button" onClick={loadStatus} className="panel-btn">
              <RefreshCw size={12} strokeWidth={2} /> Refresh
            </button>
          )}
        </div>

        {status?.status !== 'not_submitted' && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ScoreRow label="Face Match"        value={status?.faceMatchScore} />
            <ScoreRow label="Name Match"        value={status?.nameMatchScore} />
            <ScoreRow label="Document Fields"   value={status?.fieldCompletenessScore} />
            {status?.overallScore != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', width: 130, flexShrink: 0 }}>Overall Score</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand)' }}>{status.overallScore}/100</span>
              </div>
            )}
            {status?.aiNotes && (() => {
              try {
                const parsed = JSON.parse(status.aiNotes)
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="panel-note"><strong>Summary:</strong> {parsed.summary}</div>
                    {parsed.reasons?.length > 0 && (
                      <div className="panel-note panel-note--brand">
                        <strong>Verification checks:</strong>
                        <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                          {parsed.reasons.map((reason, index) => <li key={index}>{reason}</li>)}
                        </ul>
                      </div>
                    )}
                    {parsed.ocr_preview && (
                      <div className="panel-note">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <Eye size={13} strokeWidth={2} /> <strong>OCR preview</strong>
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: 'var(--text-secondary)' }}>{parsed.ocr_preview.slice(0, 900)}</div>
                      </div>
                    )}
                  </div>
                )
              } catch {
                return <div className="panel-note">{status.aiNotes}</div>
              }
            })()}
            {status?.status === 'rejected' && status?.reviewNotes && (
              <div className="panel-note panel-note--danger">
                <strong>Reviewer note:</strong> {status.reviewNotes}
              </div>
            )}
          </div>
        )}
      </div>

      {canResubmit && (
        <div className="panel-card">
          <div className="panel-section-title">
            {status?.status === 'rejected' ? 'Resubmit Documents' : 'Submit Verification Documents'}
          </div>
          <p className="panel-section-desc">
            Upload a clear selfie, a government-issued ID, and your medical certificate.
            Our AI checks that the face matches your ID and that the name on your
            documents matches your account.
          </p>

          <div className="panel-drop-grid">
            <FileDropField
              label="Face Image" description="A clear selfie" Icon={User}
              file={faceImage} onChange={setFaceImage}
            />
            <FileDropField
              label="Government ID" description="Passport, license, etc." Icon={IdCard}
              file={governmentId} onChange={setGovernmentId}
            />
            <FileDropField
              label="Medical Certificate" description="Your registration cert" Icon={FileBadge2}
              file={medicalCert} onChange={setMedicalCert}
            />
          </div>

          {submitting && (
            <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                <span><Sparkles size={12} strokeWidth={2} style={{ display: 'inline-block', marginRight: 4 }} /> Analyzing documents…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: 'var(--bg-card2)', overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--brand), var(--success))', transition: 'width 0.2s ease' }} />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="panel-btn panel-btn--primary panel-btn--block"
          >
            <UploadCloud size={14} strokeWidth={2} />
            {submitting ? 'Verifying…' : 'Submit for Verification'}
          </button>
        </div>
      )}
    </div>
  )
}
