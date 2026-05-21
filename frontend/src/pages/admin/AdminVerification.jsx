import { useState } from 'react';
import { C, SectionHeader, TableCard, Toolbar, Pill, Btn, TH, TD, MONO } from '../../components/admin/ui';

const PENDING = [
  { id: 1, roll: '24B-CO-001', name: 'Kanak Waradkar',  email: 'kanak@gce.edu',  cgpa: 7.2, backlogs: 0, date: 'May 09' },
  { id: 2, roll: '24B-CO-007', name: 'Ayush Sharma',    email: 'ayush@gce.edu',  cgpa: 6.8, backlogs: 1, date: 'May 09' },
  { id: 3, roll: '24B-CO-013', name: 'Priya Velkar',    email: 'priya@gce.edu',  cgpa: 8.1, backlogs: 0, date: 'May 08' },
  { id: 4, roll: '24B-CO-025', name: 'Rohan Gaonkar',   email: 'rohan@gce.edu',  cgpa: 5.9, backlogs: 2, date: 'May 08' },
];

const ACTIONED = [
  { id: 1, roll: '24B-CO-003', name: 'Abdullah Mukadam', cgpa: 7.8, status: 'approved', by: 'TPO Admin', date: 'May 06' },
  { id: 2, roll: '24B-CO-011', name: 'Aditya Chodankar', cgpa: 8.1, status: 'rejected', by: 'TPO Admin', date: 'May 07' },
  { id: 3, roll: '24B-CO-015', name: 'Akshay Pillai',    cgpa: 6.4, status: 'approved', by: 'TPO Admin', date: 'May 07' },
  { id: 4, roll: '24B-CO-019', name: 'Deepangsh Naik',   cgpa: 7.0, status: 'approved', by: 'TPO Admin', date: 'May 08' },
  { id: 5, roll: '24B-CO-022', name: 'Sahil Sawant',     cgpa: 5.9, status: 'rejected', by: 'TPO Admin', date: 'May 08' },
  { id: 6, roll: '24B-CO-027', name: 'Raj Upaskar',      cgpa: 8.5, status: 'approved', by: 'TPO Admin', date: 'May 08' },
];

export default function VerificationTab() {
  const [pending, setPending] = useState(PENDING);
  const [actioned, setActioned] = useState(ACTIONED);
  const [search, setSearch] = useState('');

  const handleAction = (id, status) => {
    const student = pending.find(s => s.id === id);
    if (!student) return;
    setPending(p => p.filter(s => s.id !== id));
    setActioned(a => [{ ...student, id: Date.now() + Math.random(), status, by: 'TPO Admin', date: 'Just now' }, ...a]);
  };

  const filtered = pending.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.roll.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <SectionHeader title="Document Verification — Maker-Checker" sub="Review student-submitted mark sheets and approve or reject academic data" />

      {/* Info banner */}
      <div style={{ display: 'flex', gap: 16, padding: '10px 14px', background: C.pendingBg, border: `1px solid #b0c6e8`, fontSize: 11.5, alignItems: 'flex-start', marginBottom: 16 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: C.accent, flexShrink: 0, marginTop: 1 }}>
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3"/>
          <line x1="8" y1="7" x2="8" y2="11" stroke="currentColor" strokeWidth="1.4"/>
          <circle cx="8" cy="5" r="0.7" fill="currentColor"/>
        </svg>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 2, color: C.navy }}>Verification Protocol</div>
          Students flagged as "Pending" have self-declared academic data that has not yet been cross-checked with official mark sheets. Approve only after manually reviewing the uploaded document against the declared CGPA and backlog count.
        </div>
      </div>

      <TableCard>
        <Toolbar title="Pending Verifications" count={filtered.length} onSearch={setSearch} searchPlaceholder="Search by name or roll no..." />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead><tr>
              {['#','Roll No.','Student Name','Email','Declared CGPA','Active Backlogs','Submission Date','Mark Sheet','Actions'].map(h => <th key={h} style={TH}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ ...TD, textAlign: 'center', padding: '30px', color: C.gray400 }}>No pending verifications found.</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${C.gray100}` }}>
                  <td style={{ ...TD, ...MONO }}>{i + 1}</td>
                  <td style={{ ...TD, ...MONO }}>{r.roll}</td>
                  <td style={{ ...TD, fontWeight: 500 }}>{r.name}</td>
                  <td style={{ ...TD, color: C.gray400 }}>{r.email}</td>
                  <td style={{ ...TD, ...MONO }}>{r.cgpa}</td>
                  <td style={{ ...TD, ...MONO }}>{r.backlogs}</td>
                  <td style={{ ...TD, ...MONO }}>{r.date}</td>
                  <td style={TD}><a href="#" style={{ color: C.accent, fontSize: 11, fontWeight: 600 }}>View PDF</a></td>
                  <td style={TD}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn variant="success" size="sm" onClick={() => handleAction(r.id, 'approved')}>✓ Approve</Btn>
                      <Btn variant="danger"  size="sm" onClick={() => handleAction(r.id, 'rejected')}>✗ Reject</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableCard>

      <TableCard>
        <Toolbar title="Recently Actioned (Last 7 Days)" count={actioned.length} />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead><tr>
              {['#','Roll No.','Name','Declared CGPA','Status','Actioned By','Date'].map(h => <th key={h} style={TH}>{h}</th>)}
            </tr></thead>
            <tbody>
              {actioned.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${C.gray100}` }}>
                  <td style={{ ...TD, ...MONO }}>{i + 1}</td>
                  <td style={{ ...TD, ...MONO }}>{r.roll}</td>
                  <td style={{ ...TD, fontWeight: 500 }}>{r.name}</td>
                  <td style={{ ...TD, ...MONO }}>{r.cgpa}</td>
                  <td style={TD}><Pill type={r.status}>{r.status}</Pill></td>
                  <td style={TD}>{r.by}</td>
                  <td style={{ ...TD, ...MONO }}>{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableCard>
    </div>
  );
}
