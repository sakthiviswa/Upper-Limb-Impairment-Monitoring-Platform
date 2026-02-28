/**
 * Navbar – shows branding, current user info, and logout button.
 */

import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_COLORS = { patient: '#1e40af', doctor: '#065f46', admin: '#4c1d95' }

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span>🏥</span> HealthCare Portal
      </Link>

      <div className="navbar-right">
        {user && (
          <>
            <span className="navbar-user">
              👋 {user.name}
            </span>
            <span
              className={`badge badge-${user.role}`}
              style={{ color: ROLE_COLORS[user.role] }}
            >
              {user.role}
            </span>
            <button className="btn btn-outline" style={{ padding: '.4rem .875rem' }} onClick={logout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  )
}