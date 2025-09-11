// src/layouts/DashboardLayout.tsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate,Link } from "react-router-dom"
import { Info, LogOut, User } from "lucide-react"
import { supabase } from "../supabaseClient"

import BIMS from '../assets/W-BIMS.png'

export default function SideBarLayout({
    children,
    background = "white",
}: {
    children: React.ReactNode,
    background?: string 
}) {
  
    const navigate = useNavigate()

    const handleLogout = () => {
        setShowFade(true); // fade-to-black overlay appears

        setTimeout(async () => {
            await supabase.auth.signOut();
            navigate("/");
        }, 500);
    };

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showFade, setShowFade] = useState(false);

    return (
        <div
            className="flex h-screen bg-cover bg-center relative"
            style={background ? { backgroundImage: `url(${background})` } : {}}
        >
            {/* Sidebar */}
            <aside className="relative z-10 flex flex-col justify-between backdrop-blur-sm bg-upred/95 w-16 py-4 text-white">
                {/* Top Section */}
                <div className="flex flex-col items-center gap-6">
                    {/* Logo */}
                    <Link to="/dashboard">
                        <img
                            src={BIMS}
                            alt="BIMS Logo"
                            className="m-auto w-10 hover:scale-110 opacity-90 active:scale-100 transition"
                        />
                    </Link>
                    <div className="h-[1px] w-8 bg-white/70"></div>
                </div>

                {/* Bottom Section */}
                <div className="flex flex-col items-center gap-6">
                    <Link to="/about">
                        <Info className="w-6 h-6 hover:scale-110 opacity-90 active:scale-100 transition" />
                    </Link>
                    <div className="h-[1px] w-8 bg-white/80"></div>
                    <Link to="/profile">
                        <User className="w-6 h-6 hover:scale-110 opacity-90 active:scale-100 transition" />
                    </Link>
                    <button onClick={() => setShowLogoutModal(true)}>
                        <LogOut className="w-6 h-6 hover:scale-110 opacity-90 active:scale-100 transition cursor-pointer" />
                    </button>
                </div>
            </aside>
            <AnimatePresence>
                {showLogoutModal && (
                    <motion.div 
                        className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.div 
                            className="backdrop-blur-sm bg-white/90 rounded-lg py-6 px-10 flex flex-col items-center gap-2 shadow-lg ml-15"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <p className="text-black/90 text-center font-medium text-xl">Are you sure?</p>
                            <div className="flex gap-5 mt-2">
                                {/* Confirm button */}
                                <button
                                    onClick={handleLogout}
                                    className="bg-upgreen text-white/80 px-5 py-2 rounded-lg cursor-pointer hover:scale-110 transition"
                                >
                                    ✔
                                </button>
                                {/* Cancel button */}
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="bg-upred text-white/80 px-5 py-2 rounded-lg cursor-pointer hover:scale-110 transition"
                                >
                                    ✖
                                </button>
                            </div>
                        </motion.div >
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showFade && (
                    <motion.div
                    className="fixed inset-0 bg-black z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    />
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 bg-transparent overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
