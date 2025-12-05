
import type { ReactElement } from "react"
import { Navigate } from "react-router-dom"

import { useAuth } from "@/hooks/useAuth"

export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth()

  if (loading) return <div>Carregando...</div>
  if (!user) return <Navigate to="/login" replace />

  return children
}