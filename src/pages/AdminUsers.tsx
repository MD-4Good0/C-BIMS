// src/pages/AdminUsers.tsx

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import SidebarLayout from "../layouts/SidebarLayout";
import { supabase } from "../supabaseClient";
import {
  getPendingUsers,
  getAllUsers,
  approveUser,
  rejectUser,
} from "../adminUsers";
import { useToast } from "../components/ToastProvider";

type UserRole = "staff" | "chief";
type UserView = "pending" | "approved" | "rejected";

export default function AdminUsers() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [accessChecked, setAccessChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<UserView>("pending");

  const [roleSelections, setRoleSelections] = useState<Record<string, UserRole>>(
    {}
  );

  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUserId(user?.id ?? null);

      if (!user) {
        setIsAdmin(false);
        setAccessChecked(true);
        return;
      }

      const { data: myProfile, error: profileError } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error(profileError);
        showToast("Failed to check admin access", "error");
        setIsAdmin(false);
        setAccessChecked(true);
        return;
      }

      const adminAllowed =
        myProfile?.role === "admin" && myProfile?.status === "approved";

      setIsAdmin(adminAllowed);
      setAccessChecked(true);

      if (!adminAllowed) {
        setLoading(false);
        return;
      }

      await loadUsers();
    } catch (err) {
      console.error(err);
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    try {
      const [pending, all] = await Promise.all([
        getPendingUsers(),
        getAllUsers(),
      ]);

      const merged = all || pending || [];
      setAllUsers(merged);

      setRoleSelections((prev) => {
        const next = { ...prev };

        (merged || []).forEach((user) => {
          if (!next[user.id]) {
            next[user.id] = user.role === "chief" ? "chief" : "staff";
          }
        });

        return next;
      });
    } catch (err) {
      console.error(err);
      showToast("Failed to load users", "error");
    }
  }

  function getRoleLabel(role: string | null | undefined) {
    if (role === "staff") return "Staff";
    if (role === "chief") return "Chief";
    if (role === "admin") return "Admin";
    return "None";
  }

  function getStatusClass(status: string) {
    if (status === "approved") {
      return "bg-upgreen/10 text-upgreen border-upgreen/20";
    }

    if (status === "rejected") {
      return "bg-upred/10 text-upred border-upred/20";
    }

    return "bg-upyellow/20 text-black border-upyellow/30";
  }

  function handleRoleSelection(id: string, role: UserRole) {
    setRoleSelections((prev) => ({
      ...prev,
      [id]: role,
    }));
  }

  function requestApprove(user: any) {
    if (user.id === currentUserId) {
      showToast("You cannot change your own account from this page.", "warning");
      return;
    }

    const selectedRole = roleSelections[user.id] || "staff";

    setConfirmModal({
      title: user.status === "rejected" ? "Approve rejected user?" : "Approve user?",
      message: `Approve ${user.email || "this user"} as ${getRoleLabel(
        selectedRole
      )}?`,
      onConfirm: async () => {
        await approveUser(user.id, selectedRole);
        await loadUsers();
      },
    });
  }

  function requestReject(user: any) {
    if (user.id === currentUserId) {
      showToast("You cannot reject your own account.", "warning");
      return;
    }

    setConfirmModal({
      title: "Reject user?",
      message: `Are you sure you want to reject ${user.email || "this user"}?`,
      onConfirm: async () => {
        await rejectUser(user.id);
        await loadUsers();
      },
    });
  }

  async function handleConfirmAction() {
    if (!confirmModal) return;

    try {
      setProcessing(true);
      await confirmModal.onConfirm();
      setConfirmModal(null);
      showToast("User updated", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Action failed", "error");
    } finally {
      setProcessing(false);
    }
  }

  const pending = useMemo(
    () => allUsers.filter((user) => user.status === "pending"),
    [allUsers]
  );

  const approved = useMemo(
    () => allUsers.filter((user) => user.status === "approved"),
    [allUsers]
  );

  const rejected = useMemo(
    () => allUsers.filter((user) => user.status === "rejected"),
    [allUsers]
  );

  const visibleUsers = useMemo(() => {
    if (activeView === "pending") return pending;
    if (activeView === "approved") return approved;
    return rejected;
  }, [activeView, pending, approved, rejected]);

  const statCards = useMemo(() => {
    return [
      {
        label: "Users",
        value: allUsers.length,
        color: "bg-upred",
      },
      {
        label: "Pending",
        value: pending.length,
        color: "bg-upyellow",
      },
      {
        label: "Approved",
        value: approved.length,
        color: "bg-upgreen",
      },
      {
        label: "Rejected",
        value: rejected.length,
        color: "bg-upred",
      },
    ];
  }, [allUsers.length, pending.length, approved.length, rejected.length]);

  return (
    <SidebarLayout background="white">
      <div className="min-h-screen bg-white p-6">
        <AnimatePresence>
          {confirmModal && (
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
                  {confirmModal.title}
                </p>

                <p className="max-w-sm text-center text-sm text-black/60">
                  {confirmModal.message}
                </p>

                <div className="mt-2 flex gap-5">
                  <button
                    type="button"
                    onClick={handleConfirmAction}
                    disabled={processing}
                    className="rounded-lg bg-upgreen px-5 py-2 text-white/90 transition hover:scale-110 disabled:opacity-50"
                  >
                    ✔
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmModal(null)}
                    disabled={processing}
                    className="rounded-lg bg-upred px-5 py-2 text-white/90 transition hover:scale-110 disabled:opacity-50"
                  >
                    ✖
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-4 flex w-full justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold leading-none text-upred">
              Manage Users
            </h1>
            <p className="mt-2 text-sm text-black/60">
              Review access requests and assign user roles.
            </p>
          </div>
        </div>

        <div className="mb-6 h-px w-full bg-black/10" />

        {!accessChecked || loading ? (
          <p className="text-center text-black/60">Loading users...</p>
        ) : !isAdmin ? (
          <p className="text-center font-medium text-upred">
            Access denied. Admins only.
          </p>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className={`flex min-h-24 flex-col justify-center rounded-2xl border border-white/40 px-5 py-4 shadow-md backdrop-blur-sm ${card.color} text-white/90 transition hover:scale-105 hover:text-white hover:shadow-lg`}
                >
                  <div className="text-sm font-medium">{card.label}</div>
                  <div className="text-3xl font-extrabold">{card.value}</div>
                </div>
              ))}
            </div>

            <div className="mb-6 flex justify-center">
              <div className="inline-flex overflow-hidden rounded-xl border border-upred/30 bg-white/90">
                <button
                  type="button"
                  onClick={() => setActiveView("pending")}
                  className={`px-5 py-2 text-sm font-medium transition ${
                    activeView === "pending"
                      ? "bg-upred text-white"
                      : "text-upred hover:bg-upred/10"
                  }`}
                >
                  Pending
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView("approved")}
                  className={`px-5 py-2 text-sm font-medium transition ${
                    activeView === "approved"
                      ? "bg-upred text-white"
                      : "text-upred hover:bg-upred/10"
                  }`}
                >
                  Approved
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView("rejected")}
                  className={`px-5 py-2 text-sm font-medium transition ${
                    activeView === "rejected"
                      ? "bg-upred text-white"
                      : "text-upred hover:bg-upred/10"
                  }`}
                >
                  Rejected
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-upred/15 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
              <div className="mb-4 flex flex-col gap-1">
                <h2 className="text-xl font-bold text-upred">
                  {activeView === "pending" && "Pending Requests"}
                  {activeView === "approved" && "Approved Users"}
                  {activeView === "rejected" && "Rejected Users"}
                </h2>

                <p className="text-sm text-black/60">
                  {visibleUsers.length} user
                  {visibleUsers.length !== 1 && "s"} found
                </p>
              </div>

              {visibleUsers.length === 0 ? (
                <p className="rounded-xl border border-black/10 bg-white/80 px-4 py-6 text-center text-black/50">
                  No users found.
                </p>
              ) : (
                <div className="space-y-3">
                  {visibleUsers.map((user) => (
                    <div
                      key={user.id}
                      className="rounded-xl border border-black/10 bg-white/90 p-4 shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="font-bold text-black">
                            {user.email || "No email"}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                                user.status
                              )}`}
                            >
                              {String(user.status || "unknown").toUpperCase()}
                            </span>

                            <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-black/60">
                              {getRoleLabel(user.role)}
                            </span>
                          </div>
                        </div>

                        {activeView !== "approved" ? (
                          <div className="flex flex-col gap-3 md:flex-row md:items-center">
                            <div className="inline-flex overflow-hidden rounded-xl border border-upred/30 bg-white">
                              <button
                                type="button"
                                onClick={() =>
                                  handleRoleSelection(user.id, "staff")
                                }
                                className={`px-4 py-2 text-sm font-medium transition ${
                                  (roleSelections[user.id] || "staff") === "staff"
                                    ? "bg-upred text-white"
                                    : "text-upred hover:bg-upred/10"
                                }`}
                              >
                                Staff
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleRoleSelection(user.id, "chief")
                                }
                                className={`px-4 py-2 text-sm font-medium transition ${
                                  roleSelections[user.id] === "chief"
                                    ? "bg-upred text-white"
                                    : "text-upred hover:bg-upred/10"
                                }`}
                              >
                                Chief
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => requestApprove(user)}
                              className="flex items-center justify-center gap-2 rounded-xl bg-upgreen px-4 py-2 text-sm font-medium text-white transition hover:scale-105"
                            >
                              <Check className="h-4 w-4" />
                              Approve
                            </button>

                            {activeView === "pending" && (
                              <button
                                type="button"
                                onClick={() => requestReject(user)}
                                className="flex items-center justify-center gap-2 rounded-xl bg-upred px-4 py-2 text-sm font-medium text-white transition hover:scale-105"
                              >
                                <X className="h-4 w-4" />
                                Reject
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-black/50">
                            Approved account
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </SidebarLayout>
  );
}