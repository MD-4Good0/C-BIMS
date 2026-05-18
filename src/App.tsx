import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import RequestAccess from "./pages/RequestAccess";
import AdminUsers from "./pages/AdminUsers";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import AddBuilding from "./pages/AddBuilding";
import EditBuilding from "./pages/EditBuilding";
import PopupCallback from "./components/PopupCallback";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import AdminColleges from "./pages/AdminColleges";
import Reports from "./pages/Reports";
import ServiceRequests from "./pages/ServiceRequests";
import { ToastProvider } from "./components/ToastProvider";

function App() {
  return (
    <ToastProvider>
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
          path="/add-building"
          element={
            <RoleRoute allowedRoles={["admin", "staff"]}>
              <AddBuilding />
            </RoleRoute>
          }
        />

        <Route
          path="/edit-building/:id"
          element={
            <RoleRoute allowedRoles={["admin", "staff"]}>
              <EditBuilding />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/colleges"
          element={
            <RoleRoute allowedRoles={["admin"]}>
              <AdminColleges />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <RoleRoute allowedRoles={["admin"]}>
              <AdminUsers />
            </RoleRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <RoleRoute allowedRoles={["admin", "chief"]}>
              <Reports />
            </RoleRoute>
          }
        />

        <Route
          path="/service-requests"
          element={
            <RoleRoute allowedRoles={["admin", "chief", "staff"]}>
              <ServiceRequests />
            </RoleRoute>
          }
        />
      </Routes>
    </ToastProvider>
  );
}

export default App;