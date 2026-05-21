import { useState } from "react";
import { MOCK_STUDENT, MOCK_NOTIFICATIONS } from "./data/mockData";
import { useToast } from "./utils/useToast";
import Sidebar from "./components/Sidebar";
import ToastContainer from "./components/ToastContainer";
import AuthPage from "./pages/AuthPage";
import AdminPortal from "./pages/admin/AdminPortal";
import Dashboard from "./pages/student/Dashboard";
import DriveBrowser from "./pages/student/DriveBrowser";
import MyApplications from "./pages/student/MyApplications";
import NotificationsPage from "./pages/student/NotificationsPage";
import SettingsPage from "./pages/student/SettingsPage";

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [student, setStudent] = useState(MOCK_STUDENT);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const { toasts, add: addToast } = useToast();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Mocking the old theme object with the new TPO Admin color palette 
  // so existing components don't break before they are migrated to Tailwind
  const s = {
    bg: '#f5f6f9',
    surface: '#ffffff',
    card: '#ffffff',
    border: '#d8dce6',
    accent: '#1e5fa8',
    accentHover: '#2d72c4',
    accentLight: '#eef3fb',
    text: '#1e2939',
    muted: '#8d97aa',
    success: '#1a6e3c',
    warning: '#7a4f00',
    error: '#8b1a1a',
    blue: '#1e5fa8',
    purple: '#b8902a',
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

  if (!user) {
    return (
      <>
        <style>{globalStyle}</style>
        <div className="bg-gray-50 min-h-screen">
          <AuthPage onLogin={setUser} theme={s} />
          <ToastContainer toasts={toasts} theme={s} />
        </div>
      </>
    );
  }

  if (user.role === "admin") {
    return (
      <>
        <style>{globalStyle}</style>
        <AdminPortal onLogout={() => setUser(null)} />
      </>
    );
  }

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard student={student} theme={s} setPage={setPage} />;
      case "drives":
        return <DriveBrowser student={student} theme={s} addToast={addToast} />;
      case "applications":
        return <MyApplications theme={s} />;
      case "notifications":
        return <NotificationsPage notifications={notifications} setNotifications={setNotifications} theme={s} />;
      case "settings":
        return <SettingsPage student={student} setStudent={setStudent} theme={s} addToast={addToast} />;
      default:
        return <Dashboard student={student} theme={s} setPage={setPage} />;
    }
  };

  return (
    <>
      <style>{globalStyle}</style>
      <div style={{ display: 'flex', background: '#f5f6f9', minHeight: '100vh', color: '#1e2939', fontFamily: 'IBM Plex Sans, Helvetica, Arial, sans-serif' }}>
        <Sidebar page={page} setPage={setPage} student={student} onLogout={() => setUser(null)} unread={unreadCount} />
        <main style={{ marginLeft: 248, flex: 1, minHeight: '100vh', overflowY: 'auto' }}>
          {renderPage()}
        </main>
      </div>
      <ToastContainer toasts={toasts} theme={s} />
    </>
  );
}