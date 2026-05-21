import { useState } from 'react';
import { MOCK_DRIVES } from '../../data/mockData';
import { C, CARD, SECTION_TITLE, Pill } from './ui';

export default function DriveBrowser({ student, addToast }) {
  const [search, setSearch] = useState('');

  const drives = MOCK_DRIVES.filter(d =>
    d.company_name.toLowerCase().includes(search.toLowerCase()) ||
    d.job_role.toLowerCase().includes(search.toLowerCase())
  );

  const isEligible = d => student.cgpa >= d.min_cgpa_required && student.active_backlogs <= d.max_backlogs_allowed;

  const TH = { padding: '9px 13px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.9px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', background: C.navy, whiteSpace: 'nowrap' };
  const TD = { padding: '9px 13px', verticalAlign: 'middle', borderBottom: `1px solid ${C.gray100}`, fontSize: 12.5 };

  return (
    <div style={{ padding: '24px 28px', background: C.gray50, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ color: C.navy, fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>Drive Browser</h1>
        <p style={{ color: C.gray400, fontSize: 12, marginTop: 4 }}>Browse and apply to company drives. Your eligibility is calculated in real time.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total Drives', value: MOCK_DRIVES.length, accent: C.accent },
          { label: 'Eligible for You', value: MOCK_DRIVES.filter(isEligible).length, accent: C.success },
          { label: 'Your CGPA', value: student.cgpa, accent: C.gold },
        ].map((k, i) => (
          <div key={i} style={{ ...CARD, padding: '14px 18px', borderTop: `3px solid ${k.accent}` }}>
            <div style={{ fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase', color: C.gray400, fontWeight: 600, marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 26, fontWeight: 600, color: C.navy, lineHeight: 1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ ...CARD, marginBottom: 22 }}>
        <div style={{ padding: '9px 13px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${C.gray200}`, background: C.gray50, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.gray800, marginRight: 'auto' }}>All Company Drives — AY 2025-26</div>
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, background: C.gray100, color: C.gray600, border: `1px solid ${C.gray200}`, padding: '2px 8px' }}>{drives.length} records</span>
          <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.gray200}`, background: '#fff', padding: '4px 8px', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="#8d97aa" strokeWidth="1.5"/><line x1="11" y1="11" x2="15" y2="15" stroke="#8d97aa" strokeWidth="1.5"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search drives..." style={{ border: 'none', outline: 'none', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 12, color: C.gray800, width: 160, background: 'transparent' }} />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr>{['Company', 'Job Role', 'Min CGPA', 'Max Backlogs', 'Avg Package', 'Visit Date', 'Eligibility', 'Action'].map(h => <th key={h} style={TH}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {drives.map(drive => {
                const eligible = isEligible(drive);
                return (
                  <tr key={drive.drive_id} style={{ borderBottom: `1px solid ${C.gray100}`, background: eligible ? '#fff' : C.gray50 }}>
                    <td style={{ ...TD, fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ background: C.navy, color: C.gold, fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, fontWeight: 700, padding: '3px 6px' }}>{drive.company_name.substring(0, 3).toUpperCase()}</div>
                        {drive.company_name}
                      </div>
                    </td>
                    <td style={{ ...TD, color: C.gray600 }}>{drive.job_role}</td>
                    <td style={{ ...TD, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{drive.min_cgpa_required}</td>
                    <td style={{ ...TD, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{drive.max_backlogs_allowed}</td>
                    <td style={{ ...TD, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: C.success, fontWeight: 600 }}>{drive.avg_package}</td>
                    <td style={{ ...TD, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{drive.visit_date}</td>
                    <td style={TD}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: eligible ? C.success : C.red }}>
                        {eligible ? '✓ Eligible' : '✗ Ineligible'}
                      </span>
                    </td>
                    <td style={TD}>
                      {eligible ? (
                        <button onClick={() => addToast(`Applied to ${drive.company_name}!`, 'success')}
                          style={{ padding: '3px 10px', background: C.accent, color: '#fff', border: `1px solid ${C.accent}`, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                          Apply Now
                        </button>
                      ) : (
                        <span style={{ fontSize: 10, color: C.gray400 }}>Not Eligible</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
