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
      navigate("/request-access");
      return;
    }
  
    if (profile?.status === "approved" && profile?.role) {
      sessionStorage.setItem("bims_role", profile.role);
      navigate("/dashboard", { state: { fromLogin } });
      return;
    }
  
    sessionStorage.removeItem("bims_role");
    navigate("/request-access");
  }

  useEffect(() => {
    const isPopupWindow = Boolean(window.opener && window.opener !== window);
  
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
    
      if (isPopupWindow) {
        if (session) {
          window.opener.postMessage(
            {
              type: "BIMS_AUTH_SUCCESS",
            },
            window.location.origin
          );
    
          window.close();
          return;
        }
    
        window.opener.postMessage(
          {
            type: "BIMS_AUTH_CANCELLED",
          },
          window.location.origin
        );
    
        window.close();
        return;
      }
    
      if (session) {
        redirectAfterLogin(true);
      }
    }
  
    checkSession();
  
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        if (isPopupWindow) {
          window.opener.postMessage(
            {
              type: "BIMS_AUTH_SUCCESS",
            },
            "*"
          );
  
          window.close();
          return;
        }
  
        redirectAfterLogin(true);
      }
    });
  
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const [fadeOverlay, setFadeOverlay] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    function handleAuthMessage(event: MessageEvent) {
      const isAllowedOrigin =
        event.origin === window.location.origin ||
        event.origin.endsWith(".vercel.app");
  
        if (!isAllowedOrigin) return;

        if (event.data?.type === "BIMS_AUTH_CANCELLED") {
          setLoggingIn(false);
          return;
        }
        
        if (event.data?.type !== "BIMS_AUTH_SUCCESS") return;
  
      supabase.auth.getSession().then(({ data }) => {
        setLoggingIn(false);
  
        if (data.session) {
          redirectAfterLogin(true);
        } else {
          showToast(
            "Login finished, but the session was not found. Check the Supabase redirect URL.",
            "error"
          );
        }
      });
    }
  
    window.addEventListener("message", handleAuthMessage);
  
    return () => {
      window.removeEventListener("message", handleAuthMessage);
    };
  }, [navigate, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOverlay(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    setLoggingIn(true);

    const redirectTo = `${window.location.origin}/popup-callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      console.error(error);
      setLoggingIn(false);
      showToast(error?.message || "Failed to start Google login.", "error");
      return;
    }

    const popup = window.open(
      data.url,
      "GoogleLogin",
      `width=${width},height=${height},top=${top},left=${left}`
    );

    if (!popup) {
      setLoggingIn(false);
      showToast("Popup was blocked. Please allow popups and try again.", "warning");
      return;
    }

    const pollPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollPopup);

        supabase.auth.getSession().then(({ data }) => {
          if (data.session) {
            redirectAfterLogin(true);
          } else {
            setLoggingIn(false);
          }
        });
      }
    }, 500);
  };
  
  return (
    <div className="relative font-poppins flex justify-center items-center h-screen overflow-hidden bg-black gap-20">
      <div className="absolute inset-0 bg-black" />

      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${LoginBG})` }}
      />

      <div className="absolute inset-0 bg-black/20" />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="relative z-10 flex items-center justify-center backdrop-blur-sm bg-upred/60 p-10 rounded-xl shadow-xl w-[48rem] border-5 border-upyellow/50 gap-10"
      >
        {/* Logo */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.1 }}>
          <img src={BIMS} alt="BIMS Logo" className="m-auto w-72 mb-3 hover:scale-105 transition" />
        </motion.div>

        {/* Login Section */}
        <div className="flex flex-col justify-center h-auto w-90">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="text-center text-2xl font-light text-white">
            UP Manila
          </motion.div>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-center text-6xl font-extrabold text-white tracking-wide mb-2">
            BIMS
          </motion.div>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="text-center text-base italic text-white/80 mb-4">
            Building Inventory Management System
          </motion.div>

          {/* Google login button */}
          <motion.button
            type="button"
            onClick={handleLogin}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="group flex items-center justify-center gap-3 py-2 px-4
              text-black/80 bg-white rounded-full shadow-md
              transition duration-300 hover:backdrop-blur-sm
              hover:bg-upgreen/90 hover:text-white/80 cursor-pointer mb-1"
          >
            <img src={Google} alt="Google Logo" className="w-6 opacity-70 transition duration-200 group-hover:invert"/>
            <span className="font-medium">Login with UP Mail</span>
          </motion.button>

          {/* Copyright */}
          <motion.p className="text-xs text-white/70 mt-4 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.8 }}>
            © 2026 UP Manila Building Inventory Management System
          </motion.p>
        </div>
      </motion.div>

      {/* Privacy Notice */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="absolute bottom-1 right-1 flex items-center gap-3 py-3 px-5 rounded-xl hover:cursor-pointer hover:bg-white/10 hover:text-upbrightred transition"
        onClick={() => window.open("https://privacy.up.edu.ph/", "_blank")}
      >
        <div className="flex flex-col items-end text-sm text-white/70 text-center">
          <div className="font-semibold text-upbrightred">UP</div>
          <div>Privacy Notice</div>
        </div>
        <img src={PrivacyNotice} alt="Privacy Notice" className="w-10" />
      </motion.button>

      <AnimatePresence>
        {fadeOverlay && (
          <motion.div
            className="fixed inset-0 bg-black z-50"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, delay: 0.1}}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {loggingIn && (
          <motion.div
            className="fixed inset-0 bg-black z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
