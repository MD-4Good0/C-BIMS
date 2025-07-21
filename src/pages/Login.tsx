// src/pages/Login.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import LoginBG from '../assets/LoginBG.png'
import BIMS from '../assets/W-BIMS.png'
import Google from '../assets/Google.png'

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
      className="font-poppins flex justify-center items-center h-screen bg-black bg-cover bg-center"
      style={{ backgroundImage: `url(${LoginBG})` }}
    >
      <form
        onSubmit={handleLogin}
        className="flex items-center justify-center bg-upred/70 p-8 rounded-xl shadow-md w-full max-w-xl border-upyellow/70 border-4 gap-10"
      >
        {/* Logo Section */}
        <div>
          <img
            src={BIMS}
            alt="BIMS Logo"
            className="m-auto w-40 mb-3"
          />
        </div>

        {/* Login Section */}
        <div className="flex flex-col justify-center h-auto w-64">
          <div className="text-center text-white">UP MANILA</div>
          <div className="text-center text-4xl font-semibold text-white mb-4">BIMS</div>

          <button
            type="submit"
            className="group w-full h-auto flex items-center justify-center gap-2 p-2
              text-black/50 bg-white/80 rounded-xl
              transition duration-300 hover:bg-upgreen hover:text-white/70 cursor-pointer"
          >
            <img
              src={Google}
              alt="Google Logo"
              className="w-8 opacity-50 transition duration-300 delay-100 group-hover:invert"
            />
            <div>Login with UP Mail</div>
          </button>
        </div>
      </form>
    </div>
  )
}
