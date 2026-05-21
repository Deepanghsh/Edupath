import { useState } from 'react';
import { MOCK_APPLICATIONS } from '../../data/mockData';
import { C, CARD, SECTION_TITLE, Pill } from './ui';

const FILTERS = ['All', 'Applied', 'Shortlisted', 'Selected', 'Rejected'];

export default function MyApplications() {
  const [filter, setFilter] = useState('All');

  const filtered = MOCK_APPLICATIONS.filter(a => filter === 'All' || a.status === filter);
  const counts = FILTERS.reduce((acc, f) => ({ ...acc, [f]: f === 'All' ? MOCK_APPLICATIONS.length : MOCK_APPLICATIONS.filter(a => a.status === f).length }), {});

  const TH = { padding: '9px 13px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.9px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', background: C.navy };
  const TD = { padding: '9px 13px', verticalAlign: 'middle', borderBottom: `1px solid ${C.gray100}`, fontSize: 12.5 };

  return (
    <div style={{ padding: '24px 28px', background: C.gray50, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ color: C.navy, fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>My Applications</h1>
        <p style={{ color: C.gray400, fontSize: 12, marginTop: 4 }}>Track the status of all your company drive applications.</p>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        {FILTERS.filter(f => f !== 'All').map(f => (
          <div key={f} style={{ ...CARD, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 18px', borderTop: `3px solid ${f === 'Selected' ? C.success : f === 'Rejected' ? C.red : f === 'Shortlisted' ? C.gold : C.pending}` }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 26, fontWeight: 600, color: C.navy, lineHeight: 1 }}>{counts[f]}</div>
            <div style={{ fontSize: 9.5, color: C.gray400, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, marginTop: 6 }}>{f}</div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '4px 12px', border: `1px solid ${filter === f ? C.navy : C.gray200}`, fontSize: 11.5, cursor: 'pointer', fontFamily: 'IBM Plex Sans, sans-serif', background: filter === f ? C.navy : '#fff', color: filter === f ? '#fff' : C.gray600, fontWeight: filter === f ? 500 : 400 }}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={CARD}>
        <div style={{ padding: '9px 13px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${C.gray200}`, background: C.gray50 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.gray800, marginRight: 'auto' }}>Application History</div>
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, background: C.gray100, color: C.gray600, border: `1px solid ${C.gray200}`, padding: '2px 8px' }}>{filtered.length} records</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr>{['App ID', 'Company', 'Job Role', 'Applied On', 'Status'].map(h => <th key={h} style={TH}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(app => (
                <tr key={app.app_id} style={{ borderBottom: `1px solid ${C.gray100}` }}>
                  <td style={{ ...TD, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{app.app_id}</td>
                  <td style={{ ...TD, fontWeight: 500 }}>{app.company_name}</td>
                  <td style={{ ...TD, color: C.gray600 }}>{app.job_role}</td>
                  <td style={{ ...TD, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{app.applied_date || 'May 2026'}</td>
                  <td style={TD}><Pill>{app.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
