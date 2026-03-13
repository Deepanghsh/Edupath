import { useState } from "react";
import { THEMES } from "./data/themes";
import { MOCK_STUDENT, MOCK_NOTIFICATIONS } from "./data/mockData";
import { useToast } from "./utils/useToast";
import Sidebar from "./components/Sidebar";
import ToastContainer from "./components/ToastContainer";
import AuthPage from "./pages/AuthPage";
import AdminPortal from "./pages/AdminPortal";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import DriveBrowser from "./pages/DriveBrowser";
import MyApplications from "./pages/MyApplications";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  const [themeKey, setThemeKey] = useState("default");
  const theme = THEMES[themeKey];
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [student, setStudent] = useState(MOCK_STUDENT);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const { toasts, add: addToast } = useToast();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const s = theme;

  const globalStyle = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${s.border}; border-radius: 3px; }
    @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    input::placeholder { color: ${s.muted}; }
    select option { background: ${s.surface}; color: ${s.text}; }
  `;

  if (!user) {
    return (
      <>
        <style>{globalStyle}</style>
        <div style={{ background: s.bg, minHeight: "100vh" }}>
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
        <AdminPortal onLogout={() => setUser(null)} theme={s} />
      </>
    );
  }

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard student={student} theme={s} setPage={setPage} />;
      case "profile":
        return <ProfilePage student={student} setStudent={setStudent} theme={s} addToast={addToast} />;
      case "drives":
        return <DriveBrowser student={student} theme={s} addToast={addToast} />;
      case "applications":
        return <MyApplications theme={s} />;
      case "notifications":
        return <NotificationsPage notifications={notifications} setNotifications={setNotifications} theme={s} />;
      case "settings":
        return <SettingsPage student={student} setStudent={setStudent} themeKey={themeKey} setThemeKey={setThemeKey} theme={s} addToast={addToast} />;
      default:
        return <Dashboard student={student} theme={s} setPage={setPage} />;
    }
  };

  return (
    <>
      <style>{globalStyle}</style>
      <div style={{ display: "flex", background: s.bg, minHeight: "100vh", color: s.text }}>
        <Sidebar page={page} setPage={setPage} student={student} theme={s} onLogout={() => setUser(null)} unread={unreadCount} />
        <main style={{ marginLeft: 240, flex: 1, minHeight: "100vh", overflowY: "auto" }}>
          {renderPage()}
        </main>
      </div>
      <ToastContainer toasts={toasts} theme={s} />
    </>
  );
}