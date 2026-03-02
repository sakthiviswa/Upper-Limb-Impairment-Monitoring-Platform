/**
 * DoctorDashboard — Redesigned UI
 * Same functionality (Flask /doctor/dashboard), new professional layout.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import DashboardLayout from '../components/layout/DashboardLayout'
import { StatCard, SectionCard, Badge, DataTable } from '../components/ui/Cards'
import {
  Users, ClipboardList, Activity, CheckCircle, MessageSquare,
  Bell, AlertCircle,
} from 'lucide-react'

const TYPE_VARIANT = {
  'Check-up':     'success',
  'Follow-up':    'info',
  'Consultation': 'purple',
}

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [tab, setTab]         = useState('overview')

  useEffect(() => {
    api.get('/doctor/dashboard')
      .then(r => setData(r.data.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen />
  if (error) return (
    <DashboardLayout user={user} role="doctor" activeTab={tab} onTabChange={setTab}>
      <ErrorBanner message={error} />
    </DashboardLayout>
  )

  return (
    <DashboardLayout user={user} role="doctor" activeTab={tab} onTabChange={setTab}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Page header */}
        <div>
          <h1 style={{ fontSize: '1.1875rem', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.015em' }}>
            Physician Overview
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem' }}>
          <StatCard label="Patients Today"      value={data.today_patients}    icon={Users}         />
          <StatCard label="Pending Reviews"     value={data.pending_reviews}   icon={ClipboardList} trend={-5} />
          <StatCard label="Scheduled Sessions"  value={data.schedule.length}   icon={Activity}      />
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '0.875rem' }}>

          {/* Today's Schedule */}
          <SectionCard
            title="Today's Schedule"
            subtitle={`${data.schedule.length} appointments`}
            noPad
          >
            <DataTable
              columns={['Time', 'Patient', 'Appointment Type']}
              rows={data.schedule.map((s, i) => [
                <span style={{ fontWeight: 600, color: '#0f172a', fontVariantNumeric: 'tabular-nums', fontSize: '0.8125rem' }}>
                  {s.time}
                </span>,
                <span style={{ fontWeight: 500, color: '#374151' }}>{s.patient}</span>,
                <Badge label={s.type} variant={TYPE_VARIANT[s.type] || 'default'} />,
              ])}
            />
          </SectionCard>

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

            {/* Pending actions */}
            <SectionCard title="Pending Actions" subtitle="Requires your review">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {[
                  { label: 'Rehab reports to review', count: data.pending_reviews, icon: ClipboardList, variant: 'warning' },
                  { label: 'Patient feedback requests', count: 2, icon: MessageSquare, variant: 'info' },
                  { label: 'Sessions to approve',      count: 1, icon: CheckCircle,   variant: 'default' },
                ].map((item, i) => {
                  const Icon = item.icon
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.625rem 0.75rem',
                      background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 7,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Icon size={13} color="#6b7280" strokeWidth={1.75} />
                        <span style={{ fontSize: '0.775rem', color: '#374151' }}>{item.label}</span>
                      </div>
                      <Badge label={String(item.count)} variant={item.variant} />
                    </div>
                  )
                })}
              </div>
            </SectionCard>

            {/* Notifications panel */}
            <SectionCard title="Notifications" subtitle="Recent alerts">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { text: 'Patient Sarah M. completed rehab session', time: '12 min ago', dot: '#10b981' },
                  { text: 'New angle detection report uploaded',       time: '1 hr ago',  dot: '#3b82f6' },
                  { text: 'Appointment request from James L.',         time: '3 hr ago',  dot: '#f59e0b' },
                ].map((n, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.625rem', paddingBottom: '0.5rem', borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ paddingTop: 5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: n.dot, flexShrink: 0 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.775rem', color: '#374151', lineHeight: 1.4 }}>{n.text}</div>
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 2 }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>

        {/* Patient monitoring summary */}
        <SectionCard
          title="Patient Monitoring Summary"
          subtitle="AI angle detection results & rehabilitation progress"
          action={
            <button style={{
              fontSize: '0.75rem', fontWeight: 600, color: '#374151',
              background: '#f9fafb', border: '1px solid #e5e7eb',
              borderRadius: 6, padding: '0.375rem 0.75rem',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              View All Reports
            </button>
          }
          noPad
        >
          <DataTable
            columns={['Patient', 'Condition', 'Last Session', 'Avg Angle', 'Progress', 'Status']}
            rows={[
              [
                <span style={{ fontWeight: 500 }}>Sarah Mitchell</span>,
                'Shoulder Rehab',
                '2 days ago',
                '78°',
                <ProgressBar value={78} max={90} />,
                <Badge label="Improving"  variant="success" />,
              ],
              [
                <span style={{ fontWeight: 500 }}>James Liu</span>,
                'Elbow Rehab',
                'Today',
                '65°',
                <ProgressBar value={65} max={90} />,
                <Badge label="On Track"   variant="info" />,
              ],
              [
                <span style={{ fontWeight: 500 }}>Maria Garcia</span>,
                'Knee Rehab',
                '5 days ago',
                '42°',
                <ProgressBar value={42} max={90} />,
                <Badge label="Needs Review" variant="warning" />,
              ],
            ]}
          />
        </SectionCard>

      </div>
    </DashboardLayout>
  )
}

function ProgressBar({ value, max }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: 4, background: '#f3f4f6', borderRadius: 2, minWidth: 60 }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 2,
          background: pct >= 80 ? '#10b981' : pct >= 60 ? '#3b82f6' : '#f59e0b',
        }} />
      </div>
      <span style={{ fontSize: '0.7rem', color: '#6b7280', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
        {pct}%
      </span>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: 500 }}>Loading dashboard…</p>
    </div>
  )
}

function ErrorBanner({ message }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.75rem 1rem', color: '#991b1b', fontSize: '0.8125rem' }}>
      <AlertCircle size={15} />
      {message}
    </div>
  )
}