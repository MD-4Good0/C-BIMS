// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import { useEffect, useState } from "react"

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    // Check current session once
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // Listen for login/logout events
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-white"></div>
  }

  // If no session, redirect to login
  if (!session) {
    return <Navigate to="/" replace />
  }

  // Otherwise, render the protected page
  return children
}
