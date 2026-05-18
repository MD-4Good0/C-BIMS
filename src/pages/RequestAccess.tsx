import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useToast } from "../components/ToastProvider";

import LoginBG from "../assets/LoginBG.png";
import PrivacyNotice from "../assets/PrivacyNotice.png";

type AccessStatus =
  | "loading"
  | "no_user"
  | "no_profile"
  | "pending"
  | "rejected"
  | "approved"
  | "unknown";

export default function RequestAccess() {
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"staff" | "chief">("staff");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [status, setStatus] = useState<AccessStatus>("loading");
  const [fadeOverlay, setFadeOverlay] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOverlay(false), 600);
    return () => clearTimeout(timer);
  }, []);

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
        showToast("You must be logged in.", "warning");
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
        showToast(error.message || "Failed to submit request", "error");
        return;
      }

      setStatus("pending");
      setJustSubmitted(true);
      showToast("Access request submitted", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to submit request", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  function goToLogin() {
    window.location.href = "/";
  }

  function goToDashboard() {
    window.location.href = "/dashboard";
  }

  function getHeading() {
    if (status === "pending") return "Request Pending";
    if (status === "rejected") return "Access Rejected";
    if (status === "approved") return "Access Approved";
    if (status === "no_user") return "Not Logged In";
    if (status === "unknown") return "Access Error";
    return "Request Access";
  }

  function getSubheading() {
    if (status === "pending" && justSubmitted) {
      return "Your access request has been submitted successfully.";
    }

    if (status === "pending") {
      return "Your account is waiting for administrator approval.";
    }

    if (status === "rejected") {
      return "Your previous request was rejected. You may submit another request.";
    }

    if (status === "approved") {
      return "Your account is already approved.";
    }

    if (status === "no_user") {
      return "Please login first before requesting access.";
    }

    if (status === "unknown") {
      return "Something went wrong while checking your access.";
    }

    return "Your account is not yet allowed to enter the system.";
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black bg-cover bg-center px-6 font-poppins"
      style={{ backgroundImage: `url(${LoginBG})` }}
    >
      <div className="absolute inset-0 bg-black/30" />

      <motion.div
        initial={{ opacity: 0.5, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="relative z-10 flex w-full max-w-xl flex-col items-center justify-center rounded-xl border-5 border-upyellow/50 bg-upred/60 p-8 shadow-xl backdrop-blur-sm md:p-10"
      >
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-full"
        >
          <div className="mb-5 text-center md:text-left">
            <p className="text-xl font-light text-white/85">UP Manila BIMS</p>

            <h1 className="text-4xl font-extrabold tracking-wide text-white">
              {getHeading()}
            </h1>

            <p className="mt-2 text-sm leading-6 text-white/75">
              {loading ? "Checking your account status..." : getSubheading()}
            </p>
          </div>

          <div className="rounded-2xl border border-white/25 bg-white/15 p-5 shadow-lg backdrop-blur-md">
            {loading || status === "loading" ? (
              <div className="flex min-h-44 flex-col items-center justify-center gap-3 text-white/80">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                <p className="text-sm">Checking access status...</p>
              </div>
            ) : (
              <>
                {(status === "no_profile" || status === "rejected") && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-white/85">
                        Email
                      </label>

                      <input
                        value={email}
                        disabled
                        className="w-full cursor-not-allowed rounded-xl border border-white/30 bg-white/90 p-3 text-black/60"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/85">
                        Requested Role
                      </label>

                      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-white/30 bg-white/15">
                        <button
                          type="button"
                          onClick={() => setRole("staff")}
                          className={`px-4 py-3 text-sm font-semibold transition ${
                            role === "staff"
                              ? "bg-upgreen text-white"
                              : "text-white/80 hover:bg-white/10"
                          }`}
                        >
                          Staff
                        </button>

                        <button
                          type="button"
                          onClick={() => setRole("chief")}
                          className={`px-4 py-3 text-sm font-semibold transition ${
                            role === "chief"
                              ? "bg-upyellow text-black"
                              : "text-white/80 hover:bg-white/10"
                          }`}
                        >
                          Chief
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 rounded-full bg-white px-5 py-3 text-sm font-semibold text-upred shadow-md transition hover:scale-[1.02] hover:bg-upgreen hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {submitting ? "Submitting..." : "Submit Request"}
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={submitting}
                        className="flex-1 rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Logout
                      </button>
                    </div>
                  </form>
                )}

                {status === "pending" && (
                  <div className="space-y-4 text-center">
                    <div className="rounded-xl border border-upyellow/40 bg-upyellow/20 p-4 text-white">
                      <p className="font-semibold">
                        {justSubmitted
                          ? "Your request was submitted."
                          : "Your request is already pending."}
                      </p>

                      <p className="mt-2 text-sm text-white/75">
                        Please wait for an administrator to review your account.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-upred shadow-md transition hover:scale-[1.02] hover:bg-upgreen hover:text-white"
                    >
                      Logout
                    </button>
                  </div>
                )}

                {status === "approved" && (
                  <div className="space-y-4 text-center">
                    <div className="rounded-xl border border-upgreen/30 bg-upgreen/20 p-4 text-white">
                      <p className="font-semibold">
                        Your account has already been approved.
                      </p>

                      <p className="mt-2 text-sm text-white/75">
                        Continue to the dashboard to access the system.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={goToDashboard}
                      className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-upred shadow-md transition hover:scale-[1.02] hover:bg-upgreen hover:text-white"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                )}

                {status === "no_user" && (
                  <div className="space-y-4 text-center">
                    <div className="rounded-xl border border-upred/30 bg-upred/25 p-4 text-white">
                      <p className="font-semibold">You are not logged in.</p>

                      <p className="mt-2 text-sm text-white/75">
                        Return to the login page and sign in with your UP Mail.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={goToLogin}
                      className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-upred shadow-md transition hover:scale-[1.02] hover:bg-upgreen hover:text-white"
                    >
                      Back to Login
                    </button>
                  </div>
                )}

                {status === "unknown" && (
                  <div className="space-y-4 text-center">
                    <div className="rounded-xl border border-upred/30 bg-upred/25 p-4 text-white">
                      <p className="font-semibold">
                        Something went wrong while checking access.
                      </p>

                      <p className="mt-2 text-sm text-white/75">
                        Please logout and try signing in again.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-upred shadow-md transition hover:scale-[1.02] hover:bg-upgreen hover:text-white"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-white/65">
            © 2026 UP Manila Building Inventory Management System
          </p>
        </motion.div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="absolute bottom-1 right-1 z-10 flex items-center gap-3 rounded-xl px-5 py-3 transition hover:cursor-pointer hover:bg-white/10 hover:text-upbrightred"
        onClick={() => window.open("https://privacy.up.edu.ph/", "_blank")}
      >
        <div className="flex flex-col items-end text-center text-sm text-white/70">
          <div className="font-semibold text-upbrightred">UP</div>
          <div>Privacy Notice</div>
        </div>

        <img src={PrivacyNotice} alt="Privacy Notice" className="w-10" />
      </motion.button>

      <AnimatePresence>
        {fadeOverlay && (
          <motion.div
            className="fixed inset-0 z-50 bg-black"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, delay: 0.1 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}