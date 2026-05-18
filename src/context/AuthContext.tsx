import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
  } from "react";
  import { supabase } from "../supabaseClient";
  
  type AuthProfile = {
    id: string;
    email: string | null;
    full_name: string | null;
    role: string | null;
    status: string | null;
  };
  
  type AuthContextValue = {
    loading: boolean;
    userId: string | null;
    profile: AuthProfile | null;
    role: string | null;
    status: string | null;
    approved: boolean;
    refreshAuth: () => Promise<void>;
  };
  
  const AuthContext = createContext<AuthContextValue | null>(null);
  
  export function AuthProvider({ children }: { children: ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [profile, setProfile] = useState<AuthProfile | null>(null);
  
    async function refreshAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
  
        if (!session?.user) {
          setUserId(null);
          setProfile(null);
  
          sessionStorage.removeItem("bims_role");
          sessionStorage.removeItem("bims_full_name");
  
          return;
        }
  
        setUserId(session.user.id);
  
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email, full_name, role, status")
          .eq("id", session.user.id)
          .maybeSingle();
  
        if (error) {
          console.error("Auth profile load error:", error);
  
          setProfile(null);
          sessionStorage.removeItem("bims_role");
          sessionStorage.removeItem("bims_full_name");
  
          return;
        }
  
        setProfile(data || null);
  
        if (data?.status === "approved" && data?.role) {
          sessionStorage.setItem("bims_role", data.role);
        } else {
          sessionStorage.removeItem("bims_role");
        }
  
        if (data?.full_name) {
          sessionStorage.setItem("bims_full_name", data.full_name);
        } else {
          sessionStorage.removeItem("bims_full_name");
        }
      } catch (err) {
        console.error("Auth refresh failed:", err);
  
        setUserId(null);
        setProfile(null);
        sessionStorage.removeItem("bims_role");
        sessionStorage.removeItem("bims_full_name");
      }
    }
  
    useEffect(() => {
      let mounted = true;
  
      async function initialize() {
        setLoading(true);
        await refreshAuth();
  
        if (mounted) {
          setLoading(false);
        }
      }
  
      initialize();
  
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async () => {
        await refreshAuth();
  
        if (mounted) {
          setLoading(false);
        }
      });
  
      function handleFocus() {
        refreshAuth();
      }
  
      window.addEventListener("focus", handleFocus);
  
      return () => {
        mounted = false;
        subscription.unsubscribe();
        window.removeEventListener("focus", handleFocus);
      };
    }, []);
  
    const value = useMemo<AuthContextValue>(() => {
      const role = profile?.role ?? null;
      const status = profile?.status ?? null;
      const approved = status === "approved" && Boolean(role);
  
      return {
        loading,
        userId,
        profile,
        role,
        status,
        approved,
        refreshAuth,
      };
    }, [loading, userId, profile]);
  
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }
  
  export function useAuth() {
    const context = useContext(AuthContext);
  
    if (!context) {
      throw new Error("useAuth must be used inside AuthProvider");
    }
  
    return context;
  }