import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useToast } from "./ToastProvider";
import { supabase } from "../supabaseClient";

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
        setUserId(null);
        setEmail("");
        setFullName("");
        setRole("");
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
        const loadedName = data.full_name || "";
        const loadedRole = data.role || "";
        const loadedStatus = data.status || "";

        setFullName(loadedName);
        setRole(loadedRole);

        if (loadedName) {
          sessionStorage.setItem("bims_full_name", loadedName);
        } else {
          sessionStorage.removeItem("bims_full_name");
        }

        if (loadedStatus === "approved" && loadedRole) {
          sessionStorage.setItem("bims_role", loadedRole);
        } else {
          sessionStorage.removeItem("bims_role");
        }
      } else {
        setFullName("");
        setRole("");
        sessionStorage.removeItem("bims_role");
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
                Manage your display name and view your access details.
              </p>
            </div>

            <div className="mb-6 h-px w-full bg-black/10" />

            {loading ? (
              <p className="py-10 text-center text-black/60">
                Loading profile...
              </p>
            ) : (
              <div className="space-y-4">
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
                      Role
                    </label>
                    <input
                      value={getRoleLabel()}
                      disabled
                      className="w-full cursor-not-allowed rounded-lg border border-upred/20 bg-black/5 p-3 text-black/50"
                    />
                  </div>
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

                <div className="mt-8 flex flex-wrap justify-center gap-3">
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
                    className="rounded-xl border border-upgreen/30 px-5 py-2 text-sm font-medium text-upgreen transition hover:bg-upgreen/10 disabled:cursor-not-allowed disabled:opacity-50"
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