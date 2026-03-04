import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Navbar              from './components/layout/Navbar'
import ProtectedRoute      from './components/ProtectedRoute'
import RoleBasedRedirect   from './components/RoleBasedRedirect'

import LoginPage           from './pages/LoginPage'
import SignupPage          from './pages/SignupPage'
import PatientDashboard    from './dashboards/PatientDashboard'
import DoctorDashboard     from './dashboards/DoctorDashboard'
import AdminDashboard      from './dashboards/AdminDashboard'
import UnauthorizedPage    from './pages/UnauthorizedPage'
import ProfileSettings     from './components/ProfileSettings'

import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes – no Navbar */}
          <Route path="/login"        element={<LoginPage />} />
          <Route path="/signup"       element={<SignupPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Root → redirect to role dashboard */}
          <Route path="/" element={<RoleBasedRedirect />} />

          {/* Protected routes – wrapped with Navbar */}
          <Route element={<WithNavbar />}>
            {/* Patient */}
            <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
              <Route path="/patient/dashboard" element={<PatientDashboard />} />
            </Route>

            {/* Doctor */}
            <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
              <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            </Route>

            {/* Admin */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>
            {/* User profile / settings (all authenticated roles) */}
            <Route element={<ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']} />}>
              <Route path="/profile" element={<ProfileSettings />} />
              <Route path="/settings" element={<ProfileSettings />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

/** Layout wrapper that renders Navbar above protected content */
function WithNavbar() {
  const { user } = useAuth()
  const role = user?.role || 'patient'

  return (
    <>
      <Navbar user={user} role={role} />
      <Outlet />
    </>
  )
}