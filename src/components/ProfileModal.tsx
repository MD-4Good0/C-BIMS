import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useToast } from "./ToastProvider";
import { supabase } from "../supabaseClient";

type ProfileStatus = "approved" | "pending" | "rejected" | "";

type ProfileModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<ProfileStatus>("");
  const [requestedRole, setRequestedRole] = useState<"staff" | "chief">("staff");
  const { showToast } = useToast();
  
  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

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
        showToast("Failed to load profile", "error");
        return;
      }

      if (data) {
        setFullName(data.full_name || "");
        setRole(data.role || "");
        setStatus((data.status as ProfileStatus) || "");
        setRequestedRole(data.role === "chief" ? "chief" : "staff");

        if (data.full_name) {
          sessionStorage.setItem("bims_full_name", data.full_name);
        }

        if (data.role) {
          sessionStorage.setItem("bims_role", data.role);
        }
      } else {
        setFullName("");
        setRole("");
        setStatus("");
        setRequestedRole("staff");
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
      showToast("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!userId) return;

    try {
      setSaving(true);

      const trimmedName = fullName.trim();

      const { error } = await supabase
        .from("profiles")
        .upsert(
          [
            {
              id: userId,
              email,
              full_name: trimmedName || null,
            },
          ],
          { onConflict: "id" }
        );

      if (error) {
        console.error(error);
        showToast("Failed to update profile", "error");
        return;
      }

      if (trimmedName) {
        sessionStorage.setItem("bims_full_name", trimmedName);
      } else {
        sessionStorage.removeItem("bims_full_name");
      }

      showToast("Profile updated", "success");
      await loadProfile();
    } catch (err) {
      console.error(err);
      showToast("Update failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRequestRoleChange() {
    if (!userId) return;

    try {
      setSaving(true);

      const trimmedName = fullName.trim();

      const { error } = await supabase
        .from("profiles")
        .upsert(
          [
            {
              id: userId,
              email,
              full_name: trimmedName || null,
              role: requestedRole,
              status: "pending",
            },
          ],
          { onConflict: "id" }
        );

      if (error) {
        console.error(error);
        showToast("Failed to submit role request", "error");
        return;
      }

      if (trimmedName) {
        sessionStorage.setItem("bims_full_name", trimmedName);
      }

      showToast("Role request submitted", "success");
      await loadProfile();
    } catch (err) {
      console.error(err);
      showToast("Request failed", "error");
    } finally {
      setSaving(false);
    }
  }

  function getStatusClass() {
    if (status === "approved") return "border-upgreen/20 bg-upgreen/10 text-upgreen";
    if (status === "pending") return "border-upyellow/30 bg-upyellow/20 text-black";
    if (status === "rejected") return "border-upred/20 bg-upred/10 text-upred";
    return "border-black/10 bg-black/5 text-black/60";
  }

  function getRoleLabel() {
    if (role === "staff") return "Staff";
    if (role === "chief") return "Chief";
    if (role === "admin") return "Admin";
    return "No role assigned";
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={onClose}
        >
          <motion.div
            className="relative ml-15 w-full max-w-2xl rounded-2xl border border-white/40 bg-white/95 p-6 shadow-xl backdrop-blur-md"
            initial={{ scale: 0.9, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              title="Close profile"
              className="absolute right-5 top-5 rounded-full p-2 text-black/50 transition hover:bg-upred/10 hover:text-upred"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5 text-center">
              <h1 className="text-3xl font-extrabold leading-none text-upred">
                Profile
              </h1>
              <p className="mt-2 text-sm text-black/60">
                Manage your display name and access request.
              </p>
            </div>

            <div className="mb-6 h-px w-full bg-black/10" />

            {loading ? (
              <p className="py-10 text-center text-black/60">
                Loading profile...
              </p>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Email
                    </label>
                    <input
                      value={email}
                      disabled
                      className="w-full cursor-not-allowed rounded-lg border border-upred/20 bg-black/5 p-3 text-black/50"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Display Name
                    </label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter display name"
                      className="w-full rounded-lg border border-upred/30 bg-white/90 p-3"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Current Role
                    </label>
                    <input
                      value={getRoleLabel()}
                      disabled
                      className="w-full cursor-not-allowed rounded-lg border border-upred/20 bg-black/5 p-3 text-black/50"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Status
                    </label>
                    <div
                      className={`inline-flex min-h-[48px] items-center rounded-lg border px-4 text-sm font-semibold ${getStatusClass()}`}
                    >
                      {status ? status.toUpperCase() : "NONE"}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-upred/15 bg-white/80 p-5 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-upred">
                      Role Request
                    </h2>
                    <p className="mt-1 text-sm text-black/60">
                      Request staff or chief access for admin review.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="inline-flex overflow-hidden rounded-xl border border-upred/30 bg-white">
                      <button
                        type="button"
                        onClick={() => setRequestedRole("staff")}
                        className={`px-5 py-2 text-sm font-medium transition ${
                          requestedRole === "staff"
                            ? "bg-upred text-white"
                            : "text-upred hover:bg-upred/10"
                        }`}
                      >
                        Staff
                      </button>

                      <button
                        type="button"
                        onClick={() => setRequestedRole("chief")}
                        className={`px-5 py-2 text-sm font-medium transition ${
                          requestedRole === "chief"
                            ? "bg-upred text-white"
                            : "text-upred hover:bg-upred/10"
                        }`}
                      >
                        Chief
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleRequestRoleChange}
                      disabled={saving}
                      className="rounded-xl border border-upgreen/30 px-5 py-2 text-sm font-medium text-upgreen transition hover:bg-upgreen/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? "Submitting..." : "Submit Role Request"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="rounded-xl border border-upred/30 px-5 py-2 text-sm font-medium text-upred transition hover:bg-upred/10 disabled:opacity-50"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="rounded-xl bg-upred px-5 py-2 text-sm font-medium text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}