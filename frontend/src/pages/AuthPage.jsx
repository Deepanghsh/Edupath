import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import api from "../utils/api";
import { C } from "../components/admin/ui";

export default function AuthPage({ onLogin }) {
  const [mode, setMode]       = useState("login");
  const [form, setForm]       = useState({ roll_no: "", full_name: "", email: "", password: "", branch: "CSE", year: "1st Year", role: "student" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const branches = ["CSE", "ECE", "ME", "CE", "IT", "EEE"];
  const years    = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  // ── Real API Submit ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError("");
    if (!form.email || !form.password) { setError("Please fill all required fields."); return; }
    setLoading(true);

    try {
      if (mode === "admin") {
        const { data } = await api.post("/auth/admin/login", { email: form.email, password: form.password });
        localStorage.setItem("eduPathToken", data.token);
        onLogin({ ...data.user, role: "admin" });

      } else if (mode === "register") {
        if (!form.roll_no || !form.full_name) { setError("Fill all fields including Roll No and Name."); setLoading(false); return; }
        await api.post("/auth/student/register", {
          roll_no: form.roll_no, full_name: form.full_name,
          email: form.email, password: form.password,
          branch: form.branch, year: form.year,
        });
        setRegistered(true);

      } else {
        // Student login
        const { data } = await api.post("/auth/student/login", { email: form.email, password: form.password });
        localStorage.setItem("eduPathToken", data.token);
        onLogin({ ...data.user, role: "student" });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth ───────────────────────────────────────────────────────────
  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
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
      setError(err.response?.data?.message || "Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError:   () => setError("Google sign-in was cancelled or failed."),
    flow:      "implicit",
  });

  // ── Forgot Password ────────────────────────────────────────────────────────
  const handleForgot = async () => {
    if (!forgotEmail) return;
    try {
      await api.post("/auth/reset-password", { email: forgotEmail });
      setForgotSent(true);
    } catch {}
  };

  const inputClasses = "w-full px-3.5 py-2.5 rounded border border-gray-300 bg-white text-gray-800 text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans";
  const btnClasses   = `w-full p-3 rounded border-none font-semibold text-[14px] text-white transition-all duration-300 hover:scale-[1.02] active:scale-95 ${loading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`;

  if (registered) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans p-6">
        <div className="bg-white border border-gray-300 p-8 md:p-12 max-w-[420px] w-full text-center shadow-sm rounded-md">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-[#0d1b3e] text-xl font-bold mb-3 tracking-tight">Registration Submitted</h2>
          <p className="text-gray-500 text-[13px] leading-relaxed">
            Your account has been created and is pending verification. The TPO admin will review and approve your profile.
          </p>
          <button onClick={() => { setMode("login"); setRegistered(false); }}
            className="mt-6 px-6 py-2 rounded border-none font-semibold text-[14px] text-white cursor-pointer"
            style={{ background: C.accent }}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">

      {/* ── Left Panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-12 md:p-20 text-white"
        style={{ background: C.navy, borderRight: `1px solid ${C.navyLight}` }}>
        <div className="mb-12 text-center transition-transform hover:scale-105 duration-500">
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
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 transition-all duration-300 group-hover:scale-110"
                style={{ background: C.navyLight, border: `1px solid ${C.navyMid}`, color: C.gold }}>
                {item.icon}
              </div>
              <div className="transition-all duration-300 group-hover:translate-x-1">
                <div className="text-white font-semibold text-[13px] tracking-wide">{item.title}</div>
                <div className="text-[11.5px] mt-1 leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-20 bg-white">
        <div className="w-full max-w-[380px]">

          {/* Tabs */}
          <div className="flex mb-8 border-b border-gray-200">
            {[["login", "Student"], ["register", "Register"], ["admin", "Admin"]].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className="flex-1 py-3 border-none cursor-pointer text-[12.5px] font-semibold transition-all duration-300 hover:bg-gray-50 border-b-2"
                style={{ color: mode === m ? C.navy : "#8d97aa", borderColor: mode === m ? C.navy : "transparent" }}>
                {label}
              </button>
            ))}
          </div>

          <h2 className="text-2xl font-bold mb-1.5 tracking-tight" style={{ color: C.navy }}>
            {mode === "admin" ? "Admin Portal" : mode === "register" ? "Create Account" : "Student Login"}
          </h2>
          <p className="text-gray-400 text-[12.5px] mb-5">
            {mode === "register" ? "Register to access placement drives and tracking." : "Enter your credentials to access the portal."}
          </p>

          {error && (
            <div className="bg-[#fceaea] border border-[#e8b4b4] text-[#b03030] px-3.5 py-2.5 text-xs mb-4 flex items-center gap-2 rounded">
              <span className="font-extrabold">!</span> {error}
            </div>
          )}

          {/* ── GOOGLE LOGIN BUTTON ── */}
          {mode !== "register" && (
            <button
              onClick={() => googleLogin()}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 mb-4 border border-gray-300 bg-white text-gray-700 text-[13px] font-semibold rounded transition-all hover:bg-gray-50 hover:shadow-sm hover:border-gray-400 active:scale-95 cursor-pointer"
              style={{ opacity: googleLoading ? 0.7 : 1 }}
            >
              {/* Google logo SVG */}
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              {googleLoading ? "Signing in..." : `Sign in with Google${mode === "admin" ? " (Admin)" : ""}`}
            </button>
          )}

          {/* Divider */}
          {mode !== "register" && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] text-gray-400 font-medium">or continue with email</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          )}

          {/* Form fields */}
          <div className="flex flex-col gap-3.5">
            {mode === "register" && (
              <div className="flex flex-col gap-3.5">
                <select className={inputClasses} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="student">Role: Student</option>
                </select>
                <input placeholder="Full Name *" className={inputClasses} value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
                <input placeholder="Roll Number (e.g. 24B-CO-001) *" className={inputClasses} value={form.roll_no} onChange={e => setForm(p => ({ ...p, roll_no: e.target.value }))} />
                <div className="flex gap-2.5">
                  <select className={inputClasses} value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))}>{branches.map(b => <option key={b}>{b}</option>)}</select>
                  <select className={inputClasses} value={form.year}   onChange={e => setForm(p => ({ ...p, year:   e.target.value }))}>{years.map(y => <option key={y}>{y}</option>)}</select>
                </div>
              </div>
            )}
            <input type="email"    placeholder={mode === "admin" ? "Email (admin@college.edu)" : "Email address"} className={inputClasses} value={form.email}    onChange={e => setForm(p => ({ ...p, email:    e.target.value }))} />
            <input type="password" placeholder="Password"                                                         className={inputClasses} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>

          {mode === "login" && (
            <div className="text-right mt-2">
              <span onClick={() => setShowForgot(true)} className="text-[11.5px] cursor-pointer font-semibold hover:underline" style={{ color: C.accent }}>
                Forgot Password?
              </span>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className={`${btnClasses} mt-5`}
            style={{ background: C.accent }}>
            {loading ? "Please wait..." : mode === "register" ? "Submit Registration" : "Sign In"}
          </button>

          <div className="border-t border-gray-100 mt-5 pt-4 text-center">
            <p className="text-gray-400 text-[11px]">
              {mode === "login"  && "Demo: arjun.das@college.edu / student123"}
              {mode === "admin"  && "Demo: admin@college.edu / admin123"}
              {mode === "register" && "All fields marked * are required."}
            </p>
          </div>
        </div>
      </div>

      {/* ── Forgot Password Modal ── */}
      {showForgot && (
        <div className="fixed inset-0 bg-[#0d1b3e]/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-8 w-full max-w-[340px] shadow-xl rounded" style={{ borderTop: `4px solid ${C.accent}` }}>
            {forgotSent ? (
              <>
                <div className="text-3xl mb-3 text-center">📬</div>
                <h3 className="text-[#0d1b3e] mb-2 text-base font-bold text-center">Email Sent</h3>
                <p className="text-gray-500 text-xs mb-5 text-center">If this email is registered, a reset link has been sent.</p>
                <button onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(""); }}
                  className="w-full py-2 px-3 border-none text-white cursor-pointer font-semibold text-xs rounded" style={{ background: C.accent }}>
                  Close
                </button>
              </>
            ) : (
              <>
                <h3 className="text-[#0d1b3e] mb-2 text-base font-bold">Reset Password</h3>
                <p className="text-gray-500 text-xs mb-5">Enter your email to receive a reset link.</p>
                <input type="email" placeholder="Your email address" className={inputClasses}
                  value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                <div className="flex gap-2 mt-5">
                  <button onClick={() => setShowForgot(false)} className="flex-1 py-2 px-3 border border-gray-300 bg-white text-gray-600 cursor-pointer font-semibold text-xs rounded hover:bg-gray-50">Cancel</button>
                  <button onClick={handleForgot} className="flex-1 py-2 px-3 border-none text-white cursor-pointer font-semibold text-xs rounded" style={{ background: C.accent }}>Send Link</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}