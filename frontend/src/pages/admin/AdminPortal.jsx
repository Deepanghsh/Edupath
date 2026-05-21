import { useState, useEffect } from "react";
import DashboardTab from "../../components/admin/DashboardTab";
import VerificationTab from "../../components/admin/VerificationTab";
import DrivesTab from "../../components/admin/DrivesTab";
import StudentsTab from "../../components/admin/StudentsTab";
import ApplicationsTab from "../../components/admin/ApplicationsTab";
import ReadinessTab from "../../components/admin/ReadinessTab";
import AdminSettingsTab from "../../components/admin/AdminSettingsTab";

const TABS = {
  dashboard:    { label: "Dashboard Overview",       icon: "▦" },
  verification: { label: "Document Verification",    icon: "✔" },
  drives:       { label: "Manage Company Drives",    icon: "⚑" },
  students:     { label: "Student Directory",        icon: "◫" },
  applications: { label: "Applications Tracker",     icon: "≡" },
  readiness:    { label: "Readiness Analytics",      icon: "◈" },
};

export default function AdminPortal({ onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(
        d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
          "  " +
          d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="font-sans text-[13.5px] text-gray-800 min-h-screen" style={{ background: '#f5f6f9' }}>

      {/* ── TOP HEADER ─────────────────────────────────── */}
      <header style={{ background: '#0d1b3e', borderBottom: '2px solid #b8902a' }}
        className="fixed top-0 left-0 right-0 h-[52px] flex items-center justify-between pr-5 z-50">

        {/* Logo block */}
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}
          className="flex items-center w-[248px] px-4 h-full gap-2.5 shrink-0">
          <div style={{ background: '#b8902a', color: '#0d1b3e' }}
            className="w-8 h-8 flex items-center justify-center font-mono font-bold text-xs shrink-0">
            EPI
          </div>
          <div>
            <div className="text-[13px] font-bold text-white tracking-[0.2px] leading-tight">EduPath Intelligence</div>
            <div className="text-[9px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Placement Management Portal
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="text-right leading-relaxed text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <strong className="text-[11.5px] font-medium block" style={{ color: 'rgba(255,255,255,0.7)' }}>Goa College of Engineering</strong>
            Training &amp; Placement Office
          </div>

          <div style={{ border: '1px solid rgba(255,255,255,0.12)' }}
            className="flex items-center gap-2 px-2.5 py-1.5">
            <div style={{ background: '#1e5fa8' }}
              className="w-7 h-7 flex items-center justify-center text-[10px] font-bold text-white">TP</div>
            <div>
              <div className="text-[11.5px] font-medium text-white">TPO Admin</div>
              <div className="text-[9.5px] tracking-[0.3px]" style={{ color: 'rgba(255,255,255,0.4)' }}>PLACEMENT OFFICER</div>
            </div>
          </div>

          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
            className="font-mono text-[11px] pl-4 tracking-[0.5px]">
            {time}
          </div>

          <button onClick={onLogout}
            className="text-xs ml-1 px-3 py-1.5 transition-colors"
            style={{ color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.12)' }}
            onMouseOver={e => e.currentTarget.style.color = '#fff'}
            onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}>
            ← Logout
          </button>
        </div>
      </header>

      {/* ── BODY ───────────────────────────────────────── */}
      <div className="flex" style={{ paddingTop: 52, minHeight: '100vh' }}>

        {/* SIDEBAR */}
        <nav style={{ background: '#142040', borderRight: '1px solid rgba(255,255,255,0.07)', width: 248 }}
          className="fixed top-[52px] left-0 bottom-0 overflow-y-auto flex flex-col">

          <div className="text-[9px] tracking-[1.5px] uppercase font-semibold px-4 pt-5 pb-2"
            style={{ color: 'rgba(255,255,255,0.3)' }}>
            Main Navigation
          </div>

          {Object.entries(TABS).map(([key, { label, icon }]) => {
            const active = activeTab === key;
            return (
              <div key={key} onClick={() => setActiveTab(key)}
                className="flex items-center gap-3 px-4 py-[9px] cursor-pointer select-none text-[12.5px] transition-all"
                style={{
                  borderLeft: `3px solid ${active ? '#b8902a' : 'transparent'}`,
                  background: active ? 'rgba(30,95,168,0.22)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.52)',
                  fontWeight: active ? 500 : 400,
                }}>
                <span className="text-[13px] w-4 text-center opacity-70">{icon}</span>
                {label}
              </div>
            );
          })}

          <hr style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />

          <div className="text-[9px] tracking-[1.5px] uppercase font-semibold px-4 pt-2 pb-2"
            style={{ color: 'rgba(255,255,255,0.3)' }}>
            System
          </div>
          <div onClick={() => setActiveTab('settings')}
            className="flex items-center gap-3 px-4 py-[9px] cursor-pointer select-none text-[12.5px] transition-all"
            style={{
              borderLeft: `3px solid ${activeTab === 'settings' ? '#b8902a' : 'transparent'}`,
              background: activeTab === 'settings' ? 'rgba(30,95,168,0.22)' : 'transparent',
              color: activeTab === 'settings' ? '#fff' : 'rgba(255,255,255,0.52)',
              fontWeight: activeTab === 'settings' ? 500 : 400,
            }}>
            <span className="text-[13px] w-4 text-center opacity-70">⚙</span>
            Settings
          </div>

          {/* Footer */}
          <div className="mt-auto px-4 py-3 text-[9.5px] leading-relaxed"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.28)' }}>
            <strong className="block mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>EduPath Intelligence v1.0</strong>
            Academic Year 2025–26<br />
            React + Vite · Tailwind CSS
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col" style={{ marginLeft: 248 }}>

          {/* Breadcrumb bar */}
          <div className="bg-white flex items-center justify-between px-6 py-2.5 sticky top-[52px] z-40"
            style={{ borderBottom: '1px solid #d8dce6' }}>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span>EPI Portal</span>
              <span className="text-gray-300 mx-1">›</span>
              <span className="text-gray-800 font-medium">{TABS[activeTab]?.label || "Settings"}</span>
            </div>
            <div className="font-mono text-[10px] tracking-[0.3px] text-gray-400">
              SESSION: TPO-ADM-001 &nbsp;|&nbsp; AY 2025-26
            </div>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {activeTab === "dashboard"    && <DashboardTab />}
            {activeTab === "verification" && <VerificationTab />}
            {activeTab === "drives"       && <DrivesTab />}
            {activeTab === "students"     && <StudentsTab />}
            {activeTab === "applications" && <ApplicationsTab />}
            {activeTab === "readiness"    && <ReadinessTab />}
            {activeTab === "settings"     && <AdminSettingsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
