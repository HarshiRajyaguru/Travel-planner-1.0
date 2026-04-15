import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, initializing, bootError } = useAuth()
  const location = useLocation()

  if (initializing) {
    return <div style={{ minHeight: '40vh', display: 'grid', placeItems: 'center' }}>Checking session...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (bootError) {
    return <div style={{ minHeight: '40vh', display: 'grid', placeItems: 'center', padding: 24 }}>{bootError}</div>
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
