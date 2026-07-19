import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { C, SectionHeader, TableCard, Toolbar, Pill, Btn, TH, TD, MONO } from '../../components/admin/ui';

export default function VerificationTab({ addToast }) {
  const [students, setStudents] = useState([]);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('All');
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState(null);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/students');
      setStudents(data);
    } catch (err) {
      console.error('Verification fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (studentId, status) => {
    setActing(studentId + status);
    try {
      await api.patch(`/admin/verify/${studentId}`, { status });
      setStudents(prev => prev.map(s => s._id === studentId ? { ...s, verification_status: status } : s));
      addToast?.(`Student ${status === 'Approved' ? 'approved' : 'rejected'} and notified.`, status === 'Approved' ? 'success' : 'error');
    } catch (err) {
      addToast?.(err.response?.data?.message || 'Action failed.', 'error');
    } finally {
      setActing(null);
    }
  };

  const pending  = students.filter(s => s.verification_status === 'Pending');
  const actioned = students.filter(s => s.verification_status !== 'Pending');

  const filteredStudents = filter === 'All' ? students
    : filter === 'Pending'  ? pending
    : filter === 'Approved' ? students.filter(s => s.verification_status === 'Approved')
    : students.filter(s => s.verification_status === 'Rejected');

  const searched = filteredStudents.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_no?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = { Approved: C.success, Pending: C.gold, Rejected: '#b03030' };

  return (
    <div>
      <SectionHeader title="Document Verification" sub="Maker-Checker workflow — review student mark sheets and approve profiles">
        <Btn variant="ghost" size="sm" onClick={fetchStudents}>⟳ Refresh</Btn>
        <Btn variant="primary" size="sm">
          {pending.length} Pending
        </Btn>
      </SectionHeader>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Pending Review', count: pending.length,                                              color: C.gold },
          { label: 'Approved',       count: students.filter(s => s.verification_status === 'Approved').length, color: C.success },
          { label: 'Rejected',       count: students.filter(s => s.verification_status === 'Rejected').length, color: '#b03030' },
        ].map(({ label, count, color }) => (
          <div key={label} style={{ background: '#fff', border: `1px solid ${C.gray200}`, borderTop: `3px solid ${color}`, padding: '14px 18px' }}>
            <div style={{ fontSize: 9.5, letterSpacing: '1px', textTransform: 'uppercase', color: C.gray400, fontWeight: 600, marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 28, fontWeight: 600, color: C.navy }}>{count}</div>
          </div>
        ))}
      </div>

      <TableCard>
        <Toolbar search={search} onSearch={setSearch} placeholder="Search by name or roll no...">
          {['All', 'Pending', 'Approved', 'Rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${filter === f ? C.navy : C.gray200}`, background: filter === f ? C.navy : '#fff', color: filter === f ? '#fff' : C.gray600, fontFamily: 'inherit' }}>
              {f}
            </button>
          ))}
        </Toolbar>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: C.gray400, fontSize: 13 }}>Loading students...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 700 }}>
              <thead>
                <tr style={{ background: C.navy }}>
                  {['Roll No', 'Student', 'CGPA', 'Backlogs', 'Status', 'Mark Sheet', 'Resume', 'Actions'].map(h => <TH key={h}>{h}</TH>)}
                </tr>
              </thead>
              <tbody>
                {searched.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: C.gray400, fontSize: 12 }}>No students found.</td></tr>
                )}
                {searched.map((s, i) => (
                  <tr key={s._id} style={{ borderBottom: `1px solid ${C.gray100}`, background: i % 2 === 0 ? '#fff' : C.gray50 }}>
                    <TD><MONO>{s.roll_no}</MONO></TD>
                    <TD>
                      <div style={{ fontWeight: 500 }}>{s.full_name}</div>
                      <div style={{ fontSize: 11, color: C.gray400 }}>{s.email}</div>
                    </TD>
                    <TD><MONO>{s.cgpa}</MONO></TD>
                    <TD><MONO>{s.active_backlogs}</MONO></TD>
                    <TD>
                      <span style={{ padding: '2px 8px', fontSize: 10, fontWeight: 600, color: statusColor[s.verification_status], background: `${statusColor[s.verification_status]}18`, border: `1px solid ${statusColor[s.verification_status]}40` }}>
                        {s.verification_status}
                      </span>
                    </TD>
                    <TD>
                      {(() => {
                        const url = s.mark_sheet_url;
                        if (!url) return <span style={{ color: C.gray400, fontSize: 11 }}>Not uploaded</span>;
                        const isCloud = url.startsWith('http');
                        return isCloud ? (
                          <a href={url} target="_blank" rel="noreferrer"
                            style={{ color: C.accent, fontSize: 11, fontWeight: 600, textDecoration: 'underline' }}>📄 View</a>
                        ) : (
                          <span style={{ color: '#b03030', fontSize: 10, fontStyle: 'italic' }}>⚠ Re-upload needed</span>
                        );
                      })()}
                    </TD>
                    <TD>
                      {(() => {
                        const url = s.resume_url;
                        if (!url) return <span style={{ color: C.gray400, fontSize: 11 }}>Not uploaded</span>;
                        const isCloud = url.startsWith('http');
                        return isCloud ? (
                          <a href={url} target="_blank" rel="noreferrer"
                            style={{ color: C.accent, fontSize: 11, fontWeight: 600, textDecoration: 'underline' }}>📎 View</a>
                        ) : (
                          <span style={{ color: '#b03030', fontSize: 10, fontStyle: 'italic' }}>⚠ Re-upload needed</span>
                        );
                      })()}
                    </TD>
                    <TD>
                      {s.verification_status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Btn variant="primary" size="sm" onClick={() => handleAction(s._id, 'Approved')} disabled={acting === s._id + 'Approved'}>
                            {acting === s._id + 'Approved' ? '...' : '✓ Approve'}
                          </Btn>
                          <Btn variant="danger" size="sm" onClick={() => handleAction(s._id, 'Rejected')} disabled={acting === s._id + 'Rejected'}>
                            {acting === s._id + 'Rejected' ? '...' : '✗ Reject'}
                          </Btn>
                        </div>
                      ) : (
                        <Btn variant="ghost" size="sm" onClick={() => handleAction(s._id, 'Pending')}>Reset</Btn>
                      )}
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
