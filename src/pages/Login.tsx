// src/pages/Login.tsx
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient"
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"

import LoginBG from "../assets/LoginBG.png"
import BIMS from "../assets/W-BIMS.png"
import Google from "../assets/Google.png"
import PrivacyNotice from "../assets/PrivacyNotice.png"

export default function Login() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate("/dashboard");
      }
    })
  }, [navigate])

  const [fadeOverlay, setFadeOverlay] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOverlay(false)); // match duration
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      `https://omaeytrjtduarnvyowuu.supabase.co/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(
        "http://localhost:5173/popup-callback"
      )}`,
      "GoogleLogin",
      `width=${width},height=${height},top=${top},left=${left}`
    );

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === "SUPABASE_LOGIN_SUCCESS") {
        console.log("Login successful!", event.data.session);

        setLoggingIn(true);

        setTimeout(() => {
          navigate("/dashboard", { state: { fromLogin: true } });
        }, 600);
        window.removeEventListener("message", handleMessage);
      }
    };

    window.addEventListener("message", handleMessage);
  };


  return (
    <div
      className="relative font-poppins flex justify-center items-center h-screen bg-black bg-cover bg-center gap-20"
      style={{ backgroundImage: `url(${LoginBG})` }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/20"></div>

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
