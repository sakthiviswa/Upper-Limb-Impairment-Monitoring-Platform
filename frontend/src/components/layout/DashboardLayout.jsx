/**
 * DashboardLayout.jsx — theme-aware shell
 */
import Sidebar from './Sidebar'
import Navbar  from './Navbar'

export default function DashboardLayout({
  user, role, activeTab, onTabChange,
  children, unreadMessages = 0,
}) {
  return (
    <div style={{
      fontFamily: "'Sora', 'Segoe UI', sans-serif",
      background: 'var(--bg-app)',
      minHeight: '100vh',
      color: 'var(--text-primary)',
    }}>
      <Sidebar
        role={role}
        activeTab={activeTab}
        onTabChange={onTabChange}
        unreadMessages={unreadMessages}
      />
      <Navbar user={user} role={role} />
      <main style={{
        marginLeft: 232,
        marginTop: 56,
        minHeight: 'calc(100vh - 56px)',
        padding: '1.75rem',
      }}>
        {children}
      </main>
    </div>
  )
}