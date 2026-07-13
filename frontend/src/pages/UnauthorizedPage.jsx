import { ShieldX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui'

const ROLE_PATHS = { patient: '/patient/dashboard', doctor: '/doctor/dashboard', admin: '/admin/dashboard' }

export default function UnauthorizedPage() {
  const { user } = useAuth()

  return (
    <div className="auth-wrapper" style={{ background: 'var(--bg-app)' }}>
      <div className="ui-card" style={{ maxWidth: 480, padding: '48px 40px', textAlign: 'center' }}>
        <div
          className="ui-empty__icon"
          style={{ margin: '0 auto 24px', background: 'var(--danger-bg)', borderColor: 'var(--danger-border)', color: 'var(--danger)' }}
        >
          <ShieldX size={36} strokeWidth={1.75} />
        </div>
        <h1 className="text-section-title" style={{ marginBottom: 12 }}>Access Denied</h1>
        <p className="text-secondary" style={{ marginBottom: 32 }}>
          You don&apos;t have permission to view this page. Contact your administrator if you believe this is an error.
        </p>
        <Link to={user ? (ROLE_PATHS[user.role] ?? '/login') : '/login'}>
          <Button variant="primary">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
