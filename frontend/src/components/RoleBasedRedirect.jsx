/**
 * RoleBasedRedirect
 * Used on "/" root route – bounces authenticated users straight to their dashboard.
 */

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_PATHS = {
  patient: '/patient/dashboard',
  doctor:  '/doctor/dashboard',
  admin:   '/admin/dashboard',
}

export default function RoleBasedRedirect() {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={ROLE_PATHS[user.role] ?? '/unauthorized'} replace />
}