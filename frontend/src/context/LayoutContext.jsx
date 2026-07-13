import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const LayoutContext = createContext(null)

export function LayoutProvider({ children }) {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true'
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed))
  }, [collapsed])

  const toggleCollapsed = useCallback(() => setCollapsed(v => !v), [])
  const toggleMobile = useCallback(() => setMobileOpen(v => !v), [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <LayoutContext.Provider value={{
      collapsed,
      mobileOpen,
      toggleCollapsed,
      toggleMobile,
      closeMobile,
      setCollapsed,
    }}>
      {children}
    </LayoutContext.Provider>
  )
}

export const useLayout = () => {
  const ctx = useContext(LayoutContext)
  if (!ctx) throw new Error('useLayout must be used inside LayoutProvider')
  return ctx
}
