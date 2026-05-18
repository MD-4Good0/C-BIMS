import { Navigate } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "../supabaseClient";

type AccessState = {
  loading: boolean;
  hasSession: boolean;
  approved: boolean;
};

function getInitialAccess(): AccessState {
  const cachedRole = sessionStorage.getItem("bims_role");

  if (cachedRole) {
    return {
      loading: false,
      hasSession: true,
      approved: true,
    };
  }

  return {
    loading: true,
    hasSession: false,
    approved: false,
  };
}

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<AccessState>(getInitialAccess);

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
          console.error("ProtectedRoute profile check error:", error);

          const cachedRole = sessionStorage.getItem("bims_role");

          setAccess({
            loading: false,
            hasSession: true,
            approved: Boolean(cachedRole),
          });

          return;
        }

        const approved = profile?.status === "approved" && Boolean(profile?.role);

        if (approved) {
          sessionStorage.setItem("bims_role", profile.role);

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
        });
      } catch (err) {
        console.error("ProtectedRoute access check failed:", err);

        if (!mounted) return;

        const cachedRole = sessionStorage.getItem("bims_role");

        setAccess({
          loading: false,
          hasSession: Boolean(cachedRole),
          approved: Boolean(cachedRole),
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
    return <div className="min-h-screen bg-white" />;
  }

  if (!access.hasSession) {
    return <Navigate to="/" replace />;
  }

  if (!access.approved) {
    return <Navigate to="/request-access" replace />;
  }

  return <>{children}</>;
}