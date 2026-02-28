import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_PATHS = { patient: '/patient/dashboard', doctor: '/doctor/dashboard', admin: '/admin/dashboard' }

export default function UnauthorizedPage() {
  const { user } = useAuth()
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #04364A, #176B87)',
      padding: '2rem'
    }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🚫</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#64CCC5' }}>Access Denied</h1>
        <p style={{ color: '#DAFFFB', marginTop: '.5rem', maxWidth: 360, margin: '.75rem auto 0', opacity: .85 }}>
          You don't have permission to view this page.
        </p>
        <Link
          to={user ? (ROLE_PATHS[user.role] ?? '/login') : '/login'}
          className="btn btn-accent"
          style={{ marginTop: '1.75rem', padding: '.75rem 1.75rem' }}
        >
          ← Back to my Dashboard
        </Link>
      </div>
    </div>
  )
}