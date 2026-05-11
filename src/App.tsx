import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import RequestAccess from "./pages/RequestAccess";
import AdminUsers from "./pages/AdminUsers";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import About from "./pages/About";
import AddBuilding from "./pages/AddBuilding";
import EditBuilding from "./pages/EditBuilding";
import PopupCallback from "./components/PopupCallback";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminColleges from "./pages/AdminColleges";
import Reports from "./pages/Reports";
import ServiceRequests from "./pages/ServiceRequests";

function App() {
  return (
    <Routes>
      <Route path="/popup-callback" element={<PopupCallback />} />
      <Route path="/" element={<Login />} />
      <Route path="/request-access" element={<RequestAccess />} />

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
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/add-building"
        element={
          <ProtectedRoute>
            <AddBuilding />
          </ProtectedRoute>
        }
      />

      <Route
        path="/edit-building/:id"
        element={
          <ProtectedRoute>
            <EditBuilding />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/colleges"
        element={
          <ProtectedRoute>
            <AdminColleges />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <AdminUsers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/service-requests"
        element={
          <ProtectedRoute>
            <ServiceRequests />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;