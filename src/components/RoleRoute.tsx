import { Navigate } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "../supabaseClient";

type RoleRouteProps = {
  children: ReactNode;
  allowedRoles: string[];
};

export default function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [approved, setApproved] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!session?.user) {
          setHasSession(false);
          setApproved(false);
          setRole(null);
          setLoading(false);
          return;
        }

        setHasSession(true);

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, status")
          .eq("id", session.user.id)
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          console.error("RoleRoute profile check error:", error);
          setApproved(false);
          setRole(null);
          setLoading(false);
          return;
        }

        setApproved(profile?.status === "approved");
        setRole(profile?.role ?? null);
        setLoading(false);
      } catch (err) {
        console.error("RoleRoute load error:", err);
        if (!mounted) return;
        setHasSession(false);
        setApproved(false);
        setRole(null);
        setLoading(false);
      }
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;

      if (!newSession?.user) {
        setHasSession(false);
        setApproved(false);
        setRole(null);
        setLoading(false);
        return;
      }

      setHasSession(true);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", newSession.user.id)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error("RoleRoute auth change profile check error:", error);
        setApproved(false);
        setRole(null);
        setLoading(false);
        return;
      }

      setApproved(profile?.status === "approved");
      setRole(profile?.role ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        Loading...
      </div>
    );
  }

  if (!hasSession) {
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