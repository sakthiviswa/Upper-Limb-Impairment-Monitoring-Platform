import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
            <span className="navbar-user">👋 {user.name}</span>
            <span className={`badge badge-${user.role}`}>{user.role}</span>
            <button
              className="btn btn-accent"
              style={{ padding: '.4rem .875rem', fontSize: '.82rem' }}
              onClick={logout}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  )
}