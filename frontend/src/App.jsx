/**
 * App.jsx – Root component with React Router v6 setup
 */

import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

import Navbar              from './components/Navbar'
import ProtectedRoute      from './components/ProtectedRoute'
import RoleBasedRedirect   from './components/RoleBasedRedirect'

import LoginPage           from './pages/LoginPage'
import SignupPage          from './pages/SignupPage'
import PatientDashboard    from './pages/PatientDashboard'
import DoctorDashboard     from './pages/DoctorDashboard'
import AdminDashboard      from './pages/AdminDashboard'
import UnauthorizedPage    from './pages/UnauthorizedPage'

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
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}