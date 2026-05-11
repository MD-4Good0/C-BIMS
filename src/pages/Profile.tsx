import { useEffect, useState } from "react";
import SidebarLayout from "../layouts/SidebarLayout";
import { supabase } from "../supabaseClient";

type ProfileStatus = "approved" | "pending" | "rejected" | "";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<ProfileStatus>("");

  const [requestedRole, setRequestedRole] = useState<"staff" | "chief">("staff");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, role, status")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error(error);
        alert("Failed to load profile");
        return;
      }

      if (data) {
        setFullName(data.full_name || "");
        setRole(data.role || "");
        setStatus((data.status as ProfileStatus) || "");
        setRequestedRole(data.role === "chief" ? "chief" : "staff");
      } else {
        setFullName("");
        setRole("");
        setStatus("");
        setRequestedRole("staff");
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
      alert("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!userId) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .upsert(
          [
            {
              id: userId,
              email,
              full_name: fullName.trim() || null,
            },
          ],
          { onConflict: "id" }
        );

      if (error) {
        console.error(error);
        alert("Failed to update profile");
        return;
      }

      alert("Profile updated");
      await loadProfile();
    } catch (err) {
      console.error(err);
      alert("Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleRequestRoleChange() {
    if (!userId) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .upsert(
          [
            {
              id: userId,
              email,
              full_name: fullName.trim() || null,
              role: requestedRole,
              status: "pending",
            },
          ],
          { onConflict: "id" }
        );

      if (error) {
        console.error(error);
        alert("Failed to submit role request");
        return;
      }

      alert("Role request submitted");
      await loadProfile();
    } catch (err) {
      console.error(err);
      alert("Request failed");
    } finally {
      setSaving(false);
    }
  }

  function getStatusColor() {
    if (status === "approved") return "bg-green-100 text-green-800";
    if (status === "pending") return "bg-yellow-100 text-yellow-800";
    if (status === "rejected") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-700";
  }

  if (loading) {
    return (
      <SidebarLayout background="white">
        <div className="bg-white min-h-screen p-6">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout background="white">
      <div className="bg-white min-h-screen p-6">
        <h1 className="text-2xl font-bold mb-2">Profile</h1>
        <p className="text-sm text-gray-500 mb-6">Manage your account details.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
          <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
            <h2 className="font-semibold mb-3">Account Info</h2>

            <div className="mb-3">
              <label className="text-sm text-gray-600 block mb-1">Email</label>
              <input
                value={email}
                disabled
                className="border p-2 rounded w-full bg-gray-100"
              />
            </div>

            <div className="mb-3">
              <label className="text-sm text-gray-600 block mb-1">Display Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter display name"
                className="border p-2 rounded w-full"
              />
            </div>

            <div className="mb-3">
              <label className="text-sm text-gray-600 block mb-1">Current Role</label>
              <input
                value={role || "No role assigned"}
                disabled
                className="border p-2 rounded w-full bg-gray-100"
              />
            </div>

            <div className="mb-4">
              <label className="text-sm text-gray-600 block mb-1">Status</label>
              <span className={`inline-block px-3 py-1 rounded text-sm ${getStatusColor()}`}>
                {status || "none"}
              </span>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className={`px-4 py-2 bg-black text-white rounded ${
                saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>

          <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
            <h2 className="font-semibold mb-3">Role Request</h2>
            <p className="text-sm text-gray-500 mb-4">
              Submit a role request if you need staff or chief access reviewed by an administrator.
            </p>

            <div className="mb-4">
              <label className="text-sm text-gray-600 block mb-1">Requested Role</label>
              <select
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value as "staff" | "chief")}
                className="border p-2 rounded w-full"
              >
                <option value="staff">CPDMO Staff</option>
                <option value="chief">CPDMO Chief</option>
              </select>
            </div>

            <button
              onClick={handleRequestRoleChange}
              disabled={saving}
              className={`px-4 py-2 border rounded ${
                saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {saving ? "Submitting..." : "Submit Role Request"}
            </button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}