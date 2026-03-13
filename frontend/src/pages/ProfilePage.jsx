import { useState, useRef } from "react";

export default function ProfilePage({ student, setStudent, theme, addToast }) {
  const s = theme;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...student });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const allSkills = ["PHP", "Python", "React", "Java", "SQL", "UI/UX", "Node.js", "DSA", "C++", "MongoDB", "Flutter", "Machine Learning"];

  const toggleSkill = (skill) => {
    setForm(p => ({ ...p, skills: p.skills.includes(skill) ? p.skills.filter(sk => sk !== skill) : [...p.skills, skill] }));
  };

  const handleSave = () => {
    setStudent(form);
    setEditing(false);
    addToast("Profile updated successfully!", "success");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setForm(p => ({ ...p, mark_sheet_url: file.name }));
      addToast("Mark sheet uploaded! Awaiting admin verification.", "success");
    }, 1500);
  };

  const verificationColors = { Approved: s.success, Pending: s.warning, Rejected: s.error };
  const vc = verificationColors[form.verification_status] || s.muted;

  const inputStyle = {
    padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${s.border}`,
    background: s.bg, color: s.text, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: "100%" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ color: s.text, fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>My Profile</h1>
          <p style={{ color: s.muted, fontSize: 13, marginTop: 5 }}>Your placement profile drives all eligibility calculations.</p>
        </div>
        <button onClick={() => editing ? handleSave() : setEditing(true)} style={{
          padding: "11px 26px", borderRadius: 12, border: "none", cursor: "pointer",
          background: editing ? s.success : s.accent, color: "#fff", fontWeight: 700, fontSize: 14,
        }}>
          {editing ? "💾 Save Changes" : "✏️ Edit Profile"}
        </button>
      </div>

      {/* Verification Banner */}
      <div style={{ background: vc + "18", border: `1.5px solid ${vc}`, borderRadius: 14, padding: "16px 22px", marginBottom: 28, display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 22 }}>
          {form.verification_status === "Approved" ? "✅" : form.verification_status === "Rejected" ? "❌" : "⏳"}
        </span>
        <div>
          <div style={{ color: vc, fontWeight: 700, fontSize: 14 }}>Verification Status: {form.verification_status}</div>
          <div style={{ color: s.muted, fontSize: 13, marginTop: 2 }}>
            {form.verification_status === "Approved" ? "Your profile has been verified by the TPO office."
              : form.verification_status === "Rejected" ? "Your documents were rejected. Please re-upload."
              : "Your documents are pending admin review."}
          </div>
        </div>
      </div>

      {/* Two column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>

        {/* Left — Avatar + Basic Info */}
        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 16, padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28, paddingBottom: 24, borderBottom: `1px solid ${s.border}` }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: s.accentLight, border: `3px solid ${s.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: s.accent, flexShrink: 0 }}>
              {student.avatar}
            </div>
            <div>
              <div style={{ color: s.text, fontSize: 22, fontWeight: 800 }}>{editing ? form.full_name : student.full_name}</div>
              <div style={{ color: s.muted, fontSize: 13, marginTop: 4 }}>{student.roll_no} · {student.branch} · {student.year}</div>
              <div style={{ color: s.muted, fontSize: 13 }}>{student.email}</div>
            </div>
          </div>

          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={{ color: s.muted, fontSize: 12, display: "block", marginBottom: 6 }}>Full Name</label><input style={inputStyle} value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} /></div>
              <div><label style={{ color: s.muted, fontSize: 12, display: "block", marginBottom: 6 }}>CGPA</label><input type="number" min="0" max="10" step="0.01" style={inputStyle} value={form.cgpa} onChange={e => setForm(p => ({ ...p, cgpa: parseFloat(e.target.value) }))} /></div>
              <div><label style={{ color: s.muted, fontSize: 12, display: "block", marginBottom: 6 }}>Active Backlogs</label><input type="number" min="0" style={inputStyle} value={form.active_backlogs} onChange={e => setForm(p => ({ ...p, active_backlogs: parseInt(e.target.value) }))} /></div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "CGPA", val: student.cgpa },
                { label: "Active Backlogs", val: student.active_backlogs },
              ].map((f, i) => (
                <div key={i} style={{ background: s.surface, borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ color: s.muted, fontSize: 11, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>{f.label}</div>
                  <div style={{ color: s.text, fontWeight: 800, fontSize: 18 }}>{f.val}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — Academic Marks */}
        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 16, padding: 28 }}>
          <div style={{ color: s.text, fontWeight: 700, fontSize: 16, marginBottom: 22 }}>📈 Academic Performance</div>
          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={{ color: s.muted, fontSize: 12, display: "block", marginBottom: 6 }}>DSA Marks (/100)</label><input type="number" min="0" max="100" style={inputStyle} value={form.dsa_marks} onChange={e => setForm(p => ({ ...p, dsa_marks: parseInt(e.target.value) }))} /></div>
              <div><label style={{ color: s.muted, fontSize: 12, display: "block", marginBottom: 6 }}>OOPs Marks (/100)</label><input type="number" min="0" max="100" style={inputStyle} value={form.oops_marks} onChange={e => setForm(p => ({ ...p, oops_marks: parseInt(e.target.value) }))} /></div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { label: "DSA Marks", val: student.dsa_marks, max: 100 },
                { label: "OOPs Marks", val: student.oops_marks, max: 100 },
                { label: "Readiness Score", val: student.readiness_score, max: 100 },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: s.muted, fontSize: 13 }}>{item.label}</span>
                    <span style={{ color: s.text, fontSize: 13, fontWeight: 700 }}>{item.val}/{item.max}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 6, background: s.border }}>
                    <div style={{ height: "100%", width: `${(item.val / item.max) * 100}%`, borderRadius: 6, background: i === 2 ? s.purple : s.accent, transition: "width 1s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Skills */}
      <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 16, padding: 28, marginBottom: 24 }}>
        <div style={{ color: s.text, fontWeight: 700, fontSize: 16, marginBottom: 18 }}>🛠️ Skills</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {allSkills.map(skill => {
            const active = (editing ? form.skills : student.skills).includes(skill);
            return (
              <button key={skill} onClick={() => editing && toggleSkill(skill)} style={{
                padding: "8px 18px", borderRadius: 24, fontSize: 13, fontWeight: 600,
                cursor: editing ? "pointer" : "default",
                border: `1.5px solid ${active ? s.accent : s.border}`,
                background: active ? s.accentLight : "transparent",
                color: active ? s.accent : s.muted,
                transition: "all 0.15s",
              }}>
                {active ? "✓ " : ""}{skill}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mark Sheet Upload */}
      <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 16, padding: 28 }}>
        <div style={{ color: s.text, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>📄 Mark Sheet Upload</div>
        <p style={{ color: s.muted, fontSize: 13, marginBottom: 18 }}>Upload your latest semester mark sheet for TPO verification.</p>
        {form.mark_sheet_url ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14, background: s.surface, borderRadius: 12, padding: "14px 18px" }}>
            <span style={{ fontSize: 22 }}>📄</span>
            <span style={{ color: s.text, fontSize: 14 }}>{form.mark_sheet_url}</span>
            <button onClick={() => setForm(p => ({ ...p, mark_sheet_url: null }))} style={{ marginLeft: "auto", color: s.error, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Remove</button>
          </div>
        ) : (
          <div onClick={() => fileRef.current.click()} style={{ border: `2px dashed ${s.border}`, borderRadius: 14, padding: "32px", textAlign: "center", cursor: "pointer" }}>
            <div style={{ fontSize: 32 }}>📤</div>
            <div style={{ color: s.muted, fontSize: 14, marginTop: 10 }}>{uploading ? "Uploading..." : "Click to upload PDF or Image"}</div>
          </div>
        )}
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} style={{ display: "none" }} />
      </div>
    </div>
  );
}