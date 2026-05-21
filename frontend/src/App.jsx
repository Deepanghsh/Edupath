import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { MOCK_STUDENT, MOCK_NOTIFICATIONS } from "./data/mockData";
import { useToast } from "./utils/useToast";
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
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("eduPathUser");
    return saved ? JSON.parse(saved) : null;
  });
  const [student, setStudent] = useState(() => {
    const saved = localStorage.getItem("eduPathStudent");
    return saved ? JSON.parse(saved) : MOCK_STUDENT;
  });
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("eduPathNotifications");
    return saved ? JSON.parse(saved) : MOCK_NOTIFICATIONS;
  });
  const { toasts, add: addToast } = useToast();
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const s = {
    bg: '#f5f6f9', surface: '#ffffff', card: '#ffffff', border: '#d8dce6',
    accent: '#1e5fa8', accentHover: '#2d72c4', accentLight: '#eef3fb',
    text: '#1e2939', muted: '#8d97aa', success: '#1a6e3c',
    warning: '#7a4f00', error: '#8b1a1a', blue: '#1e5fa8', purple: '#b8902a',
  };

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

  const handleLogin = (userData) => {
    localStorage.setItem("eduPathUser", JSON.stringify(userData));
    setUser(userData);
    if (userData.role === "admin") {
      navigate("/admin/dashboard");
    } else {
      localStorage.setItem("eduPathStudent", JSON.stringify(userData));
      setStudent(userData);
      navigate("/student/dashboard");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("eduPathUser");
    localStorage.removeItem("eduPathStudent");
    // We intentionally don't clear notifications on logout for this demo, 
    // but in a real app you would clear them or scope them by user ID.
    setUser(null);
    navigate("/");
  };

  // Sync student state to local storage when updated (e.g. from SettingsPage)
  useEffect(() => {
    if (user && user.role === "student") {
      localStorage.setItem("eduPathStudent", JSON.stringify(student));
    }
  }, [student, user]);

  // Sync notifications to local storage when marked as read/unread
  useEffect(() => {
    localStorage.setItem("eduPathNotifications", JSON.stringify(notifications));
  }, [notifications]);

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
          <Route path="/admin" element={<AdminLayout onLogout={handleLogout} addToast={addToast} />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="verification" element={<AdminVerification />} />
            <Route path="drives" element={<AdminDrives />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="applications" element={<AdminApplications />} />
            <Route path="readiness" element={<AdminReadiness />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
        <ToastContainer toasts={toasts} theme={s} />
      </>
    );
  }

  // Student Portal Layout
  return (
    <>
      <style>{globalStyle}</style>
      <div style={{ display: 'flex', background: '#f5f6f9', minHeight: '100vh', color: '#1e2939', fontFamily: 'IBM Plex Sans, Helvetica, Arial, sans-serif' }}>
        <Sidebar student={student} onLogout={handleLogout} unread={unreadCount} />
        <main style={{ marginLeft: 248, flex: 1, minHeight: '100vh', overflowY: 'auto' }}>
          <Routes>
            <Route path="/student/dashboard" element={<Dashboard student={student} theme={s} />} />
            <Route path="/student/drives" element={<DriveBrowser student={student} theme={s} addToast={addToast} />} />
            <Route path="/student/applications" element={<MyApplications theme={s} />} />
            <Route path="/student/notifications" element={<NotificationsPage notifications={notifications} setNotifications={setNotifications} theme={s} />} />
            <Route path="/student/settings" element={<SettingsPage student={student} setStudent={setStudent} theme={s} addToast={addToast} />} />
            <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      <ToastContainer toasts={toasts} theme={s} />
    </>
  );
}