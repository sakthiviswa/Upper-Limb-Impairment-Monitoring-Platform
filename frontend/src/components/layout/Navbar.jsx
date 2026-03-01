import { Bell, Search, ChevronDown } from 'lucide-react'

export default function Navbar({ user, role }) {
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

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

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
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
          <ChevronDown size={12} color="#9ca3af" />
        </div>
      </div>
    </header>
  )
}