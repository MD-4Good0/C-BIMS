import { useEffect, useState } from "react";
import SidebarLayout from "../layouts/SidebarLayout";
import { supabase } from "../supabaseClient";
import {
  getPendingUsers,
  getAllUsers,
  approveUser,
  rejectUser,
} from "../adminUsers";

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [accessChecked, setAccessChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [roleSelections, setRoleSelections] = useState<
    Record<string, "staff" | "chief">
  >({});

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
        alert("Failed to check admin access");
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
      alert("Failed to load users");
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
      alert("Failed to load users");
    }
  }

  async function handleApprove(id: string) {
    if (id === currentUserId) {
      alert("You cannot change your own account from this page.");
      return;
    }

    try {
      const selectedRole = roleSelections[id] || "staff";
      await approveUser(id, selectedRole);
      await loadUsers();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to approve user");
    }
  }

  async function handleReject(id: string) {
    if (id === currentUserId) {
      alert("You cannot reject your own account.");
      return;
    }

    try {
      await rejectUser(id);
      await loadUsers();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to reject user");
    }
  }

  const pending = allUsers.filter((user) => user.status === "pending");
  const approved = allUsers.filter((user) => user.status === "approved");
  const rejected = allUsers.filter((user) => user.status === "rejected");

  return (
    <SidebarLayout background="white">
      <div className="bg-white min-h-screen p-6">
        <h1 className="text-2xl font-bold mb-2">Manage Users</h1>
        <p className="text-sm text-gray-500 mb-6">
          Review pending access requests and assign approved roles.
        </p>

        {!accessChecked || loading ? (
          <p>Loading users...</p>
        ) : !isAdmin ? (
          <p className="text-red-600">Access denied. Admins only.</p>
        ) : (
          <>
            <div className="mb-10">
              <h2 className="text-xl font-semibold mb-3">Pending Requests</h2>

              {pending.length === 0 ? (
                <p className="text-gray-500">No pending users.</p>
              ) : (
                <div className="space-y-4">
                  {pending.map((user) => (
                    <div
                      key={user.id}
                      className="border rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="font-medium">{user.email || "No email"}</div>
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                          Pending
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        <select
                          value={roleSelections[user.id] || "staff"}
                          onChange={(e) =>
                            setRoleSelections((prev) => ({
                              ...prev,
                              [user.id]: e.target.value as "staff" | "chief",
                            }))
                          }
                          className="border p-2 rounded"
                        >
                          <option value="staff">CPDMO Staff</option>
                          <option value="chief">CPDMO Chief</option>
                        </select>

                        <button
                          onClick={() => handleApprove(user.id)}
                          className="px-3 py-2 bg-green-700 text-white rounded cursor-pointer"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => handleReject(user.id)}
                          className="px-3 py-2 bg-red-700 text-white rounded cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-10">
              <h2 className="text-xl font-semibold mb-3">Approved Users</h2>
              {approved.length === 0 ? (
                <p className="text-gray-500">No approved users.</p>
              ) : (
                <div className="space-y-3">
                  {approved.map((user) => (
                    <div key={user.id} className="border rounded-lg p-4">
                      <div className="font-medium">{user.email || "No email"}</div>
                      <div className="text-sm text-gray-600">
                        Role: {user.role || "none"}
                      </div>
                      <div className="text-sm text-gray-600">
                        Status: {user.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Rejected Users</h2>
              {rejected.length === 0 ? (
                <p className="text-gray-500">No rejected users.</p>
              ) : (
                <div className="space-y-3">
                  {rejected.map((user) => (
                    <div
                      key={user.id}
                      className="border rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="font-medium">{user.email || "No email"}</div>
                        <div className="text-sm text-gray-600">
                          Previous role: {user.role || "none"}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        <select
                          value={roleSelections[user.id] || "staff"}
                          onChange={(e) =>
                            setRoleSelections((prev) => ({
                              ...prev,
                              [user.id]: e.target.value as "staff" | "chief",
                            }))
                          }
                          className="border p-2 rounded"
                        >
                          <option value="staff">CPDMO Staff</option>
                          <option value="chief">CPDMO Chief</option>
                        </select>

                        <button
                          onClick={() => handleApprove(user.id)}
                          className="px-3 py-2 bg-green-700 text-white rounded cursor-pointer"
                        >
                          Approve
                        </button>
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