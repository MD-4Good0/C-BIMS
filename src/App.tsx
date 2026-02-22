// src/App.tsx
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import About from './pages/About'
import AddBuilding from './pages/AddBuilding'
import EditBuilding from './pages/EditBuilding'
import PopupCallback from './components/PopupCallback'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/popup-callback" element={<PopupCallback />} />
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/about"
        element={
          <ProtectedRoute>
            <About />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-building"
        element={
          <ProtectedRoute>
            <AddBuilding  />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-building/:id"
        element={
          <ProtectedRoute>
            <EditBuilding  />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
