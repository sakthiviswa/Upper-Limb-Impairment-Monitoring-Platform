/**
 * DashboardLayout — premium healthcare app shell
 */
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { LayoutProvider, useLayout } from '../../context/LayoutContext'
import { MotionPage } from '../ui'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

function DashboardShell({
  user, role, activeTab, onTabChange,
  children, unreadMessages = 0,
  pendingAppts = 0, unreadNotifs = 0,
}) {
  const { logout } = useAuth()
  const { collapsed } = useLayout()
  const [search, setSearch] = useState('')

  const handleNotifications = () => {
    const tab = role === 'admin' ? 'activity' : 'notifications'
    onTabChange(tab)
    window.dispatchEvent(new CustomEvent('navbar:tabchange', { detail: { tab } }))
  }

  const mainClass = ['app-main', collapsed ? 'app-main--collapsed' : ''].filter(Boolean).join(' ')

  return (
    <div className="app-shell">
      <Sidebar
        role={role}
        activeTab={activeTab}
        onTabChange={onTabChange}
        unreadMessages={unreadMessages}
        pendingAppts={pendingAppts}
        unreadNotifs={unreadNotifs}
      />
      <Navbar
        user={user}
        role={role}
        onSignOut={logout}
        unreadNotifs={unreadNotifs}
        onNotifications={handleNotifications}
        searchValue={search}
        onSearchChange={(e) => setSearch(e.target.value)}
      />
      <main className={mainClass}>
        <div className="app-main__content">
          <MotionPage key={activeTab}>
            {children}
          </MotionPage>
        </div>
      </main>
    </div>
  )
}

export default function DashboardLayout(props) {
  return (
    <LayoutProvider>
      <DashboardShell {...props} />
    </LayoutProvider>
  )
}
