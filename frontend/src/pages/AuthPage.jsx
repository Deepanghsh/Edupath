import { useState } from "react";
import { MOCK_STUDENT } from "../data/mockData";

export default function AuthPage({ onLogin, theme }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ roll_no: "", full_name: "", email: "", password: "", branch: "CSE", year: "1st Year" });
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

  const s = theme;

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: 10,
    border: `1.5px solid ${s.border}`, background: s.surface,
    color: s.text, fontSize: 14, outline: "none", boxSizing: "border-box",
  };

  if (registered) {
    return (
      <div style={{ minHeight: "100vh", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 20, padding: 48, maxWidth: 420, textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: s.text, fontSize: 22, marginBottom: 12 }}>Registration Successful!</h2>
          <p style={{ color: s.muted, fontSize: 14, lineHeight: 1.7 }}>Your account is pending verification. The TPO admin will approve your profile soon.</p>
          <button onClick={() => { setMode("login"); setRegistered(false); }} style={{ marginTop: 24, padding: "12px 32px", borderRadius: 10, background: s.accent, color: "#fff", border: "none", cursor: "pointer", fontWeight: 700 }}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: s.bg, display: "flex", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Left Panel */}
      <div style={{
        flex: 1,
        background: `linear-gradient(145deg, ${s.accent}18 0%, ${s.purple}18 100%)`,
        borderRight: `1px solid ${s.border}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "60px 80px",
      }}>
        <div style={{ marginBottom: 52, textAlign: "center" }}>
          <div style={{ fontSize: 64, fontWeight: 900, color: s.accent, letterSpacing: -3, lineHeight: 1 }}>EduPath</div>
          <div style={{ fontSize: 13, color: s.muted, marginTop: 10, letterSpacing: 4, textTransform: "uppercase" }}>Placement Intelligence</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%", maxWidth: 360 }}>
          {[
            { icon: "🎯", title: "Track Readiness", desc: "Know exactly where you stand for placements" },
            { icon: "🏢", title: "Browse Drives", desc: "Find and apply to company drives instantly" },
            { icon: "📊", title: "Monitor Progress", desc: "Real-time application status updates" },
            { icon: "🔔", title: "Stay Notified", desc: "Never miss a drive or deadline" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: s.accentLight, border: `1px solid ${s.accent}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ color: s.text, fontWeight: 700, fontSize: 14 }}>{item.title}</div>
                <div style={{ color: s.muted, fontSize: 12, marginTop: 2 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 80px" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 36, background: s.surface, borderRadius: 12, padding: 5 }}>
            {[["login", "Student Login"], ["register", "Register"], ["admin", "Admin"]].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
                flex: 1, padding: "10px 0", borderRadius: 9, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 700,
                background: mode === m ? s.accent : "transparent",
                color: mode === m ? "#fff" : s.muted,
                transition: "all 0.2s",
              }}>{label}</button>
            ))}
          </div>

          <h2 style={{ color: s.text, fontSize: 28, fontWeight: 900, marginBottom: 6, letterSpacing: -0.5 }}>
            {mode === "admin" ? "Admin Login" : mode === "register" ? "Create Account" : "Welcome Back"}
          </h2>
          <p style={{ color: s.muted, fontSize: 14, marginBottom: 32 }}>
            {mode === "register" ? "Register to access placement drives" : "Sign in to your EduPath account"}
          </p>

          {error && (
            <div style={{ background: `${s.error}18`, border: `1px solid ${s.error}55`, color: s.error, padding: "12px 16px", borderRadius: 10, fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "register" && (
              <>
                <input placeholder="Roll Number (e.g. CSE2024001)" style={inputStyle} value={form.roll_no} onChange={e => setForm(p => ({ ...p, roll_no: e.target.value }))} />
                <input placeholder="Full Name" style={inputStyle} value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
                <div style={{ display: "flex", gap: 10 }}>
                  <select style={inputStyle} value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))}>{branches.map(b => <option key={b}>{b}</option>)}</select>
                  <select style={inputStyle} value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))}>{years.map(y => <option key={y}>{y}</option>)}</select>
                </div>
              </>
            )}
            <input type="email" placeholder={mode === "admin" ? "admin@college.edu" : "Email address"} style={inputStyle} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            <input type="password" placeholder="Password" style={inputStyle} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          </div>

          {mode === "login" && (
            <div style={{ textAlign: "right", marginTop: 10 }}>
              <span onClick={() => setShowForgot(true)} style={{ color: s.accent, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Forgot Password?</span>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={{
            width: "100%", marginTop: 24, padding: "14px", borderRadius: 12, border: "none",
            cursor: loading ? "not-allowed" : "pointer", background: s.accent, color: "#fff",
            fontSize: 16, fontWeight: 800, opacity: loading ? 0.7 : 1, transition: "all 0.2s",
          }}>
            {loading ? "Please wait..." : mode === "register" ? "Create Account" : "Sign In"}
          </button>

          <p style={{ color: s.muted, fontSize: 12, textAlign: "center", marginTop: 18 }}>
            {mode === "login" && "Demo: any email + any password logs you in as student"}
            {mode === "admin" && "Demo: admin@college.edu / admin123"}
          </p>
        </div>
      </div>

      {showForgot && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 18, padding: 36, width: 380 }}>
            <h3 style={{ color: s.text, marginBottom: 8, fontSize: 18, fontWeight: 800 }}>Reset Password</h3>
            <p style={{ color: s.muted, fontSize: 13, marginBottom: 20 }}>Enter your email to receive a reset link.</p>
            <input type="email" placeholder="Your email address" style={inputStyle} />
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={() => setShowForgot(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1px solid ${s.border}`, background: "transparent", color: s.muted, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
              <button onClick={() => setShowForgot(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: s.accent, color: "#fff", cursor: "pointer", fontWeight: 700 }}>Send Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}