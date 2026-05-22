import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { C, SectionHeader, TableCard, Toolbar, Pill, TH, TD, MONO } from '../../components/admin/ui';

export default function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('All');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/students');
      setStudents(data);
    } catch (err) { console.error('Students fetch error:', err); }
    finally { setLoading(false); }
  };

  const tierColor = { Tier1: C.success, Tier2: C.gold, Tier3: '#b03030' };
  const verColor  = { Approved: C.success, Pending: C.gold, Rejected: '#b03030' };

  const filtered = students
    .filter(s => filter === 'All' || s.tier === filter || s.verification_status === filter)
    .filter(s =>
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.roll_no?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
    );

  const branches = [...new Set(students.map(s => s.branch))].filter(Boolean);

  return (
    <div>
      <SectionHeader title="Student Directory" sub="All registered students with readiness scores and verification status">
        <button onClick={fetchStudents} style={{ padding: '5px 12px', fontSize: 11, cursor: 'pointer', border: `1px solid ${C.gray200}`, background: '#fff', color: C.gray600, fontFamily: 'inherit' }}>⟳ Refresh</button>
      </SectionHeader>

      {/* Tier Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Students', count: students.length,                                    color: C.accent },
          { label: 'Tier 1 (Core)',  count: students.filter(s => s.tier === 'Tier1').length,    color: C.success },
          { label: 'Tier 2 (Mass)',  count: students.filter(s => s.tier === 'Tier2').length,    color: C.gold },
          { label: 'Tier 3 (Train)', count: students.filter(s => s.tier === 'Tier3').length,    color: '#b03030' },
        ].map(({ label, count, color }) => (
          <div key={label} style={{ background: '#fff', border: `1px solid ${C.gray200}`, borderTop: `3px solid ${color}`, padding: '14px 18px' }}>
            <div style={{ fontSize: 9.5, letterSpacing: '1px', textTransform: 'uppercase', color: C.gray400, fontWeight: 600, marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 28, fontWeight: 600, color: C.navy }}>{count}</div>
          </div>
        ))}
      </div>

      <TableCard>
        <Toolbar search={search} onSearch={setSearch} placeholder="Search by name, roll, or email...">
          {['All', 'Tier1', 'Tier2', 'Tier3', 'Pending', 'Approved'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '4px 10px', fontSize: 10.5, fontWeight: 600, cursor: 'pointer', border: `1px solid ${filter === f ? C.navy : C.gray200}`, background: filter === f ? C.navy : '#fff', color: filter === f ? '#fff' : C.gray600, fontFamily: 'inherit' }}>
              {f}
            </button>
          ))}
        </Toolbar>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: C.gray400 }}>Loading students...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 900 }}>
              <thead>
                <tr style={{ background: C.navy }}>
                  {['Roll No', 'Student', 'Branch', 'CGPA', 'Backlogs', 'ES Score', 'Tier', 'Verification', 'Skills'].map(h => <TH key={h}>{h}</TH>)}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: C.gray400 }}>No students found.</td></tr>
                )}
                {filtered.map((s, i) => (
                  <tr key={s._id} style={{ borderBottom: `1px solid ${C.gray100}`, background: i % 2 === 0 ? '#fff' : C.gray50 }}>
                    <TD><MONO style={{ fontSize: 11 }}>{s.roll_no}</MONO></TD>
                    <TD>
                      <div style={{ fontWeight: 500 }}>{s.full_name}</div>
                      <div style={{ fontSize: 10, color: C.gray400 }}>{s.email}</div>
                    </TD>
                    <TD>{s.branch}</TD>
                    <TD><MONO>{s.cgpa}</MONO></TD>
                    <TD><MONO>{s.active_backlogs}</MONO></TD>
                    <TD><MONO style={{ color: C.accent, fontWeight: 600 }}>{s.readiness_score}</MONO></TD>
                    <TD>
                      <span style={{ padding: '2px 8px', fontSize: 10, fontWeight: 700, color: tierColor[s.tier], background: `${tierColor[s.tier]}18`, border: `1px solid ${tierColor[s.tier]}40` }}>
                        {s.tier === 'Tier1' ? 'T1 Core' : s.tier === 'Tier2' ? 'T2 Mass' : 'T3 Train'}
                      </span>
                    </TD>
                    <TD>
                      <span style={{ padding: '2px 8px', fontSize: 10, fontWeight: 600, color: verColor[s.verification_status], background: `${verColor[s.verification_status]}18`, border: `1px solid ${verColor[s.verification_status]}40` }}>
                        {s.verification_status}
                      </span>
                    </TD>
                    <TD>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, maxWidth: 200 }}>
                        {(s.skills || []).slice(0, 3).map(sk => (
                          <span key={sk} style={{ padding: '1px 6px', fontSize: 9.5, background: '#eef3fb', color: C.accent, border: `1px solid ${C.accent}30` }}>{sk}</span>
                        ))}
                        {s.skills?.length > 3 && <span style={{ fontSize: 9.5, color: C.gray400 }}>+{s.skills.length - 3}</span>}
                      </div>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>
    </div>
  );
}
