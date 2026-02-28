/**
 * Admin Dashboard
 * Shows live DB stats + recent user list from /api/admin/dashboard
 */

import { useState, useEffect } from 'react'
import api from '../utils/api'

export default function AdminDashboard() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setData(r.data.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>Loading…</div>
  if (error)   return <div className="page-container"><div className="alert alert-error">{error}</div></div>

  const { stats, recent_users } = data

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>🛡️ Admin Control Panel</h1>
        <p style={{ color: 'var(--gray-600)', marginTop: '.25rem' }}>System-wide overview and management.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderColor: '#111827' }}>
          <div className="stat-value">{stats.total_users}</div>
          <div className="stat-label">👥 Total Users</div>
        </div>
        <div className="stat-card" style={{ borderColor: '#2563eb' }}>
          <div className="stat-value">{stats.patients}</div>
          <div className="stat-label">🧑‍🦱 Patients</div>
        </div>
        <div className="stat-card" style={{ borderColor: '#059669' }}>
          <div className="stat-value">{stats.doctors}</div>
          <div className="stat-label">👨‍⚕️ Doctors</div>
        </div>
        <div className="stat-card" style={{ borderColor: '#7c3aed' }}>
          <div className="stat-value">{stats.admins}</div>
          <div className="stat-label">🛡️ Admins</div>
        </div>
      </div>

      {/* Recent users */}
      <div className="card">
        <div className="section-title">Recently Registered Users</div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {recent_users.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td style={{ color: 'var(--gray-600)' }}>{u.email}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                  <td style={{ color: 'var(--gray-400)', fontSize: '.8rem' }}>
                    {new Date(u.created_at).toLocaleDateString()}
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