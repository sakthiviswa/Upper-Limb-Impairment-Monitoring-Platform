import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

import ProtectedRoute      from './components/ProtectedRoute'
import RoleBasedRedirect   from './components/RoleBasedRedirect'

import LoginPage           from './pages/LoginPage'
import SignupPage          from './pages/SignupPage'
import PatientDashboard    from './dashboards/PatientDashboard'
import DoctorDashboard     from './dashboards/DoctorDashboard'
import AdminDashboard      from './dashboards/AdminDashboard'
import UnauthorizedPage    from './pages/UnauthorizedPage'
import ToastProvider       from './components/ToastProvider'

function RedirectToDashboard() {
  const { user } = useAuth()
  const role = user?.role || 'patient'
  const location = useLocation()
  const tab = location.pathname === '/profile' ? 'profile' : 'settings'
  return <Navigate to={`/${role}/dashboard?tab=${tab}`} replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login"        element={<LoginPage />} />
              <Route path="/signup"       element={<SignupPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/" element={<RoleBasedRedirect />} />

              <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
                <Route path="/patient/dashboard" element={<PatientDashboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
                <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']} />}>
                <Route path="/profile"  element={<RedirectToDashboard />} />
                <Route path="/settings" element={<RedirectToDashboard />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
