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

  const inputClasses = "w-full px-3.5 py-2.5 rounded border border-gray-300 bg-white text-gray-800 text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans";
  const btnClasses = `w-full p-3 rounded border-none font-semibold text-[14px] text-white transition-all duration-300 hover:scale-[1.02] active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`;

  if (registered) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans p-6">
        <div className="bg-white border border-gray-300 p-8 md:p-12 max-w-[420px] w-full text-center shadow-sm rounded-md transition-all">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-[#0d1b3e] text-xl font-bold mb-3 tracking-tight">Registration Submitted</h2>
          <p className="text-gray-500 text-[13px] leading-relaxed">Your account has been created and is pending verification. The TPO admin will review and approve your profile.</p>
          <button onClick={() => { setMode("login"); setRegistered(false); }} className={`${btnClasses} mt-6 !w-auto px-6`} style={{ background: C.accent }}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">

      {/* Left Panel - Navy Theme */}
      <div className="flex-1 flex flex-col items-center justify-center p-12 md:p-20 text-white"
        style={{ background: C.navy, borderRight: `1px solid ${C.navyLight}` }}>
        <div className="mb-12 text-center transition-transform hover:scale-105 duration-500">
          <div className="text-5xl md:text-6xl font-extrabold text-white tracking-tighter leading-none">EduPath</div>
          <div className="text-[10px] md:text-[11px] mt-2.5 tracking-widest uppercase font-semibold" style={{ color: C.gold }}>Placement Intelligence Portal</div>
        </div>
        
        <div className="flex flex-col gap-6 w-full max-w-[360px]">
          {[
            { icon: "◈", title: "Readiness Analytics", desc: "Data-driven insights for student placement readiness." },
            { icon: "⚑", title: "Drive Management", desc: "End-to-end recruitment drive orchestration." },
            { icon: "✔", title: "Verified Profiles", desc: "Maker-checker document verification workflows." },
            { icon: "≡", title: "Real-time Tracking", desc: "Live application status and stage monitoring." },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4 group cursor-default">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:bg-[#1e3163]"
                style={{ background: C.navyLight, border: `1px solid ${C.navyMid}`, color: C.gold }}>
                {item.icon}
              </div>
              <div className="transition-all duration-300 group-hover:translate-x-1">
                <div className="text-white font-semibold text-[13px] tracking-wide">{item.title}</div>
                <div className="text-[11.5px] mt-1 leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity duration-300">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-20 bg-white">
        <div className="w-full max-w-[380px]">

          {/* Tabs */}
          <div className="flex mb-8 md:mb-9 border-b border-gray-200">
            {[["login", "Student"], ["register", "Register"], ["admin", "Admin"]].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} 
                className={`flex-1 py-3 border-none cursor-pointer text-[12.5px] font-semibold transition-all duration-300 hover:bg-gray-50 border-b-2`}
                style={{
                  color: mode === m ? C.navy : C.gray400,
                  borderColor: mode === m ? C.navy : 'transparent',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <h2 className="text-2xl font-bold mb-1.5 tracking-tight transition-all duration-300" style={{ color: C.navy }}>
            {mode === "admin" ? "Admin Portal" : mode === "register" ? "Create Account" : "Student Login"}
          </h2>
          <p className="text-gray-400 text-[12.5px] mb-7 transition-all duration-300">
            {mode === "register" ? "Register to access placement drives and tracking." : "Enter your credentials to access the portal."}
          </p>

          {error && (
            <div className="bg-[#fceaea] border border-[#e8b4b4] text-[#b03030] px-3.5 py-2.5 text-xs mb-5 flex items-center gap-2 rounded animate-pulse">
              <span className="font-extrabold">!</span> {error}
            </div>
          )}

          <div className="flex flex-col gap-3.5">
            {mode === "register" && (
              <div className="animate-fade-in flex flex-col gap-3.5">
                <select className={inputClasses} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="student">Role: Student</option>
                  <option value="admin">Role: Admin / Placement Officer</option>
                </select>
                <input placeholder="Full Name" className={inputClasses} value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
                {form.role === "student" && (
                  <>
                    <input placeholder="Roll Number (e.g. 24B-CO-001)" className={inputClasses} value={form.roll_no} onChange={e => setForm(p => ({ ...p, roll_no: e.target.value }))} />
                    <div className="flex gap-2.5">
                      <select className={inputClasses} value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))}>{branches.map(b => <option key={b}>{b}</option>)}</select>
                      <select className={inputClasses} value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))}>{years.map(y => <option key={y}>{y}</option>)}</select>
                    </div>
                  </>
                )}
              </div>
            )}
            <input type="email" placeholder={mode === "admin" ? "Email (admin@college.edu)" : "Email address"} className={inputClasses} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            <input type="password" placeholder="Password" className={inputClasses} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          </div>

          {mode === "login" && (
            <div className="text-right mt-2.5">
              <span onClick={() => setShowForgot(true)} className="text-[11.5px] cursor-pointer font-semibold hover:underline transition-all" style={{ color: C.accent }}>Forgot Password?</span>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} className={`${btnClasses} mt-6 hover:bg-[#2d72c4]`} style={{ background: C.accent }}>
            {loading ? "Authenticating..." : mode === "register" ? "Submit Registration" : "Sign In"}
          </button>

          <div className="border-t border-gray-100 mt-6 pt-4 text-center">
            <p className="text-gray-400 text-[11px] transition-all">
              {mode === "login" && "Demo: any email + any password logs you in as student"}
              {mode === "admin" && "Demo: admin@college.edu / admin123"}
            </p>
          </div>
        </div>
      </div>

      {showForgot && (
        <div className="fixed inset-0 bg-[#0d1b3e]/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white p-8 w-full max-w-[340px] shadow-xl animate-scale-in" style={{ borderTop: `4px solid ${C.accent}` }}>
            <h3 className="text-[#0d1b3e] mb-2 text-base font-bold">Reset Password</h3>
            <p className="text-gray-500 text-xs mb-5">Enter your email to receive a reset link.</p>
            <input type="email" placeholder="Your email address" className={inputClasses} />
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowForgot(false)} className="flex-1 py-2 px-3 border border-gray-300 bg-white text-gray-600 cursor-pointer font-semibold text-xs hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => setShowForgot(false)} className="flex-1 py-2 px-3 border-none text-white cursor-pointer font-semibold text-xs transition-colors hover:bg-blue-700" style={{ background: C.accent }}>Send Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}