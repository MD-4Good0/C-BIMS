// src/pages/Login.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import LoginBG from '../assets/LoginBG.png'
import BIMS from '../assets/W-BIMS.png'
import Google from '../assets/Google.png'
import PrivacyNotice from '../assets/PrivacyNotice.png'

export default function Login() {
  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('loggedIn') === 'true') {
      navigate('/dashboard')
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('loggedIn', 'true')
    navigate('/dashboard')
  }

  return (
    <div
      className="relative font-poppins flex justify-center items-center h-screen bg-black bg-cover bg-center gap-20"
      style={{ backgroundImage: `url(${LoginBG})` }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/20"></div>
  
      {/* Login Card */}
      <form
        onSubmit={handleLogin}
        className="relative z-10 flex items-center justify-center backdrop-blur-sm bg-upred/60 p-10 rounded-sm shadow-xl w-[48rem] border-5 border-upyellow/50 gap-10"
      >
        {/* Logo Section */}
        <div>
          <img
            src={BIMS}
            alt="BIMS Logo"
            className="m-auto w-72 mb-3 hover:scale-105 transition"
          />
        </div>

        {/* Login Section */}
        <div className="flex flex-col justify-center h-auto w-90">
          <div className="text-center text-2xl font-light text-white">UP Manila</div>
          <div className="text-center text-6xl font-extrabold text-white tracking-wide mb-2">BIMS</div>
          <div className="text-center text-base italic text-white/80 mb-4">Building Inventory Management System</div>

          <button
            type="submit"
            className="group flex items-center justify-center gap-3 py-2 px-4
              text-black/80 bg-white rounded-full shadow-md
              transition duration-300 hover:scale-105 hover:shadow-lg hover:bg-upgreen hover:text-white/80 cursor-pointer mb-1"
          >
            <img
              src={Google}
              alt="Google Logo"
              className="w-6 opacity-70 transition duration-300 group-hover:invert"
            />
            <span className="font-medium">Login with UP Mail</span>
          </button>

          {/* Copyright */}
          <p className="text-xs text-white/70 mt-4 text-center">
            © 2026 UP Manila Building Inventory Management System
          </p>
        </div>
      </form>

      {/* Privacy Notice */}
      <button className="absolute bottom-3 left-4 flex items-center gap-3 opacity-60 hover:cursor-pointer hover:opacity-90 hover:hover:scale-105 transition" onClick={() => window.open('https://privacy.up.edu.ph/', '_blank')}>
        <img
          src={PrivacyNotice}
          alt="Privacy Notice"
          className="w-10"
        />
        <div className="flex flex-col items-start text-sm text-white/70 text-center">
          <div className="font-semibold text-upbrightred">UP</div>
          <div>Privacy Notice</div>
        </div>
      </button>
    </div>
  )
}
