import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { supabaseEnabled, session, loading } = useAuth()

  if (!supabaseEnabled) return children

  if (loading) {
    return (
      <div className="app-bg flex min-h-screen items-center justify-center">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-teal-200 border-t-[var(--color-brand)]" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}
