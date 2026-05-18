import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

type RoleRouteProps = {
  children: ReactNode;
  allowedRoles: string[];
};

export default function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { loading, userId, approved, role } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-white" />;
  }

  if (!userId) {
    return <Navigate to="/" replace />;
  }

  if (!approved) {
    return <Navigate to="/request-access" replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}