/**
 * Doctor Dashboard
 * Fetches data from /api/doctor/dashboard
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

const TYPE_COLOR = { 'Check-up': '#2563eb', 'Follow-up': '#7c3aed', Consultation: '#059669' }

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    api.get('/doctor/dashboard')
      .then(r => setData(r.data.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>Loading…</div>
  if (error)   return <div className="page-container"><div className="alert alert-error">{error}</div></div>

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>🩺 Doctor Dashboard</h1>
        <p style={{ color: 'var(--gray-600)', marginTop: '.25rem' }}>Welcome back, Dr. {user.name}.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ borderColor: '#2563eb' }}>
          <div className="stat-value">{data.today_patients}</div>
          <div className="stat-label">👥 Patients Today</div>
        </div>
        <div className="stat-card" style={{ borderColor: '#d97706' }}>
          <div className="stat-value">{data.pending_reviews}</div>
          <div className="stat-label">📋 Pending Reviews</div>
        </div>
        <div className="stat-card" style={{ borderColor: '#059669' }}>
          <div className="stat-value">{data.schedule.length}</div>
          <div className="stat-label">📅 Scheduled Sessions</div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Today's Schedule</div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Time</th><th>Patient</th><th>Type</th></tr>
            </thead>
            <tbody>
              {data.schedule.map((s, i) => (
                <tr key={i}>
                  <td><strong>{s.time}</strong></td>
                  <td>{s.patient}</td>
                  <td>
                    <span style={{ color: TYPE_COLOR[s.type] ?? 'inherit', fontWeight: 600, fontSize: '.8rem' }}>
                      {s.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}