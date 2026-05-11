import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

type AccessStatus =
  | "loading"
  | "no_user"
  | "no_profile"
  | "pending"
  | "rejected"
  | "approved"
  | "unknown";

export default function RequestAccess() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"staff" | "chief">("staff");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [status, setStatus] = useState<AccessStatus>("loading");

  useEffect(() => {
    async function loadState() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setStatus("no_user");
          setLoading(false);
          return;
        }

        setEmail(user.email || "");

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, email, role, status")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error(error);
          setStatus("unknown");
          setLoading(false);
          return;
        }

        if (!profile) {
          setStatus("no_profile");
          setLoading(false);
          return;
        }

        setRole(profile.role === "chief" ? "chief" : "staff");

        if (profile.status === "pending") setStatus("pending");
        else if (profile.status === "rejected") setStatus("rejected");
        else if (profile.status === "approved") setStatus("approved");
        else setStatus("unknown");

        setLoading(false);
      } catch (err) {
        console.error(err);
        setStatus("unknown");
        setLoading(false);
      }
    }

    loadState();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .upsert(
          [
            {
              id: user.id,
              email: user.email,
              role,
              status: "pending",
            },
          ],
          { onConflict: "id" }
        );

      if (error) {
        console.error(error);
        alert(error.message || "Failed to submit request");
        return;
      }

      setStatus("pending");
      setJustSubmitted(true);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-md border rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Request Access</h1>
        <p className="text-sm text-gray-600 mb-6">
          Your account is not yet allowed to enter the system.
        </p>

        {status === "pending" && justSubmitted && (
          <div className="space-y-4">
            <p className="text-green-700 font-medium">
              Your access request has been submitted successfully.
            </p>
            <p className="text-sm text-gray-600">
              Please wait for an administrator to review your request.
            </p>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-black text-white rounded cursor-pointer"
            >
              Logout
            </button>
          </div>
        )}

        {status === "pending" && !justSubmitted && (
          <div className="space-y-4">
            <p className="text-yellow-700 font-medium">
              You already have a pending access request.
            </p>
            <p className="text-sm text-gray-600">
              Please wait for an administrator to approve your request.
            </p>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-black text-white rounded cursor-pointer"
            >
              Logout
            </button>
          </div>
        )}

        {(status === "no_profile" || status === "rejected") && (
          <div className="space-y-4">
            <p className="text-red-700 font-medium">
              {status === "no_profile"
                ? "We could not find your access record."
                : "Your access request was rejected."}
            </p>
            <p className="text-sm text-gray-600">
              Submit a request below and wait for administrator approval.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Email</label>
                <input
                  value={email}
                  disabled
                  className="border p-2 rounded w-full bg-gray-100"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Requested Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "staff" | "chief")}
                  className="border p-2 rounded w-full"
                >
                  <option value="staff">CPDMO Staff</option>
                  <option value="chief">CPDMO Chief</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-black text-white rounded cursor-pointer"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 border rounded cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </form>
          </div>
        )}

        {status === "approved" && (
          <div className="space-y-4">
            <p className="text-green-700 font-medium">
              Your account has already been approved.
            </p>
            <a
              href="/dashboard"
              className="inline-block px-4 py-2 bg-black text-white rounded"
            >
              Go to Dashboard
            </a>
          </div>
        )}

        {status === "no_user" && (
          <div className="space-y-4">
            <p className="text-red-700 font-medium">You are not logged in.</p>
            <a
              href="/"
              className="inline-block px-4 py-2 bg-black text-white rounded"
            >
              Back to Login
            </a>
          </div>
        )}

        {status === "unknown" && (
          <div className="space-y-4">
            <p className="text-red-700 font-medium">
              Something went wrong while checking access.
            </p>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-black text-white rounded cursor-pointer"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}