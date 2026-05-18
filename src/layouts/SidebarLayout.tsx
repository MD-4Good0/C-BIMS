// src/layouts/SidebarLayout.tsx

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  Info,
  LogOut,
  User,
  Users,
  School,
  Building2,
  FileBarChart,
  ClipboardList,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "../supabaseClient";
import ProfileModal from "../components/ProfileModal";

import BIMS from "../assets/W-BIMS.png";

type SidebarLinkProps = {
  to: string;
  title: string;
  icon: LucideIcon;
};

export default function SideBarLayout({
  children,
  background = "white",
}: {
  children: React.ReactNode;
  background?: string;
}) {

  const location = useLocation();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    return sessionStorage.getItem("bims_avatar_url");
  });

  const [role, setRole] = useState<string | null>(() => {
    return sessionStorage.getItem("bims_role");
  });

  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    return sessionStorage.getItem("bims_sidebar_expanded") === "true";
  });

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showFade, setShowFade] = useState(false);

  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        sessionStorage.removeItem("bims_avatar_url");
        sessionStorage.removeItem("bims_role");
        sessionStorage.removeItem("bims_sidebar_expanded");
        setAvatarUrl(null);
        setRole(null);
        setSidebarExpanded(false);
        return;
      }

      const url =
        user?.user_metadata?.avatar_url ||
        user?.user_metadata?.picture ||
        user?.identities?.[0]?.identity_data?.avatar_url ||
        user?.identities?.[0]?.identity_data?.picture ||
        null;

      if (url) {
        sessionStorage.setItem("bims_avatar_url", url);
        setAvatarUrl(url);
      }

      const { data } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", user.id)
        .maybeSingle();

      if (data?.status === "approved" && data?.role) {
        sessionStorage.setItem("bims_role", data.role);
        setRole(data.role);
      } else {
        sessionStorage.removeItem("bims_role");
        setRole(null);
      }
    }

    loadUserData();
  }, []);

  function isActive(path: string) {
    return location.pathname === path;
  }

  function updateSidebarExpanded(value: boolean) {
    setSidebarExpanded(value);

    if (value) {
      sessionStorage.setItem("bims_sidebar_expanded", "true");
    } else {
      sessionStorage.removeItem("bims_sidebar_expanded");
    }
  }

  function renderSidebarIconLink({ to, title, icon: Icon }: SidebarLinkProps) {
    const active = isActive(to);

    return (
      <Link
        key={to}
        to={to}
        title={title}
        className={`relative block h-11 w-full overflow-hidden rounded-xl text-white transition-opacity duration-200 hover:opacity-100 ${
          active ? "opacity-100" : "opacity-75"
        }`}
      >
        <span className="absolute left-0 top-0 flex h-11 w-20 items-center justify-center">
          <Icon className="h-6 w-6 shrink-0" />
        </span>

        <span
          className={`absolute left-20 top-1/2 -translate-y-1/2 whitespace-nowrap text-sm font-medium transition-all duration-300 ease-in-out ${
            sidebarExpanded
              ? "translate-x-0 opacity-100"
              : "-translate-x-3 opacity-0"
          }`}
        >
          {title}
        </span>
      </Link>
    );
  }

  const handleLogout = async () => {
    try {
      setShowLogoutModal(false);
      setShowFade(true);

      sessionStorage.removeItem("bims_avatar_url");
      sessionStorage.removeItem("bims_full_name");
      sessionStorage.removeItem("bims_role");
      sessionStorage.removeItem("bims_sidebar_expanded");

      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
      }, 400);
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/";
    }
  };

  return (
    <div
      className="relative flex h-screen bg-cover bg-center"
      style={background ? { backgroundImage: `url(${background})` } : {}}
    >
      <div className="relative z-20 w-20 shrink-0">
        <AnimatePresence>
          {sidebarExpanded && (
            <motion.div
              className="fixed inset-0 z-10 bg-black/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>

        <aside
          onMouseEnter={() => updateSidebarExpanded(true)}
          onMouseLeave={() => updateSidebarExpanded(false)}
          className={`absolute left-0 top-0 z-20 flex h-screen flex-col justify-between overflow-hidden bg-upred/95 py-4 text-white backdrop-blur-md transition-[width] duration-300 ease-in-out ${
            sidebarExpanded ? "w-64" : "w-20"
          }`}
        >
          <div className="flex flex-col gap-5">
            <Link
              to="/dashboard"
              title="Dashboard"
              className="relative block h-12 w-full overflow-hidden rounded-xl text-white transition-opacity duration-200 hover:opacity-100"
            >
              <span className="absolute left-0 top-0 flex h-12 w-20 items-center justify-center">
                <img
                  src={BIMS}
                  alt="BIMS Logo"
                  className="w-11 shrink-0 opacity-90"
                />
              </span>

              <span
                className={`absolute left-20 top-1/2 -translate-y-1/2 whitespace-nowrap text-sm font-semibold transition-all duration-300 ease-in-out ${
                  sidebarExpanded
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-3 opacity-0"
                }`}
              >
                Dashboard
              </span>
            </Link>

            <div
              className="h-px bg-white/60 transition-all duration-300 ease-in-out"
              style={{
                width: sidebarExpanded ? "calc(100% - 1.5rem)" : "2.5rem",
                marginLeft: sidebarExpanded ? "0.75rem" : "1.25rem",
                marginRight: sidebarExpanded ? "0.75rem" : "0rem",
              }}
            />

            {role === "admin" && (
              <>
                {renderSidebarIconLink({
                  to: "/admin/users",
                  title: "Manage Users",
                  icon: Users,
                })}

                {renderSidebarIconLink({
                  to: "/admin/colleges",
                  title: "Manage Colleges",
                  icon: School,
                })}
              </>
            )}

            {(role === "admin" || role === "staff") &&
              renderSidebarIconLink({
                to: "/add-building",
                title: "Add Building",
                icon: Building2,
              })}

            {(role === "admin" || role === "chief") &&
              renderSidebarIconLink({
                to: "/reports",
                title: "Reports",
                icon: FileBarChart,
              })}

            {(role === "admin" || role === "staff" || role === "chief") &&
              renderSidebarIconLink({
                to: "/service-requests",
                title: "Service Requests",
                icon: ClipboardList,
              })}
          </div>

          <div className="flex flex-col gap-5">
            <div
              className="h-px bg-white/60 transition-all duration-300 ease-in-out"
              style={{
                width: sidebarExpanded ? "calc(100% - 1.5rem)" : "2.5rem",
                marginLeft: sidebarExpanded ? "0.75rem" : "1.25rem",
                marginRight: sidebarExpanded ? "0.75rem" : "0rem",
              }}
            />

            {renderSidebarIconLink({
              to: "/about",
              title: "About",
              icon: Info,
            })}

            <button
            type="button"
            title="Profile"
            onClick={() => setShowProfileModal(true)}
            className="relative block h-11 w-full overflow-hidden rounded-xl text-white opacity-75 transition-opacity duration-200 hover:opacity-100"
            >
              <span className="absolute left-0 top-0 flex h-11 w-20 items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    referrerPolicy="no-referrer"
                    onError={() => {
                      sessionStorage.removeItem("bims_avatar_url");
                      setAvatarUrl(null);
                    }}
                    className="block h-8 w-8 min-h-8 min-w-8 aspect-square shrink-0 rounded-full border-2 border-white/80 object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 shrink-0" />
                )}
              </span>

              <span
                className={`absolute left-20 top-1/2 -translate-y-1/2 whitespace-nowrap text-sm font-medium transition-all duration-300 ease-in-out ${
                  sidebarExpanded
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-3 opacity-0"
                }`}
              >
                Profile
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              title="Logout"
              className="relative block h-11 w-full overflow-hidden rounded-xl text-white opacity-75 transition-opacity duration-200 hover:opacity-100"
            >
              <span className="absolute left-0 top-0 flex h-11 w-20 items-center justify-center">
                <LogOut className="h-6 w-6 shrink-0" />
              </span>

              <span
                className={`absolute left-20 top-1/2 -translate-y-1/2 whitespace-nowrap text-sm font-medium transition-all duration-300 ease-in-out ${
                  sidebarExpanded
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-3 opacity-0"
                }`}
              >
                Logout
              </span>
            </button>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="ml-15 flex flex-col items-center gap-3 rounded-2xl border border-white/40 bg-white/90 px-10 py-6 shadow-xl backdrop-blur-md"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-center text-xl font-semibold text-black/90">
                Are you sure?
              </p>

              <div className="mt-2 flex gap-5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg bg-upgreen px-5 py-2 text-white/90 transition hover:scale-110"
                >
                  ✔
                </button>

                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="rounded-lg bg-upred px-5 py-2 text-white/90 transition hover:scale-110"
                >
                  ✖
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFade && (
          <motion.div
            className="fixed inset-0 z-50 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      <ProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      <main className="flex-1 overflow-y-auto bg-transparent">{children}</main>
    </div>
  );
}