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

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, border:'4px solid #DAFFFB', borderTopColor:'#64CCC5',
          borderRadius:'50%', animation:'spin .7s linear infinite', margin:'0 auto 1rem' }} />
        <p style={{ color:'#176B87' }}>Loading dashboard…</p>
      </div>
    </div>
  )
  if (error) return <div className="page-container"><div className="alert alert-error">{error}</div></div>

  const { stats, recent_users } = data

  const statCards = [
    { value: stats.total_users, label: '👥 Total Users',  border: '#04364A', valueColor: '#04364A' },
    { value: stats.patients,    label: '🧑‍🦱 Patients',     border: '#64CCC5', valueColor: '#176B87' },
    { value: stats.doctors,     label: '👨‍⚕️ Doctors',      border: '#176B87', valueColor: '#176B87' },
    { value: stats.admins,      label: '🛡️ Admins',       border: '#4ab5ae', valueColor: '#4ab5ae' },
  ]

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #04364A 0%, #176B87 100%)',
        borderRadius: 16, padding: '1.75rem 2rem', marginBottom: '2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 8px 24px rgba(4,54,74,.25)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#64CCC5' }}>
            🛡️ Admin Control Panel
          </h1>
          <p style={{ color: '#DAFFFB', marginTop: '.25rem', opacity: .85 }}>
            System-wide overview and user management
          </p>
        </div>
        <div style={{ fontSize: '3.5rem', opacity: .6 }}>⚙️</div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div key={i} className="stat-card" style={{ borderTopColor: s.border }}>
            <div className="stat-value" style={{ color: s.valueColor }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Users Table */}
      <div className="card">
        <div className="section-title">🕐 Recently Registered Users</div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {recent_users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600, color: '#176B87' }}>{u.id}</td>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td style={{ color: '#4a8fa0' }}>{u.email}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                  <td style={{ color: '#7bbec0', fontSize: '.8rem' }}>
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