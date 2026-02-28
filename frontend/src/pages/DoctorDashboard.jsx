import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

const TYPE_STYLE = {
  'Check-up':    { color: '#04364A', bg: '#DAFFFB' },
  'Follow-up':   { color: '#176B87', bg: 'rgba(23,107,135,.12)' },
  'Consultation':{ color: '#4ab5ae', bg: 'rgba(100,204,197,.15)' },
}

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    api.get('/doctor/dashboard')
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

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #04364A 0%, #176B87 100%)',
        borderRadius: 16, padding: '1.75rem 2rem', marginBottom: '2rem',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 8px 24px rgba(4,54,74,.25)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#64CCC5' }}>
            🩺 Doctor Dashboard
          </h1>
          <p style={{ color: '#DAFFFB', marginTop: '.25rem', opacity: .85 }}>
            Welcome back, Dr. {user.name}
          </p>
        </div>
        <div style={{ fontSize: '3.5rem', opacity: .6 }}>👨‍⚕️</div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderTopColor: '#64CCC5' }}>
          <div className="stat-value">{data.today_patients}</div>
          <div className="stat-label">👥 Patients Today</div>
        </div>
        <div className="stat-card" style={{ borderTopColor: '#176B87' }}>
          <div className="stat-value">{data.pending_reviews}</div>
          <div className="stat-label">📋 Pending Reviews</div>
        </div>
        <div className="stat-card" style={{ borderTopColor: '#04364A' }}>
          <div className="stat-value" style={{ color: '#04364A' }}>{data.schedule.length}</div>
          <div className="stat-label">📅 Scheduled Sessions</div>
        </div>
      </div>

      {/* Schedule */}
      <div className="card">
        <div className="section-title">🗓️ Today's Schedule</div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Time</th><th>Patient</th><th>Type</th></tr>
            </thead>
            <tbody>
              {data.schedule.map((s, i) => {
                const style = TYPE_STYLE[s.type] ?? { color: '#176B87', bg: '#DAFFFB' }
                return (
                  <tr key={i}>
                    <td><strong style={{ color: '#04364A' }}>{s.time}</strong></td>
                    <td>{s.patient}</td>
                    <td>
                      <span style={{
                        color: style.color, background: style.bg,
                        padding: '.2rem .6rem', borderRadius: 20, fontSize: '.78rem', fontWeight: 600
                      }}>{s.type}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}