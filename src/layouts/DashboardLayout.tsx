// src/layouts/DashboardLayout.tsx

import { useNavigate,Link } from "react-router-dom"
import { Info, LogOut, User } from "lucide-react"

import BIMS from '../assets/W-BIMS.png'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  
    const navigate = useNavigate()

    const handleLogout = () => {
        localStorage.removeItem('loggedIn')
        navigate('/')
    }

    return (
    <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="flex flex-col justify-between bg-upred w-16 py-4 text-white">
            {/* Top Section */}
            <div className="flex flex-col items-center gap-6">
                {/* Logo */}
                <Link to="/dashboard">
                    <img
                        src={BIMS}
                        alt="BIMS Logo"
                        className="m-auto w-10"
                    />
                </Link>
                <div className="h-[1px] w-8 bg-white/40"></div>
            </div>

            {/* Bottom Section */}
            <div className="flex flex-col items-center gap-6">
                <Link to="/about">
                    <Info className="w-6 h-6 hover:text-upyellow transition" />
                </Link>
                <div className="h-[1px] w-8 bg-white/40"></div>
                <Link to="/profile">
                    <User className="w-6 h-6 hover:text-upyellow transition" />
                </Link>
                <button onClick={handleLogout}>
                    <LogOut className="w-6 h-6 hover:text-upyellow transition cursor-pointer" />
                </button>
            </div>
        </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
