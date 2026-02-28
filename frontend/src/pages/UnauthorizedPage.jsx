import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_PATHS = { patient: '/patient/dashboard', doctor: '/doctor/dashboard', admin: '/admin/dashboard' }

export default function UnauthorizedPage() {
  const { user } = useAuth()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '5rem' }}>🚫</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem' }}>Access Denied</h1>
        <p style={{ color: 'var(--gray-600)', marginTop: '.5rem', maxWidth: 360, margin: '.5rem auto 0' }}>
          You don't have permission to view this page.
        </p>
        <Link
          to={user ? (ROLE_PATHS[user.role] ?? '/login') : '/login'}
          className="btn btn-primary"
          style={{ marginTop: '1.5rem' }}
        >
          ← Go to my Dashboard
        </Link>
      </div>
    </div>
  )
}