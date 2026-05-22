import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { C, SectionHeader, TableCard, Toolbar, Pill, Btn, TH, TD, MONO } from '../../components/admin/ui';

const STATUSES = ['All', 'Applied', 'Shortlisted', 'Selected', 'Rejected'];

export default function ApplicationsTab({ addToast }) {
  const [applications, setApplications] = useState([]);
  const [search,       setSearch]       = useState('');
  const [filter,       setFilter]       = useState('All');
  const [loading,      setLoading]      = useState(true);
  const [updating,     setUpdating]     = useState(null);
  const [feedback,     setFeedback]     = useState('');
  const [selectedApp,  setSelectedApp]  = useState(null);

  useEffect(() => { fetchApplications(); }, [filter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = filter !== 'All' ? `?status=${filter}` : '';
      const { data } = await api.get(`/admin/applications${params}`);
      setApplications(data);
    } catch (err) { console.error('Applications fetch error:', err); }
    finally { setLoading(false); }
  };

  const handleStatusUpdate = async (appId, status) => {
    if (updating) return;
    setUpdating(appId + status);
    try {
      await api.patch(`/admin/applications/${appId}/status`, { status, feedback });
      setApplications(prev => prev.map(a => a._id === appId ? { ...a, status } : a));
      addToast?.(`Application ${status.toLowerCase()}.`, status === 'Selected' ? 'success' : status === 'Rejected' ? 'error' : 'success');
      setSelectedApp(null); setFeedback('');
    } catch (err) {
      addToast?.(err.response?.data?.message || 'Update failed.', 'error');
    } finally { setUpdating(null); }
  };

  const counts = STATUSES.reduce((acc, f) => ({
    ...acc,
    [f]: f === 'All' ? applications.length : applications.filter(a => a.status === f).length,
  }), {});

  const searched = applications.filter(a =>
    a.student?.toLowerCase().includes(search.toLowerCase()) ||
    a.company?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = { Applied: C.pending, Shortlisted: C.gold, Selected: C.success, Rejected: '#b03030' };

  return (
    <div>
      <SectionHeader title="Applications Tracker" sub="Manage all student drive applications and update statuses">
        <Btn variant="ghost" size="sm" onClick={fetchApplications}>⟳ Refresh</Btn>
      </SectionHeader>

      {/* Status KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {STATUSES.filter(f => f !== 'All').map(f => (
          <div key={f} style={{ background: '#fff', border: `1px solid ${C.gray200}`, borderTop: `3px solid ${statusColor[f]}`, padding: '14px 18px', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
            onClick={() => setFilter(f)}>
            <div style={{ fontSize: 9.5, letterSpacing: '1px', textTransform: 'uppercase', color: C.gray400, fontWeight: 600, marginBottom: 6 }}>{f}</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 28, fontWeight: 600, color: C.navy }}>{counts[f]}</div>
          </div>
        ))}
      </div>

      <TableCard>
        <Toolbar search={search} onSearch={setSearch} placeholder="Search by student or company...">
          {STATUSES.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '4px 10px', fontSize: 10.5, fontWeight: 600, cursor: 'pointer', border: `1px solid ${filter === f ? C.navy : C.gray200}`, background: filter === f ? C.navy : '#fff', color: filter === f ? '#fff' : C.gray600, fontFamily: 'inherit' }}>
              {f} {counts[f] > 0 && `(${counts[f]})`}
            </button>
          ))}
        </Toolbar>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: C.gray400 }}>Loading applications...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 900 }}>
              <thead>
                <tr style={{ background: C.navy }}>
                  {['Student', 'Company', 'Role', 'Applied Date', 'Status', 'Feedback', 'Actions'].map(h => <TH key={h}>{h}</TH>)}
                </tr>
              </thead>
              <tbody>
                {searched.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: C.gray400 }}>No applications found.</td></tr>
                )}
                {searched.map((a, i) => (
                  <tr key={a._id} style={{ borderBottom: `1px solid ${C.gray100}`, background: i % 2 === 0 ? '#fff' : C.gray50 }}>
                    <TD>
                      <div style={{ fontWeight: 500 }}>{a.student}</div>
                      <div style={{ fontSize: 10, color: C.gray400 }}>{a.roll}</div>
                    </TD>
                    <TD style={{ fontWeight: 500 }}>{a.company}</TD>
                    <TD style={{ color: C.gray600 }}>{a.role}</TD>
                    <TD><MONO style={{ fontSize: 11 }}>{a.date}</MONO></TD>
                    <TD>
                      <span style={{ padding: '2px 8px', fontSize: 10, fontWeight: 600, color: statusColor[a.status], background: `${statusColor[a.status]}18`, border: `1px solid ${statusColor[a.status]}40` }}>
                        {a.status}
                      </span>
                    </TD>
                    <TD><span style={{ fontSize: 11, color: C.gray400, fontStyle: a.feedback ? 'normal' : 'italic' }}>{a.feedback || '—'}</span></TD>
                    <TD>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {['Shortlisted', 'Selected'].map(s => (
                          <Btn key={s} variant="primary" size="sm" onClick={() => handleStatusUpdate(a._id, s)}
                            disabled={a.status === s || !!updating}>
                            {updating === a._id + s ? '...' : s === 'Shortlisted' ? '📋 Shortlist' : '✅ Select'}
                          </Btn>
                        ))}
                        <Btn variant="danger" size="sm" onClick={() => setSelectedApp(a)}
                          disabled={a.status === 'Rejected' || !!updating}>
                          ✗ Reject
                        </Btn>
                      </div>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      {/* Reject Modal */}
      {selectedApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,62,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 420, padding: 24, borderTop: '4px solid #b03030', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: C.navy }}>Reject Application</div>
            <div style={{ fontSize: 12, color: C.gray600, marginBottom: 14 }}>
              Rejecting {selectedApp.student} for {selectedApp.company}. An Early Warning System notification will be triggered if rejection count reaches 3.
            </div>
            <div>
              <label style={{ fontSize: 10.5, fontWeight: 600, color: C.gray600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Feedback / Reason (optional)</label>
              <textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="e.g. Did not clear coding round" rows={3}
                style={{ display: 'block', width: '100%', marginTop: 6, padding: '8px 10px', border: `1px solid ${C.gray200}`, fontSize: 12, fontFamily: 'IBM Plex Sans, sans-serif', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => { setSelectedApp(null); setFeedback(''); }} style={{ flex: 1, padding: '8px', border: `1px solid ${C.gray200}`, background: '#fff', color: C.gray600, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={() => handleStatusUpdate(selectedApp._id, 'Rejected')} disabled={!!updating}
                style={{ flex: 1, padding: '8px', border: 'none', background: '#b03030', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                {updating ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
