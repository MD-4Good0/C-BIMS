import { Navigate } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "../supabaseClient";

type RoleRouteProps = {
  children: ReactNode;
  allowedRoles: string[];
};

type RoleAccessState = {
  loading: boolean;
  hasSession: boolean;
  approved: boolean;
  role: string | null;
};

export default function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const [access, setAccess] = useState<RoleAccessState>({
    loading: true,
    hasSession: false,
    approved: false,
    role: null,
  });

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!session?.user) {
          sessionStorage.removeItem("bims_role");
          sessionStorage.removeItem("bims_full_name");

          setAccess({
            loading: false,
            hasSession: false,
            approved: false,
            role: null,
          });

          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, status, full_name")
          .eq("id", session.user.id)
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          console.error("RoleRoute profile check error:", error);

          sessionStorage.removeItem("bims_role");
          sessionStorage.removeItem("bims_full_name");

          setAccess({
            loading: false,
            hasSession: true,
            approved: false,
            role: null,
          });

          return;
        }

        const approved = profile?.status === "approved" && Boolean(profile?.role);
        const role = profile?.role ?? null;

        if (approved && role) {
          sessionStorage.setItem("bims_role", role);

          if (profile.full_name) {
            sessionStorage.setItem("bims_full_name", profile.full_name);
          } else {
            sessionStorage.removeItem("bims_full_name");
          }
        } else {
          sessionStorage.removeItem("bims_role");
          sessionStorage.removeItem("bims_full_name");
        }

        setAccess({
          loading: false,
          hasSession: true,
          approved,
          role,
        });
      } catch (err) {
        console.error("RoleRoute access check failed:", err);

        if (!mounted) return;

        sessionStorage.removeItem("bims_role");
        sessionStorage.removeItem("bims_full_name");

        setAccess({
          loading: false,
          hasSession: false,
          approved: false,
          role: null,
        });
      }
    }

    checkAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkAccess();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (access.loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  if (!access.hasSession) {
    return <Navigate to="/" replace />;
  }

  if (!access.approved) {
    return <Navigate to="/request-access" replace />;
  }

  if (!access.role || !allowedRoles.includes(access.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}