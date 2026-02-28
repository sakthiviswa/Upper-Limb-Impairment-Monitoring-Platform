/**
 * Patient Dashboard
 * Fetches real data from /api/patient/dashboard
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

const STATUS_COLOR = { Confirmed: '#059669', Pending: '#d97706', Cancelled: '#dc2626' }

export default function PatientDashboard() {
  const { user } = useAuth()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    api.get('/patient/dashboard')
      .then(r => setData(r.data.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>Loading…</div>
  if (error)   return <div className="page-container"><div className="alert alert-error">{error}</div></div>

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>
          👋 Hello, {user.name}!
        </h1>
        <p style={{ color: 'var(--gray-600)', marginTop: '.25rem' }}>Here's your health overview for today.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderColor: '#2563eb' }}>
          <div className="stat-value">{data.appointments.length}</div>
          <div className="stat-label">📅 Upcoming Appointments</div>
        </div>
        <div className="stat-card" style={{ borderColor: '#7c3aed' }}>
          <div className="stat-value">{data.prescriptions}</div>
          <div className="stat-label">💊 Active Prescriptions</div>
        </div>
        <div className="stat-card" style={{ borderColor: '#059669' }}>
          <div className="stat-value">{data.health_score}</div>
          <div className="stat-label">❤️ Health Score</div>
        </div>
      </div>

      {/* Appointments */}
      <div className="card">
        <div className="section-title">Upcoming Appointments</div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Doctor</th><th>Date</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.appointments.map(a => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.doctor}</td>
                  <td>{a.date}</td>
                  <td>
                    <span style={{ color: STATUS_COLOR[a.status] ?? 'inherit', fontWeight: 600, fontSize: '.8rem' }}>
                      ● {a.status}
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