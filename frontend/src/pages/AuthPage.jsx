import { useState, useEffect, useRef } from "react";
import { GoogleLogin } from "@react-oauth/google";
import api from "../utils/api";
import { C } from "../components/admin/ui";

export default function AuthPage({ onLogin }) {
  const [mode, setMode]         = useState("login");
  const [form, setForm]         = useState({ roll_no: "", full_name: "", email: "", password: "", branch: "CSE", year: "1st Year" });
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgot, setShowForgot]       = useState(false);
  const [registered, setRegistered]       = useState(false);
  const [forgotEmail, setForgotEmail]     = useState("");
  const [forgotSent, setForgotSent]       = useState(false);
  const [showPass, setShowPass]           = useState(false);
  const errorTimer = useRef(null);

  const branches = ["CSE", "ECE", "ME", "CE", "IT", "EEE"];
  const years    = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  // Keep error visible for 6 seconds then fade
  const showError = (msg) => {
    setError(msg);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(""), 6000);
  };

  useEffect(() => () => { if (errorTimer.current) clearTimeout(errorTimer.current); }, []);

  // ── Email/Password Login ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError("");
    if (mode !== "register" && (!form.email || !form.password)) {
      showError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "admin") {
        const { data } = await api.post("/auth/admin/login", { email: form.email, password: form.password });
        localStorage.setItem("eduPathToken", data.token);
        onLogin({ ...data.user, role: "admin" });

      } else if (mode === "register") {
        if (!form.roll_no || !form.full_name || !form.email || !form.password) {
          showError("All fields are required for registration.");
          setLoading(false);
          return;
        }
        await api.post("/auth/student/register", {
          roll_no: form.roll_no, full_name: form.full_name,
          email: form.email, password: form.password,
          branch: form.branch, year: form.year,
        });
        setRegistered(true);

      } else {
        const { data } = await api.post("/auth/student/login", { email: form.email, password: form.password });
        localStorage.setItem("eduPathToken", data.token);
        onLogin({ ...data.user, role: "student" });
      }
    } catch (err) {
      showError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth — using GoogleLogin component (gives real credential ID token) ──
  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      showError("Google sign-in did not return a valid token. Please try again.");
      return;
    }
    setGoogleLoading(true);
    try {
      const intended_role = mode === "admin" ? "admin" : "student";
      const { data } = await api.post("/auth/google", {
        credential:    credentialResponse.credential,
        intended_role,
      });
      localStorage.setItem("eduPathToken", data.token);
      onLogin({ ...data.user, role: data.user.role });
    } catch (err) {
      showError(err.response?.data?.message || "Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    showError("Google sign-in was cancelled or failed. Please try email login instead.");
  };

  // ── Forgot Password ─────────────────────────────────────────────────────────
  const handleForgot = async () => {
    if (!forgotEmail) return;
    try {
      await api.post("/auth/reset-password", { email: forgotEmail });
      setForgotSent(true);
    } catch { setForgotSent(true); } // show sent regardless
  };

  const inp = "w-full px-3.5 py-2.5 rounded border border-gray-300 bg-white text-gray-800 text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans";

  // ── Registration Success ────────────────────────────────────────────────────
  if (registered) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans p-6">
        <div className="bg-white border border-gray-200 p-10 max-w-[420px] w-full text-center shadow-sm rounded-lg">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-[#0d1b3e] text-xl font-bold mb-3">Registration Submitted</h2>
          <p className="text-gray-500 text-[13px] leading-relaxed">
            Your account is pending verification by the TPO admin. You'll be able to apply for drives once approved.
          </p>
          <button onClick={() => { setMode("login"); setRegistered(false); setForm({ roll_no: "", full_name: "", email: "", password: "", branch: "CSE", year: "1st Year" }); }}
            className="mt-6 px-6 py-2.5 rounded font-semibold text-[13px] text-white cursor-pointer border-none transition-all hover:opacity-90"
            style={{ background: C.accent }}>
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">

      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-12 md:p-20 text-white"
        style={{ background: C.navy }}>
        <div className="mb-12 text-center">
          <div className="text-5xl md:text-6xl font-extrabold text-white tracking-tighter leading-none">EduPath</div>
          <div className="text-[10px] md:text-[11px] mt-2.5 tracking-widest uppercase font-semibold" style={{ color: C.gold }}>
            Placement Intelligence Portal
          </div>
        </div>
        <div className="flex flex-col gap-6 w-full max-w-[360px]">
          {[
            { icon: "◈", title: "Readiness Analytics",  desc: "Data-driven insights for student placement readiness." },
            { icon: "⚑", title: "Drive Management",     desc: "End-to-end recruitment drive orchestration." },
            { icon: "✔", title: "Verified Profiles",    desc: "Maker-checker document verification workflows." },
            { icon: "≡", title: "Real-time Tracking",   desc: "Live application status and stage monitoring." },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4 group cursor-default">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 transition-all group-hover:scale-110"
                style={{ background: '#162347', border: `1px solid #1e3163`, color: C.gold }}>
                {item.icon}
              </div>
              <div className="transition-all group-hover:translate-x-1">
                <div className="text-white font-semibold text-[13px]">{item.title}</div>
                <div className="text-[11.5px] mt-0.5 opacity-60 leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 bg-white">
        <div className="w-full max-w-[400px]">

          {/* Mode Tabs */}
          <div className="flex mb-8 border-b border-gray-200">
            {[["login", "Student"], ["register", "Register"], ["admin", "Admin"]].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(""); setForm({ roll_no: "", full_name: "", email: "", password: "", branch: "CSE", year: "1st Year" }); }}
                className="flex-1 py-3 border-none cursor-pointer text-[12.5px] font-semibold transition-all hover:bg-gray-50"
                style={{ color: mode === m ? C.navy : "#8d97aa", borderBottom: `2px solid ${mode === m ? C.navy : "transparent"}`, background: "transparent" }}>
                {label}
              </button>
            ))}
          </div>

          <h2 className="text-2xl font-bold mb-1 tracking-tight" style={{ color: C.navy }}>
            {mode === "admin" ? "Admin Portal" : mode === "register" ? "Create Account" : "Student Login"}
          </h2>
          <p className="text-gray-400 text-[12.5px] mb-5">
            {mode === "register" ? "Register to access placement drives and tracking." : "Enter your credentials to continue."}
          </p>

          {/* ── ERROR BOX — stays for 6 seconds ── */}
          <div
            className="overflow-hidden transition-all duration-300"
            style={{ maxHeight: error ? "80px" : "0px", marginBottom: error ? "16px" : "0px", opacity: error ? 1 : 0 }}>
            <div className="bg-[#fceaea] border border-[#e8b4b4] text-[#b03030] px-3.5 py-2.5 text-[12.5px] flex items-start gap-2 rounded">
              <span className="font-extrabold mt-0.5 shrink-0">✕</span>
              <span>{error}</span>
            </div>
          </div>

          {/* ── GOOGLE LOGIN — only for login and admin tabs ── */}
          {mode !== "register" && (
            <div className="mb-4">
              {googleLoading ? (
                <div className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 rounded text-[13px] text-gray-400 bg-gray-50">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                  Signing in with Google...
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  width="100%"
                  text={mode === "admin" ? "signin_with" : "signin_with"}
                  shape="rectangular"
                  theme="outline"
                  size="large"
                  logo_alignment="left"
                />
              )}
            </div>
          )}

          {/* Divider */}
          {mode !== "register" && (
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] text-gray-400 font-medium">or continue with email</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          )}

          {/* ── FORM FIELDS ── */}
          <div className="flex flex-col gap-3">
            {mode === "register" && (
              <>
                <input placeholder="Full Name *" className={inp} value={form.full_name}
                  onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
                <input placeholder="Roll Number (e.g. 24B-CO-027) *" className={inp} value={form.roll_no}
                  onChange={e => setForm(p => ({ ...p, roll_no: e.target.value }))} />
                <div className="flex gap-2">
                  <select className={inp} value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))}>
                    {branches.map(b => <option key={b}>{b}</option>)}
                  </select>
                  <select className={inp} value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))}>
                    {years.map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </>
            )}

            <input type="email"
              placeholder={mode === "admin" ? "Admin email address" : "Email address"}
              className={inp}
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />

            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Password"
                className={inp + " pr-10"}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleSubmit()} />
              <button type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent text-xs">
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          {(mode === "login" || mode === "admin") && (
            <div className="text-right mt-2">
              <button onClick={() => setShowForgot(true)}
                className="text-[11.5px] font-semibold cursor-pointer hover:underline border-none bg-transparent"
                style={{ color: C.accent }}>
                Forgot Password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full mt-5 p-3 rounded border-none font-semibold text-[14px] text-white cursor-pointer transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: C.accent }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                Please wait...
              </span>
            ) : (
              mode === "register" ? "Submit Registration" : "Sign In"
            )}
          </button>

          {/* Demo hint */}
          <div className="mt-5 text-center">
            <p className="text-gray-400 text-[11px]">
              {mode === "login"    && "Demo: arjun.das@college.edu / student123"}
              {mode === "admin"    && "Demo: admin@college.edu / admin123"}
              {mode === "register" && "All fields marked * are required"}
            </p>
          </div>
        </div>
      </div>

      {/* ── FORGOT PASSWORD MODAL ───────────────────────────────────────────── */}
      {showForgot && (
        <div className="fixed inset-0 bg-[#0d1b3e]/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setShowForgot(false)}>
          <div className="bg-white p-8 w-full max-w-[340px] shadow-2xl rounded-lg" style={{ borderTop: `4px solid ${C.accent}` }}>
            {forgotSent ? (
              <div className="text-center">
                <div className="text-4xl mb-3">📬</div>
                <h3 className="text-[#0d1b3e] text-base font-bold mb-2">Email Sent</h3>
                <p className="text-gray-500 text-xs mb-5">If this email is registered, a reset link has been sent to your inbox.</p>
                <button onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(""); }}
                  className="w-full py-2 border-none text-white cursor-pointer font-semibold text-sm rounded"
                  style={{ background: C.accent }}>Close</button>
              </div>
            ) : (
              <>
                <h3 className="text-[#0d1b3e] text-base font-bold mb-1">Reset Password</h3>
                <p className="text-gray-400 text-xs mb-4">Enter your registered email to receive a reset link.</p>
                <input type="email" placeholder="Your email address" className={inp}
                  value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleForgot()} />
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setShowForgot(false)}
                    className="flex-1 py-2 border border-gray-200 bg-white text-gray-600 cursor-pointer font-semibold text-xs rounded hover:bg-gray-50">
                    Cancel
                  </button>
                  <button onClick={handleForgot} disabled={!forgotEmail}
                    className="flex-1 py-2 border-none text-white cursor-pointer font-semibold text-xs rounded disabled:opacity-50"
                    style={{ background: C.accent }}>
                    Send Reset Link
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}