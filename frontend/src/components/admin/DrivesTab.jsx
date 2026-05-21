import { useState } from 'react';
import { C, SectionHeader, TableCard, Toolbar, FormCard, Btn, TH, TD, MONO, formControl, formLabel } from './ui';

const INITIAL_DRIVES = [
  { id: 'DR-001', company: 'Tata Consultancy Services', role: 'System Analyst',       minCgpa: 6.0, maxBacklogs: 0, skills: ['Java','DSA','OOP'],          date: 'May 20, 2026' },
  { id: 'DR-002', company: 'Infosys Limited',           role: 'Software Engineer',    minCgpa: 6.5, maxBacklogs: 0, skills: ['PHP','MySQL','JavaScript'],   date: 'Jun 02, 2026' },
  { id: 'DR-003', company: 'Wipro Technologies',        role: 'UI/UX Designer',       minCgpa: 6.0, maxBacklogs: 1, skills: ['UI/UX','Figma','CSS'],        date: 'Jun 10, 2026' },
  { id: 'DR-004', company: 'Mphasis',                   role: 'PHP Developer',        minCgpa: 5.5, maxBacklogs: 2, skills: ['PHP','Laravel','MySQL'],       date: 'Jun 18, 2026' },
  { id: 'DR-005', company: 'Cognizant Technology',      role: 'Full Stack Developer', minCgpa: 7.0, maxBacklogs: 0, skills: ['React','Node.js','MongoDB'],  date: 'Jun 25, 2026' },
];

const EMPTY = { company: '', role: '', date: '', cgpa: '', backlogs: '', location: '', skills: '' };

export default function DrivesTab() {
  const [drives, setDrives] = useState(INITIAL_DRIVES);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');

  const addDrive = () => {
    if (!form.company || !form.role || !form.cgpa) return;
    const id = `DR-${String(drives.length + 1).padStart(3, '0')}`;
    setDrives(p => [...p, { id, company: form.company, role: form.role, minCgpa: parseFloat(form.cgpa), maxBacklogs: parseInt(form.backlogs) || 0, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean), date: form.date }]);
    setForm(EMPTY);
  };

  const filtered = drives.filter(d => d.company.toLowerCase().includes(search.toLowerCase()) || d.role.toLowerCase().includes(search.toLowerCase()));
  const inp = field => ({ value: form[field], onChange: e => setForm(p => ({ ...p, [field]: e.target.value })), style: formControl });

  return (
    <div>
      <SectionHeader title="Manage Company Drives" sub="Create and track recruitment drives for the current placement season" />

      <FormCard
        head="＋ Create New Company Drive"
        footer={<><Btn variant="primary" size="lg" onClick={addDrive}>Create Drive Record</Btn><Btn variant="ghost" size="lg" onClick={() => setForm(EMPTY)}>Clear Form</Btn></>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px 18px' }}>
          <div><label style={formLabel}>Company Name <span style={{ color: C.danger }}>*</span></label><input placeholder="e.g. Tata Consultancy Services" {...inp('company')} /></div>
          <div><label style={formLabel}>Job Role / Designation <span style={{ color: C.danger }}>*</span></label><input placeholder="e.g. Software Developer" {...inp('role')} /></div>
          <div><label style={formLabel}>Visit / Drive Date <span style={{ color: C.danger }}>*</span></label><input type="date" {...inp('date')} /></div>
          <div>
            <label style={formLabel}>Minimum CGPA <span style={{ color: C.danger }}>*</span></label>
            <input type="number" step="0.1" min="0" max="10" placeholder="e.g. 6.5" {...inp('cgpa')} />
            <span style={{ fontSize: 10.5, color: C.gray400 }}>Decimal value out of 10.0</span>
          </div>
          <div><label style={formLabel}>Max Active Backlogs <span style={{ color: C.danger }}>*</span></label><input type="number" min="0" max="10" placeholder="e.g. 0" {...inp('backlogs')} /></div>
          <div><label style={formLabel}>Job Location</label><input placeholder="e.g. Pune / Bangalore / Remote" {...inp('location')} /></div>
          <div style={{ gridColumn: 'span 3' }}>
            <label style={formLabel}>Required Skills (comma-separated) <span style={{ color: C.danger }}>*</span></label>
            <input placeholder="e.g. PHP, MySQL, UI/UX, JavaScript, DSA" {...inp('skills')} />
            <span style={{ fontSize: 10.5, color: C.gray400 }}>Enter skills separated by commas.</span>
          </div>
        </div>
      </FormCard>

      <TableCard>
        <Toolbar title="Active Company Drives — AY 2025-26" count={filtered.length} onSearch={setSearch} searchPlaceholder="Search drives..." />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead><tr>{['Drive ID','Company','Job Role','Min CGPA','Max Backlogs','Required Skills','Visit Date','Actions'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} style={{ borderBottom: `1px solid ${C.gray100}` }}>
                  <td style={{ ...TD, ...MONO }}>{d.id}</td>
                  <td style={{ ...TD, fontWeight: 500 }}>{d.company}</td>
                  <td style={TD}>{d.role}</td>
                  <td style={{ ...TD, ...MONO }}>{d.minCgpa}</td>
                  <td style={{ ...TD, ...MONO }}>{d.maxBacklogs}</td>
                  <td style={TD}>{d.skills.map(s => <span key={s} style={{ display: 'inline-block', padding: '1px 7px', background: C.pendingBg, color: C.pending, border: `1px solid #b0c6e8`, fontSize: 10, fontWeight: 500, margin: '1px 2px', fontFamily: 'IBM Plex Mono, monospace' }}>{s}</span>)}</td>
                  <td style={{ ...TD, ...MONO }}>{d.date}</td>
                  <td style={TD}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Btn variant="outline" size="sm">Edit</Btn>
                      <Btn variant="danger"  size="sm">Delete</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableCard>
    </div>
  );
}
