import { useState } from "react";
import { THEMES } from "../data/themes";
import ToggleSwitch from "../components/ToggleSwitch";

export default function SettingsPage({ student, setStudent, themeKey, setThemeKey, theme, addToast }) {
  const s = theme;
  const [form, setForm] = useState({ full_name: student.full_name, email: student.email, branch: student.branch, year: student.year });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });

  const inputStyle = {
    padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${s.border}`,
    background: s.bg, color: s.text, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
  };

  const handleSaveInfo = () => {
    setStudent(p => ({ ...p, ...form }));
    addToast("Account information updated!", "success");
  };

  const handleChangePass = () => {
    if (!passwords.current || !passwords.newPass || !passwords.confirm) { addToast("Fill all password fields.", "error"); return; }
    if (passwords.newPass !== passwords.confirm) { addToast("Passwords do not match.", "error"); return; }
    setPasswords({ current: "", newPass: "", confirm: "" });
    addToast("Password changed successfully!", "success");
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: "100%" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: s.text, fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>Settings</h1>
        <p style={{ color: s.muted, fontSize: 13, marginTop: 5 }}>Manage your account, preferences, and appearance.</p>
      </div>

      {/* Theme Section — full width */}
      <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 16, padding: 28, marginBottom: 24 }}>
        <div style={{ color: s.text, fontWeight: 700, fontSize: 16, marginBottom: 6 }}>🎨 Theme & Appearance</div>
        <p style={{ color: s.muted, fontSize: 13, marginBottom: 22 }}>Choose your preferred color theme.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
          {Object.entries(THEMES).map(([key, t]) => (
            <button key={key} onClick={() => { setThemeKey(key); addToast(`Theme changed to ${t.name}!`, "success"); }} style={{
              padding: "16px 12px", borderRadius: 14,
              border: `2px solid ${themeKey === key ? t.accent : s.border}`,
              background: themeKey === key ? t.accent + "20" : s.surface,
              cursor: "pointer", textAlign: "center", transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 10 }}>
                {[t.bg, t.accent, t.text].map((c, i) => (
                  <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: c, border: `1px solid ${s.border}` }} />
                ))}
              </div>
              <div style={{ color: themeKey === key ? t.accent : s.muted, fontSize: 11, fontWeight: 700 }}>{t.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Two column: Account Info + Password */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>

        {/* Account Info */}
        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 16, padding: 28 }}>
          <div style={{ color: s.text, fontWeight: 700, fontSize: 16, marginBottom: 22 }}>👤 Account Information</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 22 }}>
            <div>
              <label style={{ color: s.muted, fontSize: 12, display: "block", marginBottom: 7 }}>Full Name</label>
              <input style={inputStyle} value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div>
              <label style={{ color: s.muted, fontSize: 12, display: "block", marginBottom: 7 }}>Email</label>
              <input style={inputStyle} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ color: s.muted, fontSize: 12, display: "block", marginBottom: 7 }}>Branch</label>
                <select style={inputStyle} value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))}>
                  {["CSE", "ECE", "ME", "CE", "IT", "EEE"].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: s.muted, fontSize: 12, display: "block", marginBottom: 7 }}>Year</label>
                <select style={inputStyle} value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))}>
                  {["1st Year", "2nd Year", "3rd Year", "4th Year"].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
          <button onClick={handleSaveInfo} style={{ padding: "11px 26px", borderRadius: 10, border: "none", background: s.accent, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
            Save Changes
          </button>
        </div>

        {/* Password */}
        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 16, padding: 28 }}>
          <div style={{ color: s.text, fontWeight: 700, fontSize: 16, marginBottom: 22 }}>🔒 Change Password</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 22 }}>
            <div>
              <label style={{ color: s.muted, fontSize: 12, display: "block", marginBottom: 7 }}>Current Password</label>
              <input type="password" style={inputStyle} value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} />
            </div>
            <div>
              <label style={{ color: s.muted, fontSize: 12, display: "block", marginBottom: 7 }}>New Password</label>
              <input type="password" style={inputStyle} value={passwords.newPass} onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} />
            </div>
            <div>
              <label style={{ color: s.muted, fontSize: 12, display: "block", marginBottom: 7 }}>Confirm New Password</label>
              <input type="password" style={inputStyle} value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} />
            </div>
          </div>
          <button onClick={handleChangePass} style={{ padding: "11px 26px", borderRadius: 10, border: "none", background: s.accent, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
            Update Password
          </button>
        </div>
      </div>

      {/* Notification Preferences — full width */}
      <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 16, padding: 28 }}>
        <div style={{ color: s.text, fontWeight: 700, fontSize: 16, marginBottom: 22 }}>🔔 Notification Preferences</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          {[
            { label: "Drive Alerts", desc: "Get notified when new drives are posted", def: true },
            { label: "Shortlisting Updates", desc: "Know when your status changes", def: true },
            { label: "Mentor Notifications", desc: "Receive mentor assignment alerts", def: false },
            { label: "System Updates", desc: "Platform and policy announcements", def: true },
          ].map((pref, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 20px",
              borderBottom: i < 2 ? `1px solid ${s.border}` : "none",
              borderRight: i % 2 === 0 ? `1px solid ${s.border}` : "none",
            }}>
              <div>
                <div style={{ color: s.text, fontSize: 14, fontWeight: 600 }}>{pref.label}</div>
                <div style={{ color: s.muted, fontSize: 12, marginTop: 3 }}>{pref.desc}</div>
              </div>
              <ToggleSwitch def={pref.def} theme={s} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}