import { useState, useRef } from "react";
import api from "../../utils/api";
import ToggleSwitch from "../../components/ToggleSwitch";
import { C, CARD } from "./ui";

const TABS = ["Profile", "Account", "Security", "Notifications"];

const fc = {
  border: `1px solid ${C.gray200}`, padding: '7px 10px',
  fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 13, color: C.gray800,
  background: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box',
};
const fl = {
  fontSize: 10.5, fontWeight: 600, color: C.gray600, letterSpacing: '0.4px',
  textTransform: 'uppercase', display: 'block', marginBottom: 4,
};
const Btn = ({ onClick, children, variant = 'primary', disabled }) => {
  const styles = {
    primary: { background: C.accent,   color: '#fff',    borderColor: C.accent },
    success: { background: C.success,  color: '#fff',    borderColor: C.success },
    ghost:   { background: '#fff',     color: C.gray600, borderColor: C.gray200 },
    danger:  { background: C.dangerBg, color: C.danger,  borderColor: '#e8b4b4' },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...styles[variant], border: '1px solid', padding: '7px 18px', fontSize: 12,
      fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'IBM Plex Sans, sans-serif',
      letterSpacing: '0.2px', opacity: disabled ? 0.7 : 1,
    }}>{children}</button>
  );
};

const allSkills = ["PHP", "Python", "React", "Java", "SQL", "UI/UX", "Node.js", "DSA", "C++", "MongoDB", "Flutter", "Machine Learning"];

