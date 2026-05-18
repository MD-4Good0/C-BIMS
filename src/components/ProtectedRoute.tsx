import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, userId, approved } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-white" />;
  }

  if (!userId) {
    return <Navigate to="/" replace />;
  }

  if (!approved) {
    return <Navigate to="/request-access" replace />;
  }

  return <>{children}</>;
}