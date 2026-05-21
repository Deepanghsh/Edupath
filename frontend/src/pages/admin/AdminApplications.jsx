import { useState } from 'react';
import { C, SectionHeader, TableCard, Toolbar, Pill, Btn, TH, TD, MONO } from '../../components/admin/ui';

const APPS = [
  { id: 'AP-001', student: 'Deepangsh Naik',   roll: '24B-CO-019', company: 'Wipro Technologies',   role: 'UI/UX Designer',       date: 'May 10, 2026', status: 'shortlisted' },
  { id: 'AP-002', student: 'Abdullah Mukadam', roll: '24B-CO-003', company: 'TCS',                  role: 'System Analyst',       date: 'May 08, 2026', status: 'applied' },
  { id: 'AP-003', student: 'Raj Upaskar',      roll: '24B-CO-027', company: 'Cognizant Technology', role: 'Full Stack Developer', date: 'May 07, 2026', status: 'selected' },
  { id: 'AP-004', student: 'Priya Velkar',     roll: '24B-CO-013', company: 'Infosys Limited',      role: 'Software Engineer',    date: 'May 07, 2026', status: 'applied' },
  { id: 'AP-005', student: 'Ayush Sharma',     roll: '24B-CO-007', company: 'TCS',                  role: 'System Analyst',       date: 'May 06, 2026', status: 'rejected' },
  { id: 'AP-006', student: 'Akshay Pillai',    roll: '24B-CO-015', company: 'Wipro Technologies',   role: 'UI/UX Designer',       date: 'May 05, 2026', status: 'applied' },
  { id: 'AP-007', student: 'Kanak Waradkar',   roll: '24B-CO-001', company: 'Mphasis',              role: 'PHP Developer',        date: 'May 04, 2026', status: 'rejected' },
];

const FILTERS = ['All', 'Applied', 'Shortlisted', 'Selected', 'Rejected'];

export default function ApplicationsTab() {
  const [apps, setApps] = useState(APPS);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = apps.filter(a => {
    const matchStatus = statusFilter === 'All' || a.status.toLowerCase() === statusFilter.toLowerCase();
    const matchSearch = a.student.toLowerCase().includes(search.toLowerCase()) || a.company.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = FILTERS.reduce((acc, f) => ({ ...acc, [f]: f === 'All' ? apps.length : apps.filter(a => a.status.toLowerCase() === f.toLowerCase()).length }), {});
  const accentOf = f => f === 'Selected' ? C.success : f === 'Rejected' ? '#b03030' : f === 'Shortlisted' ? C.gold : C.pending;

  const handleAction = (id, newStatus) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  return (
    <div>
      <SectionHeader title="Applications Tracker" sub="Track all student applications across company drives" />

      {/* KPI strip */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {FILTERS.filter(f => f !== 'All').map(f => (
          <div key={f} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: '8px 16px', border: `1px solid ${C.gray200}`, background: '#fff', borderTop: `3px solid ${accentOf(f)}` }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 20, fontWeight: 600, color: C.navy }}>{counts[f]}</div>
            <div style={{ fontSize: 9, color: C.gray400, letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: 600, marginTop: 2 }}>{f}</div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setStatusFilter(f)}
            style={{ padding: '4px 12px', border: `1px solid ${statusFilter === f ? C.navy : C.gray200}`, fontSize: 11.5, cursor: 'pointer', fontFamily: 'IBM Plex Sans, sans-serif', background: statusFilter === f ? C.navy : '#fff', color: statusFilter === f ? '#fff' : C.gray600, fontWeight: statusFilter === f ? 500 : 400 }}>
            {f}
          </button>
        ))}
      </div>

      <TableCard>
        <Toolbar title="All Applications" count={filtered.length} onSearch={setSearch} searchPlaceholder="Search by student or company..." />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead><tr>{['App ID','Student','Roll No.','Company','Role','Application Date','Status','Actions'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} style={{ borderBottom: `1px solid ${C.gray100}` }}>
                  <td style={{ ...TD, ...MONO }}>{a.id}</td>
                  <td style={{ ...TD, fontWeight: 500 }}>{a.student}</td>
                  <td style={{ ...TD, ...MONO }}>{a.roll}</td>
                  <td style={TD}>{a.company}</td>
                  <td style={TD}>{a.role}</td>
                  <td style={{ ...TD, ...MONO }}>{a.date}</td>
                  <td style={TD}><Pill type={a.status}>{a.status}</Pill></td>
                  <td style={TD}>
                    {a.status === 'applied' ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Btn variant="success" size="sm" onClick={() => handleAction(a.id, 'shortlisted')}>Shortlist</Btn>
                        <Btn variant="danger"  size="sm" onClick={() => handleAction(a.id, 'rejected')}>Reject</Btn>
                      </div>
                    ) : a.status === 'shortlisted' ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Btn variant="success" size="sm" onClick={() => handleAction(a.id, 'selected')}>Select</Btn>
                        <Btn variant="danger"  size="sm" onClick={() => handleAction(a.id, 'rejected')}>Reject</Btn>
                      </div>
                    ) : (
                      <span style={{ fontSize: 10, color: C.gray400 }}>Actioned</span>
                    )}
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
