import { Bell, Search, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Navbar.css'

export default function Navbar({ user, role }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleProfileView = () => {
    navigate('/profile')
    setShowDropdown(false)
  }

  const handleSettings = () => {
    navigate('/settings')
    setShowDropdown(false)
  }

  return (
    <header style={{
      height: 56,
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      position: 'fixed',
      top: 0,
      left: 240,
      right: 0,
      zIndex: 30,
    }}>
      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9ca3af' }}>
        <Search size={14} strokeWidth={1.75} />
        <span style={{ fontSize: '0.8125rem' }}>Search…</span>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Notifications */}
        <button style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.375rem',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          color: '#6b7280',
        }}>
          <Bell size={16} strokeWidth={1.75} />
          <span style={{
            position: 'absolute',
            top: 2, right: 2,
            width: 6, height: 6,
            background: '#ef4444',
            borderRadius: '50%',
            border: '1.5px solid #fff',
          }} />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />

        {/* User Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <div
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
              borderRadius: 6,
              transition: 'background-color 0.2s',
              backgroundColor: showDropdown ? '#f3f4f6' : 'transparent',
            }}
          >
            <div style={{
              width: 28, height: 28,
              background: '#0f172a',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '0.025em',
            }}>
              {initials}
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>
                {role === 'doctor' ? `Dr. ${user?.name}` : user?.name}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'capitalize' }}>{role}</div>
            </div>
            <ChevronDown
              size={12}
              color="#9ca3af"
              style={{
                transition: 'transform 0.2s',
                transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </div>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '0.5rem',
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              minWidth: 180,
              zIndex: 50,
              overflow: 'hidden',
            }}>
              {/* View Profile */}
              <button
                onClick={handleProfileView}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#1f2937',
                  transition: 'background-color 0.15s',
                  borderBottom: '1px solid #f3f4f6',
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                View Profile
              </button>

              {/* Settings */}
              <button
                onClick={handleSettings}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#1f2937',
                  transition: 'background-color 0.15s',
                  borderBottom: '1px solid #f3f4f6',
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                Settings
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#dc2626',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#fee2e2'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}