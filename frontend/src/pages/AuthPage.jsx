import { useState } from "react";
import { MOCK_STUDENT } from "../data/mockData";
import { C } from "../components/admin/ui";

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ roll_no: "", full_name: "", email: "", password: "", branch: "CSE", year: "1st Year", role: "student" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [registered, setRegistered] = useState(false);

  const branches = ["CSE", "ECE", "ME", "CE", "IT", "EEE"];
  const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  const handleSubmit = () => {
    setError("");
    if (!form.email || !form.password) { setError("Please fill all required fields."); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (mode === "admin") {
        if (form.email === "admin@college.edu" && form.password === "admin123") {
          onLogin({ role: "admin", name: "TPO Admin" });
        } else {
          setError("Invalid credentials. Try admin@college.edu / admin123");
        }
      } else if (mode === "register") {
        setRegistered(true);
      } else {
        onLogin({ role: "student", ...MOCK_STUDENT });
      }
    }, 1000);
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 4,
    border: `1px solid ${C.gray200}`, background: '#fff',
    color: C.gray800, fontSize: 13, outline: "none", boxSizing: "border-box",
    fontFamily: 'IBM Plex Sans, sans-serif'
  };

  const btnStyle = {
    width: "100%", padding: "12px", borderRadius: 4, border: "none",
    cursor: loading ? "not-allowed" : "pointer", background: C.accent, color: "#fff",
    fontSize: 14, fontWeight: 600, opacity: loading ? 0.7 : 1, transition: "all 0.2s",
    fontFamily: 'IBM Plex Sans, sans-serif', letterSpacing: '0.3px'
  };

  if (registered) {
    return (
      <div style={{ minHeight: "100vh", background: C.gray50, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: 'IBM Plex Sans, sans-serif' }}>
        <div style={{ background: '#fff', border: `1px solid ${C.gray200}`, padding: 48, maxWidth: 420, textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: C.navy, fontSize: 20, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.3px' }}>Registration Submitted</h2>
          <p style={{ color: C.gray600, fontSize: 13, lineHeight: 1.6 }}>Your account has been created and is pending verification. The TPO admin will review and approve your profile.</p>
          <button onClick={() => { setMode("login"); setRegistered(false); }} style={{ ...btnStyle, marginTop: 24, width: 'auto', padding: '10px 24px' }}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.gray50, display: "flex", fontFamily: 'IBM Plex Sans, sans-serif' }}>

      {/* Left Panel - Navy Theme */}
      <div style={{
        flex: 1,
        background: C.navy,
        borderRight: `1px solid ${C.navyLight}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "60px 80px", color: '#fff'
      }}>
        <div style={{ marginBottom: 52, textAlign: "center" }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: '#fff', letterSpacing: '-2px', lineHeight: 1 }}>EduPath</div>
          <div style={{ fontSize: 11, color: C.gold, marginTop: 10, letterSpacing: '3px', textTransform: "uppercase", fontWeight: 600 }}>Placement Intelligence Portal</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%", maxWidth: 360 }}>
          {[
            { icon: "◈", title: "Readiness Analytics", desc: "Data-driven insights for student placement readiness." },
            { icon: "⚑", title: "Drive Management", desc: "End-to-end recruitment drive orchestration." },
            { icon: "✔", title: "Verified Profiles", desc: "Maker-checker document verification workflows." },
            { icon: "≡", title: "Real-time Tracking", desc: "Live application status and stage monitoring." },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.navyLight, border: `1px solid ${C.navyMid}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, color: C.gold }}>
                {item.icon}
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, letterSpacing: '0.2px' }}>{item.title}</div>
                <div style={{ color: C.gray400, fontSize: 11.5, marginTop: 3, lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 80px", background: '#fff' }}>
        <div style={{ width: "100%", maxWidth: 380 }}>

          {/* Tabs */}
          <div style={{ display: "flex", marginBottom: 36, borderBottom: `1px solid ${C.gray200}` }}>
            {[["login", "Student"], ["register", "Register"], ["admin", "Admin"]].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
                flex: 1, padding: "12px 0", border: "none", cursor: "pointer",
                fontSize: 12.5, fontWeight: 600, fontFamily: 'IBM Plex Sans, sans-serif',
                background: "transparent",
                color: mode === m ? C.navy : C.gray400,
                borderBottom: `2px solid ${mode === m ? C.navy : 'transparent'}`,
                transition: "all 0.2s",
              }}>{label}</button>
            ))}
          </div>

          <h2 style={{ color: C.navy, fontSize: 24, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.5px' }}>
            {mode === "admin" ? "Admin Portal" : mode === "register" ? "Create Account" : "Student Login"}
          </h2>
          <p style={{ color: C.gray400, fontSize: 12.5, marginBottom: 28 }}>
            {mode === "register" ? "Register to access placement drives and tracking." : "Enter your credentials to access the portal."}
          </p>

          {error && (
            <div style={{ background: C.dangerBg, border: `1px solid #e8b4b4`, color: C.danger, padding: "10px 14px", fontSize: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800 }}>!</span> {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "register" && (
              <>
                <select style={inputStyle} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="student">Role: Student</option>
                  <option value="admin">Role: Admin / Placement Officer</option>
                </select>
                <input placeholder="Full Name" style={inputStyle} value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
                {form.role === "student" && (
                  <>
                    <input placeholder="Roll Number (e.g. 24B-CO-001)" style={inputStyle} value={form.roll_no} onChange={e => setForm(p => ({ ...p, roll_no: e.target.value }))} />
                    <div style={{ display: "flex", gap: 10 }}>
                      <select style={inputStyle} value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))}>{branches.map(b => <option key={b}>{b}</option>)}</select>
                      <select style={inputStyle} value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))}>{years.map(y => <option key={y}>{y}</option>)}</select>
                    </div>
                  </>
                )}
              </>
            )}
            <input type="email" placeholder={mode === "admin" ? "Email (admin@college.edu)" : "Email address"} style={inputStyle} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            <input type="password" placeholder="Password" style={inputStyle} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          </div>

          {mode === "login" && (
            <div style={{ textAlign: "right", marginTop: 10 }}>
              <span onClick={() => setShowForgot(true)} style={{ color: C.accent, fontSize: 11.5, cursor: "pointer", fontWeight: 600 }}>Forgot Password?</span>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={{ ...btnStyle, marginTop: 24 }}>
            {loading ? "Authenticating..." : mode === "register" ? "Submit Registration" : "Sign In"}
          </button>

          <div style={{ borderTop: `1px solid ${C.gray100}`, marginTop: 24, paddingTop: 16, textAlign: 'center' }}>
            <p style={{ color: C.gray400, fontSize: 11 }}>
              {mode === "login" && "Demo: any email + any password logs you in as student"}
              {mode === "admin" && "Demo: admin@college.edu / admin123"}
            </p>
          </div>
        </div>
      </div>

      {showForgot && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13, 27, 62, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: '#fff', padding: 32, width: 340, borderTop: `4px solid ${C.accent}` }}>
            <h3 style={{ color: C.navy, marginBottom: 8, fontSize: 16, fontWeight: 700 }}>Reset Password</h3>
            <p style={{ color: C.gray400, fontSize: 12, marginBottom: 20 }}>Enter your email to receive a reset link.</p>
            <input type="email" placeholder="Your email address" style={inputStyle} />
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button onClick={() => setShowForgot(false)} style={{ flex: 1, padding: "9px", border: `1px solid ${C.gray200}`, background: "#fff", color: C.gray600, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>Cancel</button>
              <button onClick={() => setShowForgot(false)} style={{ flex: 1, padding: "9px", border: "none", background: C.accent, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>Send Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}