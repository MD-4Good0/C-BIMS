import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const isLoggedIn = localStorage.getItem('loggedIn') === 'true'
  return isLoggedIn ? children : <Navigate to="/" />
}
