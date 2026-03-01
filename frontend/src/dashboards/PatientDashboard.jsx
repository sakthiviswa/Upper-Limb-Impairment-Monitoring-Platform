/**
 * PatientDashboard — Redesigned UI
 * Same functionality as original (Flask + FastAPI), new professional layout.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import rehabApi from '../utils/rehabApi'
import MonitoringSession from '../rehab/MonitoringSession'
import SessionHistory    from '../rehab/SessionHistory'
import DashboardLayout from '../components/layout/DashboardLayout'
import { StatCard, SectionCard, Badge, DataTable } from '../components/ui/Cards'
import {
  CalendarDays, Pill, Heart, Play, Activity, FileText,
  Clock, AlertCircle, TrendingUp, ChevronRight, Zap,
} from 'lucide-react'

const STATUS_VARIANT = {
  Confirmed: 'success',
  Pending:   'warning',
  Cancelled: 'danger',
}

export default function PatientDashboard() {
  const { user } = useAuth()
  const [tab, setTab]           = useState('overview')
  const [dashData, setDashData] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [rehabPatient, setRP]   = useState(null)
  const [lastSession, setLast]  = useState(null)

  // ── Load Flask dashboard data ─────────────────────────────────────────────
  useEffect(() => {
    api.get('/patient/dashboard')
      .then(r => setDashData(r.data.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  // ── Load or auto-create FastAPI rehab patient profile ─────────────────────
  useEffect(() => {
    if (!user) return
    const encodedEmail = encodeURIComponent(user.email)
    rehabApi.get(`/api/patients/email/${encodedEmail}`)
      .then(r => setRP(r.data))
      .catch(async () => {
        try {
          const { data } = await rehabApi.post('/api/patients', {
            name:         user.name,
            email:        user.email,
            doctor_email: 'doctor@healthcare.dev',
            condition:    'Shoulder Rehabilitation',
            target_angle: 90,
          })
          setRP(data)
        } catch { /* silent fail */ }
      })
  }, [user])

  const patientForRehab = rehabPatient
    ? { ...user, rehab_patient_id: rehabPatient.id, target_angle: rehabPatient.target_angle }
    : null

  if (loading) return <LoadingScreen />

  return (
    <DashboardLayout user={user} role="patient" activeTab={tab} onTabChange={setTab}>

      {/* ── Overview ──────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h1 style={{ fontSize: '1.1875rem', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.015em' }}>
                Good morning, {user?.name?.split(' ')[0]}
              </h1>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.25rem 0 0', fontWeight: 400 }}>
                Here's your rehabilitation status overview
              </p>
            </div>
            {lastSession && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
                padding: '0.5rem 0.875rem', fontSize: '0.75rem', color: '#374151',
              }}>
                <Activity size={13} color="#6b7280" />
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  Last session: {lastSession.injury_status?.replace('_', ' ')}
                </span>
                <span style={{ color: '#9ca3af' }}>·</span>
                <span>{lastSession.avg_angle}° avg</span>
              </div>
            )}
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
              padding: '0.75rem 1rem', color: '#991b1b', fontSize: '0.8125rem',
            }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {dashData && (
            <>
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem' }}>
                <StatCard
                  label="Upcoming Appointments"
                  value={dashData.appointments.length}
                  icon={CalendarDays}
                />
                <StatCard
                  label="Active Prescriptions"
                  value={dashData.prescriptions}
                  icon={Pill}
                />
                <StatCard
                  label="Health Score"
                  value={dashData.health_score}
                  icon={Heart}
                />
              </div>

              {/* Two-column row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '0.875rem' }}>

                {/* Appointments table */}
                <SectionCard
                  title="Upcoming Appointments"
                  subtitle={`${dashData.appointments.length} scheduled`}
                  noPad
                >
                  <DataTable
                    columns={['Doctor', 'Date', 'Status']}
                    rows={dashData.appointments.map(a => [
                      <span style={{ fontWeight: 500, color: '#0f172a' }}>{a.doctor}</span>,
                      <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>{a.date}</span>,
                      <Badge label={a.status} variant={STATUS_VARIANT[a.status] || 'default'} />,
                    ])}
                  />
                </SectionCard>

                {/* Rehab CTA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div style={{
                    background: '#0f172a',
                    borderRadius: 10,
                    padding: '1.375rem 1.25rem',
                    color: '#fff',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Zap size={15} color="#e2e8f0" strokeWidth={1.75} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Rehabilitation
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3, marginBottom: '0.375rem' }}>
                      Start Your Therapy Session
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 1rem' }}>
                      30-second webcam session to track your elbow angle progress in real time.
                    </p>
                    <button
                      onClick={() => setTab('monitor')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: '#fff', color: '#0f172a',
                        border: 'none', borderRadius: 7,
                        padding: '0.625rem 1rem',
                        fontSize: '0.8125rem', fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit',
                        width: '100%', justifyContent: 'center',
                      }}
                    >
                      <Play size={13} fill="#0f172a" />
                      Start Monitoring
                    </button>
                  </div>

                  {/* Quick info cards */}
                  <SectionCard title="About the System" subtitle="Rehabilitation monitoring">
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {[
                        ['Webcam-based motion capture', Activity],
                        ['AI angle detection (MediaPipe)', TrendingUp],
                        ['Reports shared with your doctor', FileText],
                        ['30-sec session per exercise', Clock],
                      ].map(([text, Icon], i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.775rem', color: '#374151' }}>
                          <Icon size={13} color="#9ca3af" strokeWidth={1.75} />
                          {text}
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                </div>
              </div>

              {/* Session history preview link */}
              <button
                onClick={() => setTab('history')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: '#fff', border: '1px solid #e5e7eb',
                  borderRadius: 8, padding: '0.75rem 1rem',
                  fontSize: '0.8125rem', color: '#374151', fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit', width: '100%',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={14} color="#9ca3af" />
                  View full session history & progress analytics
                </div>
                <ChevronRight size={14} color="#9ca3af" />
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Rehab Monitor ─────────────────────────────────────────────────── */}
      {tab === 'monitor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.1875rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Rehabilitation Monitor
            </h1>
            <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
              Live webcam session · MediaPipe angle tracking
            </p>
          </div>

          {!patientForRehab ? (
            <div style={{
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
              padding: '3rem', textAlign: 'center', color: '#9ca3af',
            }}>
              <Activity size={28} strokeWidth={1} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Setting up your rehabilitation profile…</div>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#374151' }}>Camera active</span>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: 'auto' }}>
                  Target: {patientForRehab.target_angle}° · Patient ID: {patientForRehab.rehab_patient_id}
                </span>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <MonitoringSession
                  patient={patientForRehab}
                  onSessionComplete={(s) => { setLast(s); setTimeout(() => setTab('history'), 3000) }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── History ───────────────────────────────────────────────────────── */}
      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.1875rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Session History
            </h1>
            <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
              Your past rehabilitation sessions and angle progression
            </p>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
            <SessionHistory patient={patientForRehab} />
          </div>
        </div>
      )}

    </DashboardLayout>
  )
}

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#f8fafc', flexDirection: 'column', gap: '0.75rem',
    }}>
      <div style={{
        width: 36, height: 36,
        border: '3px solid #e5e7eb',
        borderTopColor: '#0f172a',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <p style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: 500 }}>Loading dashboard…</p>
    </div>
  )
}