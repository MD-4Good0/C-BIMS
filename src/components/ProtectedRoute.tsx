import { Navigate } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "../supabaseClient";

type AccessState = {
  loading: boolean;
  hasSession: boolean;
  approved: boolean;
};

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<AccessState>({
    loading: true,
    hasSession: false,
    approved: false,
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

          sessionStorage.removeItem("bims_role");
          sessionStorage.removeItem("bims_full_name");

          setAccess({
            loading: false,
            hasSession: true,
            approved: false,
          });

          return;
        }

        const isApproved =
          profile?.status === "approved" && Boolean(profile?.role);

        if (isApproved) {
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
          approved: isApproved,
        });
      } catch (err) {
        console.error("ProtectedRoute access check failed:", err);

        if (!mounted) return;

        sessionStorage.removeItem("bims_role");
        sessionStorage.removeItem("bims_full_name");

        setAccess({
          loading: false,
          hasSession: false,
          approved: false,
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

  return <>{children}</>;
}