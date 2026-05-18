import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider";

import LoginBG from "../assets/LoginBG.png";
import BIMS from "../assets/W-BIMS.png";
import Google from "../assets/Google.png";
import PrivacyNotice from "../assets/PrivacyNotice.png";

export default function Login() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [fadeOverlay, setFadeOverlay] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);

  async function redirectAfterLogin(fromLogin = true) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) return;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error("Login profile check error:", error);
      navigate("/request-access", { replace: true });
      return;
    }

    if (profile?.status === "approved" && profile?.role) {
      sessionStorage.setItem("bims_role", profile.role);
      navigate("/dashboard", { replace: true, state: { fromLogin } });
      return;
    }

    sessionStorage.removeItem("bims_role");
    navigate("/request-access", { replace: true });
  }

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        await redirectAfterLogin(true);
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        redirectAfterLogin(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOverlay(false), 600);
    return () => clearTimeout(timer);
  }, []);

  async function handleLogin() {
    try {
      setLoggingIn(true);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error(error);
        setLoggingIn(false);
        showToast(error.message || "Failed to start Google login.", "error");
      }
    } catch (err: any) {
      console.error(err);
      setLoggingIn(false);
      showToast(err.message || "Failed to start Google login.", "error");
    }
  }

  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-black bg-cover bg-center font-poppins">
      <div className="absolute inset-0 bg-black" />

      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${LoginBG})` }}
      />

      <div className="absolute inset-0 bg-black/20" />

      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="relative z-10 flex w-[48rem] items-center justify-center gap-10 rounded-xl border-5 border-upyellow/50 bg-upred/60 p-10 shadow-xl backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.1 }}
        >
          <img
            src={BIMS}
            alt="BIMS Logo"
            className="m-auto mb-3 w-72 transition hover:scale-105"
          />
        </motion.div>

        <div className="flex h-auto w-90 flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center text-2xl font-light text-white"
          >
            UP Manila
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-2 text-center text-6xl font-extrabold tracking-wide text-white"
          >
            BIMS
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-4 text-center text-base italic text-white/80"
          >
            Building Inventory Management System
          </motion.div>

          <motion.button
            type="button"
            onClick={handleLogin}
            disabled={loggingIn}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="group mb-1 flex items-center justify-center gap-3 rounded-full bg-white px-4 py-2 text-black/80 shadow-md transition duration-300 hover:bg-upgreen/90 hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <img
              src={Google}
              alt="Google Logo"
              className="w-6 opacity-70 transition duration-200 group-hover:invert"
            />
            <span className="font-medium">
              {loggingIn ? "Redirecting..." : "Login with UP Mail"}
            </span>
          </motion.button>

          <motion.p
            className="mt-4 text-center text-xs text-white/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            © 2026 UP Manila Building Inventory Management System
          </motion.p>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="absolute bottom-1 right-1 z-10 flex items-center gap-3 rounded-xl px-5 py-3 transition hover:bg-white/10 hover:text-upbrightred"
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

      <AnimatePresence>
        {loggingIn && (
          <motion.div
            className="fixed inset-0 z-50 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}