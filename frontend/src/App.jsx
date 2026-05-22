import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useToast } from "./utils/useToast";
import api from "./utils/api";
import Sidebar from "./components/Sidebar";
import ToastContainer from "./components/ToastContainer";
import AuthPage from "./pages/AuthPage";

// Admin Pages
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminVerification from "./pages/admin/AdminVerification";
import AdminDrives from "./pages/admin/AdminDrives";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminReadiness from "./pages/admin/AdminReadiness";
import AdminSettings from "./pages/admin/AdminSettings";

// Student Pages
import Dashboard from "./pages/student/Dashboard";
import DriveBrowser from "./pages/student/DriveBrowser";
import MyApplications from "./pages/student/MyApplications";
import NotificationsPage from "./pages/student/NotificationsPage";
import SettingsPage from "./pages/student/SettingsPage";

export default function App() {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem("eduPathUser")); }
    catch { return null; }
  });
  const [student, setStudent] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toasts, add: addToast } = useToast();
  const navigate = useNavigate();

  const globalStyle = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'IBM Plex Sans', Helvetica, Arial, sans-serif; background: #f5f6f9; color: #1e2939; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #d8dce6; border-radius: 3px; }
    @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    input::placeholder { color: #8d97aa; }
    select option { background: #ffffff; color: #1e2939; }
  `;

  const s = {
    bg: '#f5f6f9', surface: '#ffffff', card: '#ffffff', border: '#d8dce6',
    accent: '#1e5fa8', accentHover: '#2d72c4', accentLight: '#eef3fb',
    text: '#1e2939', muted: '#8d97aa', success: '#1a6e3c',
    warning: '#7a4f00', error: '#8b1a1a', blue: '#1e5fa8', purple: '#b8902a',
  };

  // ── Fetch student profile from backend on mount / user change ─────────────
  useEffect(() => {
    if (user && user.role === "student" && localStorage.getItem("eduPathToken")) {
      api.get("/student/profile")
        .then(({ data }) => {
          setStudent(data);
          // Fetch unread notifications count
          return api.get("/student/notifications");
        })
        .then(({ data }) => {
          setUnreadCount(data.filter(n => !n.read).length);
        })
        .catch(() => {
          // Token expired — log out
          handleLogout();
        });
    }
  }, [user]);

  // ── Login handler — called by AuthPage ────────────────────────────────────
  const handleLogin = (userData) => {
    localStorage.setItem("eduPathUser", JSON.stringify(userData));
    setUser(userData);
    if (userData.role === "admin") {
      navigate("/admin/dashboard");
    } else {
      setStudent(userData);
      navigate("/student/dashboard");
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("eduPathToken");
    localStorage.removeItem("eduPathUser");
    setUser(null);
    setStudent(null);
    navigate("/");
  };

  if (!user) {
    return (
      <>
        <style>{globalStyle}</style>
        <Routes>
          <Route path="/" element={<AuthPage onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer toasts={toasts} theme={s} />
      </>
    );
  }

  if (user.role === "admin") {
    return (
      <>
        <style>{globalStyle}</style>
        <Routes>
          <Route path="/admin" element={<AdminLayout onLogout={handleLogout} addToast={addToast} user={user} />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"    element={<AdminDashboard />} />
            <Route path="verification" element={<AdminVerification addToast={addToast} />} />
            <Route path="drives"       element={<AdminDrives addToast={addToast} />} />
            <Route path="students"     element={<AdminStudents />} />
            <Route path="applications" element={<AdminApplications addToast={addToast} />} />
            <Route path="readiness"    element={<AdminReadiness />} />
            <Route path="settings"     element={<AdminSettings user={user} />} />
            <Route path="*"            element={<Navigate to="dashboard" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
        <ToastContainer toasts={toasts} theme={s} />
      </>
    );
  }

  // Student Portal
  return (
    <>
      <style>{globalStyle}</style>
      <div style={{ display: 'flex', background: '#f5f6f9', minHeight: '100vh', color: '#1e2939', fontFamily: 'IBM Plex Sans, Helvetica, Arial, sans-serif' }}>
        <Sidebar student={student || user} onLogout={handleLogout} unread={unreadCount} />
        <main style={{ marginLeft: 248, flex: 1, minHeight: '100vh', overflowY: 'auto' }}>
          <Routes>
            <Route path="/student/dashboard"     element={<Dashboard student={student || user} theme={s} />} />
            <Route path="/student/drives"        element={<DriveBrowser student={student || user} theme={s} addToast={addToast} />} />
            <Route path="/student/applications"  element={<MyApplications theme={s} />} />
            <Route path="/student/notifications" element={<NotificationsPage theme={s} setUnreadCount={setUnreadCount} />} />
            <Route path="/student/settings"      element={<SettingsPage student={student || user} setStudent={setStudent} theme={s} addToast={addToast} />} />
            <Route path="*"                      element={<Navigate to="/student/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      <ToastContainer toasts={toasts} theme={s} />
    </>
  );
}