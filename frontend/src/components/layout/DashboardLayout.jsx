import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function DashboardLayout({ user, role, activeTab, onTabChange, children }) {
  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: '#f8fafc', minHeight: '100vh' }}>
      <Sidebar role={role} activeTab={activeTab} onTabChange={onTabChange} />
      <Navbar user={user} role={role} />
      <main style={{
        marginLeft: 240,
        marginTop: 56,
        minHeight: 'calc(100vh - 56px)',
        padding: '1.75rem',
      }}>
        {children}
      </main>
    </div>
  )
}