export default function SettingsPage({ student, setStudent, addToast }) {
  const [tab, setTab]         = useState("Profile");
  const [form, setForm]       = useState({ ...student });
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const toggleSkill = skill =>
    setForm(p => ({ ...p, skills: p.skills?.includes(skill) ? p.skills.filter(s => s !== skill) : [...(p.skills || []), skill] }));

  // ── Real API: Save profile ────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch('/student/profile', {
        full_name: form.full_name, branch: form.branch, year: form.year,
        cgpa: parseFloat(form.cgpa), active_backlogs: parseInt(form.active_backlogs),
        dsa_marks: parseInt(form.dsa_marks), oops_marks: parseInt(form.oops_marks),
        skills: form.skills, roll_no: form.roll_no,
      });
      setStudent(data); setForm(data); setEditing(false);
      addToast("Profile updated successfully!", "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to save profile.", "error");
    } finally { setSaving(false); }
  };

  // ── Real API: Upload marksheet & Auto-OCR ──────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('marksheet', file);
      
      // Upload to backend — backend auto-runs OCR and returns results in same response
      const { data } = await api.post('/student/upload-marksheet', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000 // Give OCR enough time to process PDFs
      });
      let currentForm = { ...form, mark_sheet_url: data.mark_sheet_url };
      setForm(currentForm);

      // Check if OCR results came back with the upload
      if (data.ocr?.success && data.ocr?.extracted) {
        const ext = data.ocr.extracted;
        let msgs = [];
        
        if (ext.cgpa) { currentForm.cgpa = parseFloat(ext.cgpa); msgs.push(`CGPA: ${currentForm.cgpa}`); }
        if (ext.backlogs !== undefined) { currentForm.active_backlogs = parseInt(ext.backlogs) || 0; msgs.push(`Backlogs: ${currentForm.active_backlogs}`); }
        
        if (msgs.length > 0) {
          setForm(currentForm);
          setEditing(true); // Open edit mode to let user review
          addToast(`✅ OCR Found: ${msgs.join(', ')}. Review & click Save!`, "success");
        } else {
          addToast("Mark sheet uploaded! OCR ran but no numbers detected clearly.", "success");
        }
      } else {
        addToast("Mark sheet uploaded! Awaiting admin verification.", "success");
      }

    } catch (err) {
      addToast(err.response?.data?.message || "Upload failed.", "error");
    } finally { setUploading(false); }
  };

  // ── Real API: Change password ──────────────────────────────────────────────
  const handleChangePass = async () => {
    if (!passwords.current || !passwords.newPass || !passwords.confirm) { addToast("Fill all password fields.", "error"); return; }
    if (passwords.newPass !== passwords.confirm) { addToast("Passwords do not match.", "error"); return; }
    try {
      await api.put('/student/change-password', { current: passwords.current, newPass: passwords.newPass, confirm: passwords.confirm });
      setPasswords({ current: "", newPass: "", confirm: "" });
      addToast("Password changed successfully!", "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Password change failed.", "error");
    }
  };

  const verificationColors = { Approved: C.success, Pending: C.gold, Rejected: C.danger };
  const vc = verificationColors[form.verification_status] || C.gray400;

  return (
    <div style={{ padding: '24px 28px', background: C.gray50, minHeight: '100vh' }}>

      {/* Page header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ color: C.navy, fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>Settings</h1>
        <p style={{ color: C.gray400, fontSize: 12, marginTop: 4 }}>Manage your profile, account details, and preferences.</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.gray200}`, marginBottom: 22, gap: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', fontSize: 12.5, fontWeight: tab === t ? 600 : 400,
            color: tab === t ? C.navy : C.gray400, background: 'none', border: 'none',
            borderBottom: `2px solid ${tab === t ? C.gold : 'transparent'}`,
            cursor: 'pointer', fontFamily: 'IBM Plex Sans, sans-serif',
            marginBottom: -1, transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {/* ── TAB: PROFILE ── */}
      {tab === "Profile" && (
        <div>
          {/* Verification banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px', background: vc + '18', border: `1px solid ${vc}`, marginBottom: 18, fontSize: 12 }}>
            <span style={{ fontSize: 18 }}>
              {form.verification_status === 'Approved' ? '✅' : form.verification_status === 'Rejected' ? '❌' : '⏳'}
            </span>
            <div>
              <div style={{ color: vc, fontWeight: 600 }}>Verification Status: {form.verification_status}</div>
              <div style={{ color: C.gray400, marginTop: 2 }}>
                {form.verification_status === 'Approved' ? 'Your profile has been verified by the TPO office.'
                  : form.verification_status === 'Rejected' ? 'Your documents were rejected. Please re-upload.'
                  : 'Your documents are pending admin review.'}
              </div>
            </div>
          </div>

          {/* Avatar + Identity */}
          <div className={CARD} style={{ padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 56, height: 56, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {student.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 16, color: C.navy }}>{form.full_name}</div>
              <div style={{ fontSize: 11.5, color: C.gray400, marginTop: 2 }}>{student.roll_no} · {student.branch} · {student.year}</div>
              <div style={{ fontSize: 11.5, color: C.gray400 }}>{student.email}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {editing
                ? <><Btn variant="success" onClick={handleSave}>💾 Save</Btn><Btn variant="ghost" onClick={() => { setEditing(false); setForm({ ...student }); }}>Cancel</Btn></>
                : <Btn onClick={() => setEditing(true)}>✏️ Edit Profile</Btn>
              }
            </div>
          </div>

          {/* Editable fields / view */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Academic info */}
            <div className={CARD} style={{ padding: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: C.gray800, marginBottom: 14, borderBottom: `1px solid ${C.gray100}`, paddingBottom: 10 }}>Academic Information</div>
              {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label style={fl}>CGPA</label><input type="number" min="0" max="10" step="0.01" value={form.cgpa} onChange={e => setForm(p => ({ ...p, cgpa: parseFloat(e.target.value) }))} style={fc} /></div>
                  <div><label style={fl}>Active Backlogs</label><input type="number" min="0" value={form.active_backlogs} onChange={e => setForm(p => ({ ...p, active_backlogs: parseInt(e.target.value) }))} style={fc} /></div>
                  <div><label style={fl}>DSA Marks (/100)</label><input type="number" min="0" max="100" value={form.dsa_marks} onChange={e => setForm(p => ({ ...p, dsa_marks: parseInt(e.target.value) }))} style={fc} /></div>
                  <div><label style={fl}>OOPs Marks (/100)</label><input type="number" min="0" max="100" value={form.oops_marks} onChange={e => setForm(p => ({ ...p, oops_marks: parseInt(e.target.value) }))} style={fc} /></div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['CGPA', student.cgpa], ['Active Backlogs', student.active_backlogs], ['DSA Marks', `${student.dsa_marks}/100`], ['OOPs Marks', `${student.oops_marks}/100`], ['Readiness Score', `${student.readiness_score}%`], ['Tier', student.tier]].map(([l, v]) => (
                    <div key={l} style={{ background: C.gray50, border: `1px solid ${C.gray100}`, padding: '10px 14px' }}>
                      <div style={{ fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase', color: C.gray400, fontWeight: 600, marginBottom: 4 }}>{l}</div>
                      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 16, fontWeight: 600, color: C.navy }}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Skills */}
            <div className={CARD} style={{ padding: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: C.gray800, marginBottom: 14, borderBottom: `1px solid ${C.gray100}`, paddingBottom: 10 }}>Skills {editing && <span style={{ fontSize: 10, color: C.gray400, fontWeight: 400 }}>· Click to toggle</span>}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {allSkills.map(skill => {
                  const active = (editing ? form.skills : student.skills || []).includes(skill);
                  return (
                    <button key={skill} onClick={() => editing && toggleSkill(skill)} style={{
                      padding: '3px 10px', fontSize: 10.5, fontWeight: 600,
                      cursor: editing ? 'pointer' : 'default',
                      border: `1px solid ${active ? '#b0c6e8' : C.gray200}`,
                      background: active ? C.pendingBg : C.gray50,
                      color: active ? C.pending : C.gray400,
                      fontFamily: 'IBM Plex Mono, monospace', transition: 'all 0.15s',
                    }}>
                      {active ? '✓ ' : ''}{skill}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mark Sheet Upload */}
          <div className={CARD} style={{ padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 12, color: C.gray800, marginBottom: 6 }}>Mark Sheet Upload</div>
            <p style={{ fontSize: 11.5, color: C.gray400, marginBottom: 14 }}>Upload your latest semester mark sheet for TPO verification.</p>
            {form.mark_sheet_url ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: C.gray50, border: `1px solid ${C.gray200}`, padding: '12px 16px' }}>
                <span style={{ fontSize: 20 }}>📄</span>
                <span style={{ color: C.gray800, fontSize: 13, fontFamily: 'IBM Plex Mono, monospace' }}>{form.mark_sheet_url}</span>
                <button onClick={() => setForm(p => ({ ...p, mark_sheet_url: null }))} style={{ marginLeft: 'auto', color: C.danger, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Remove</button>
              </div>
            ) : (
              <div onClick={() => fileRef.current.click()} style={{ border: `2px dashed ${C.gray200}`, padding: '28px', textAlign: 'center', cursor: 'pointer', background: C.gray50 }}>
                <div style={{ fontSize: 28 }}>📤</div>
                <div style={{ color: C.gray400, fontSize: 12, marginTop: 8 }}>{uploading ? 'Uploading...' : 'Click to upload PDF or Image'}</div>
              </div>
            )}
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} style={{ display: 'none' }} />
          </div>
        </div>
      )}

      {/* ── TAB: ACCOUNT ── */}
      {tab === "Account" && (
        <div className={CARD} style={{ padding: 20, maxWidth: 540 }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: C.gray800, marginBottom: 16, borderBottom: `1px solid ${C.gray100}`, paddingBottom: 10 }}>Account Information</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <div><label style={fl}>Full Name</label><input style={fc} value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} /></div>
            <div><label style={fl}>Email</label><input style={fc} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={fl}>Branch</label>
                <select style={fc} value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))}>
                  {["CSE", "ECE", "ME", "CE", "IT", "EEE"].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={fl}>Year</label>
                <select style={fc} value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))}>
                  {["1st Year", "2nd Year", "3rd Year", "4th Year"].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
          <Btn onClick={() => { setStudent(p => ({ ...p, ...form })); addToast("Account information updated!", "success"); }}>Save Changes</Btn>
        </div>
      )}

      {/* ── TAB: SECURITY ── */}
      {tab === "Security" && (
        <div className={CARD} style={{ padding: 20, maxWidth: 540 }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: C.gray800, marginBottom: 16, borderBottom: `1px solid ${C.gray100}`, paddingBottom: 10 }}>Change Password</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <div><label style={fl}>Current Password</label><input type="password" style={fc} value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} /></div>
            <div><label style={fl}>New Password</label><input type="password" style={fc} value={passwords.newPass} onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} /></div>
            <div><label style={fl}>Confirm New Password</label><input type="password" style={fc} value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} /></div>
          </div>
          <Btn onClick={handleChangePass}>Update Password</Btn>
        </div>
      )}

      {/* ── TAB: NOTIFICATIONS ── */}
      {tab === "Notifications" && (
        <div className={CARD}>
          <div style={{ fontWeight: 600, fontSize: 12, color: C.gray800, padding: '12px 16px', borderBottom: `1px solid ${C.gray200}` }}>Notification Preferences</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {[
              { label: "Drive Alerts",         desc: "Get notified when new drives are posted",    def: true },
              { label: "Shortlisting Updates", desc: "Know when your application status changes",  def: true },
              { label: "Mentor Notifications", desc: "Receive mentor assignment alerts",            def: false },
              { label: "System Updates",       desc: "Platform and policy announcements",           def: true },
            ].map((pref, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 20px',
                borderBottom: i < 2 ? `1px solid ${C.gray100}` : 'none',
                borderRight: i % 2 === 0 ? `1px solid ${C.gray100}` : 'none',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.gray800 }}>{pref.label}</div>
                  <div style={{ fontSize: 11, color: C.gray400, marginTop: 2 }}>{pref.desc}</div>
                </div>
                <ToggleSwitch def={pref.def} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
