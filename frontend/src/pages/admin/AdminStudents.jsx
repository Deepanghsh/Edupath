import { useState } from 'react';
import { C, SectionHeader, TableCard, Toolbar, Pill, ScoreBar, Btn, TH, TD, MONO } from '../../components/admin/ui';

const STUDENTS = [
  { id: 1, roll: '24B-CO-027', name: 'Raj Upaskar',      branch: 'CSE', cgpa: 8.5, backlogs: 0, score: 91, tier: 'Tier 1',   status: 'approved',  skills: ['Node.js','React','MongoDB'] },
  { id: 2, roll: '24B-CO-013', name: 'Priya Velkar',      branch: 'CSE', cgpa: 8.1, backlogs: 0, score: 88, tier: 'Tier 1',   status: 'pending',   skills: ['Java','Spring','DSA'] },
  { id: 3, roll: '24B-CO-003', name: 'Abdullah Mukadam',  branch: 'CSE', cgpa: 7.8, backlogs: 0, score: 82, tier: 'Tier 1',   status: 'approved',  skills: ['PHP','MySQL','JavaScript'] },
  { id: 4, roll: '24B-CO-019', name: 'Deepangsh Naik',    branch: 'CSE', cgpa: 7.0, backlogs: 0, score: 74, tier: 'Tier 2',   status: 'approved',  skills: ['React','CSS','Figma'] },
  { id: 5, roll: '24B-CO-007', name: 'Ayush Sharma',      branch: 'ECE', cgpa: 6.8, backlogs: 1, score: 61, tier: 'Tier 2',   status: 'pending',   skills: ['DSA','C++'] },
  { id: 6, roll: '24B-CO-015', name: 'Akshay Pillai',     branch: 'ME',  cgpa: 6.4, backlogs: 0, score: 55, tier: 'Training', status: 'approved',  skills: ['AutoCAD'] },
  { id: 7, roll: '24B-CO-001', name: 'Kanak Waradkar',    branch: 'CSE', cgpa: 5.8, backlogs: 1, score: 49, tier: 'Training', status: 'rejected',  skills: ['PHP','HTML'] },
  { id: 8, roll: '24B-CO-025', name: 'Rohan Gaonkar',     branch: 'CSE', cgpa: 5.9, backlogs: 2, score: 48, tier: 'Training', status: 'pending',   skills: ['PHP'] },
  { id: 9, roll: '24B-CO-022', name: 'Sahil Sawant',      branch: 'IT',  cgpa: 5.5, backlogs: 1, score: 43, tier: 'Training', status: 'rejected',  skills: ['HTML','CSS'] },
];

const tierColor = t => t === 'Tier 1' ? C.success : t === 'Tier 2' ? C.accent : C.warn;

export default function StudentsTab() {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [tierFilter, setTierFilter]   = useState('All');

  const filtered = STUDENTS.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.roll.includes(search);
    const matchBranch = branchFilter === 'All' || s.branch === branchFilter;
    const matchTier   = tierFilter   === 'All' || s.tier === tierFilter;
    return matchSearch && matchBranch && matchTier;
  });

  const sel = { border: `1px solid ${C.gray200}`, padding: '5px 8px', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 12, color: C.gray800, background: '#fff', outline: 'none', width: 130 };

  return (
    <div>
      <SectionHeader title="Student Directory & Readiness Analytics" sub="Approved students only · At-risk students (Readiness < 60) are highlighted">
        <Btn variant="ghost" size="sm">↓ Export CSV</Btn>
      </SectionHeader>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.gray600 }}>
          <div style={{ width: 12, height: 12, background: '#fdf0ef', border: '1px solid #cc6666', flexShrink: 0 }} /> At-risk (Score &lt; 60)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.gray600 }}>
          <div style={{ width: 12, height: 12, background: '#fff', border: `1px solid ${C.gray200}`, flexShrink: 0 }} /> Normal
        </div>
      </div>

      <TableCard>
        <Toolbar title="Student Directory" count={filtered.length} onSearch={setSearch} searchPlaceholder="Search by name or roll no...">
          <select style={sel} value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
            {['All','CSE','ECE','ME','IT','CE','EEE'].map(b => <option key={b}>{b}</option>)}
          </select>
          <select style={sel} value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
            {['All','Tier 1','Tier 2','Training'].map(t => <option key={t}>{t}</option>)}
          </select>
        </Toolbar>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead><tr>{['#','Roll No.','Name','Branch','CGPA','Backlogs','Readiness Score','Tier','Status','Skills','Actions'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((s, i) => {
                const atRisk = s.score < 60;
                return (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${C.gray100}`, ...(atRisk ? { background: '#fdf0ef', borderLeft: '3px solid #cc6666' } : {}) }}>
                    <td style={{ ...TD, ...MONO }}>{i + 1}</td>
                    <td style={{ ...TD, ...MONO }}>{s.roll}</td>
                    <td style={{ ...TD, fontWeight: 500 }}>{s.name}</td>
                    <td style={{ ...TD, ...MONO }}>{s.branch}</td>
                    <td style={{ ...TD, ...MONO }}>{s.cgpa}</td>
                    <td style={{ ...TD, ...MONO, color: s.backlogs > 0 ? '#b03030' : C.gray800 }}>{s.backlogs}</td>
                    <td style={TD}><ScoreBar val={s.score} /></td>
                    <td style={TD}><span style={{ fontSize: 10, fontWeight: 700, color: tierColor(s.tier) }}>{s.tier.toUpperCase()}</span></td>
                    <td style={TD}><Pill type={s.status}>{s.status}</Pill></td>
                    <td style={TD}>{s.skills.slice(0, 2).map(sk => <span key={sk} style={{ display: 'inline-block', padding: '1px 6px', background: C.pendingBg, color: C.pending, border: '1px solid #b0c6e8', fontSize: 9.5, fontFamily: 'IBM Plex Mono, monospace', margin: 1 }}>{sk}</span>)}</td>
                    <td style={TD}><Btn variant="outline" size="sm">View Profile</Btn></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TableCard>
    </div>
  );
}
