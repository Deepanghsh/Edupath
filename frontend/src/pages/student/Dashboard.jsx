import { MOCK_DRIVES, MOCK_APPLICATIONS } from '../../data/mockData';
import { C, CARD, SECTION_TITLE, Pill } from './ui';

export default function Dashboard({ student, setPage }) {
  const eligibleDrives = MOCK_DRIVES.filter(
    d => student.cgpa >= d.min_cgpa_required && student.active_backlogs <= d.max_backlogs_allowed
  );

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = (student.readiness_score / 100) * circumference;

  const kpis = [
    { label: 'CGPA', value: student.cgpa, sub: '/ 10.0', accent: C.accent },
    { label: 'Active Backlogs', value: student.active_backlogs, sub: 'backlogs', accent: student.active_backlogs > 0 ? C.red : C.success },
    { label: 'Eligible Drives', value: eligibleDrives.length, sub: 'available', accent: C.gold },
    { label: 'Applications', value: MOCK_APPLICATIONS.length, sub: 'submitted', accent: C.pending },
  ];

  const statusColors = { Applied: C.pending, Shortlisted: C.gold, Selected: C.success, Rejected: C.red };

  return (
    <div style={{ padding: '24px 28px', background: C.gray50, minHeight: '100vh' }}>

      {/* Page header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ color: C.navy, fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>
          Welcome back, {student.full_name.split(' ')[0]}!
        </h1>
        <p style={{ color: C.gray400, fontSize: 12, marginTop: 4 }}>Here's your placement overview for this season.</p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ ...CARD, padding: '16px 18px', borderTop: `3px solid ${k.accent}` }}>
            <div style={{ fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase', color: C.gray400, fontWeight: 600, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 28, fontWeight: 600, color: C.navy, lineHeight: 1, marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 10.5, color: C.gray400 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Readiness + Drives */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, marginBottom: 16 }}>

        {/* Readiness card */}
        <div style={{ ...CARD, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ ...SECTION_TITLE, marginBottom: 18 }}>Placement Readiness</div>
          <div style={{ position: 'relative', width: 130, height: 130 }}>
            <svg width={130} height={130} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={65} cy={65} r={radius} fill="none" stroke={C.gray200} strokeWidth={10} />
              <circle cx={65} cy={65} r={radius} fill="none" stroke={C.accent} strokeWidth={10}
                strokeDasharray={circumference} strokeDashoffset={circumference - progress}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 26, fontWeight: 700, color: C.accent }}>{student.readiness_score}%</div>
              <div style={{ fontSize: 10, color: C.gray400 }}>Score</div>
            </div>
          </div>
          <div style={{ marginTop: 14, padding: '5px 14px', background: C.pendingBg, border: `1px solid #b0c6e8`, color: C.pending, fontWeight: 700, fontSize: 12 }}>
            {student.tier === 'Tier 1' ? '🏆 CORE READY' : student.tier === 'Tier 2' ? '⚡ MASS READY' : '📚 TRAINING MODE'}
          </div>
          <div style={{ marginTop: 16, width: '100%' }}>
            {[{ label: 'DSA Marks', val: student.dsa_marks }, { label: 'OOPs Marks', val: student.oops_marks }].map((item, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: C.gray400, fontSize: 11 }}>{item.label}</span>
                  <span style={{ color: C.gray800, fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}>{item.val}/100</span>
                </div>
                <div style={{ height: 5, background: C.gray200 }}>
                  <div style={{ width: `${item.val}%`, height: '100%', background: C.accent, transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Eligible drives */}
        <div style={{ ...CARD, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={SECTION_TITLE}>Eligible Drives</div>
            <button onClick={() => setPage('drives')} style={{ color: C.accent, background: 'none', border: 'none', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>View All →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {eligibleDrives.slice(0, 5).map(drive => (
              <div key={drive.drive_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: C.gray50, border: `1px solid ${C.gray200}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: C.navy, color: C.gold, fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, fontWeight: 700, padding: '3px 6px', letterSpacing: '0.5px' }}>
                    {drive.company_name.substring(0, 4).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: C.gray800, fontWeight: 600, fontSize: 13 }}>{drive.company_name}</div>
                    <div style={{ color: C.gray400, fontSize: 11 }}>{drive.job_role} · {drive.visit_date}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: C.success, fontWeight: 700, fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }}>{drive.avg_package}</div>
                  <div style={{ color: C.gray400, fontSize: 10 }}>avg pkg</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div style={{ ...CARD, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={SECTION_TITLE}>Recent Applications</div>
          <button onClick={() => setPage('applications')} style={{ color: C.accent, background: 'none', border: 'none', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>View All →</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: C.navy }}>
                {['Company', 'Role', 'Applied Date', 'Status'].map(h => (
                  <th key={h} style={{ padding: '9px 13px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.9px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_APPLICATIONS.map(app => (
                <tr key={app.app_id} style={{ borderBottom: `1px solid ${C.gray100}` }}>
                  <td style={{ padding: '9px 13px', fontWeight: 500 }}>{app.company_name}</td>
                  <td style={{ padding: '9px 13px', color: C.gray400 }}>{app.job_role}</td>
                  <td style={{ padding: '9px 13px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{app.applied_date || 'May 2026'}</td>
                  <td style={{ padding: '9px 13px' }}><Pill>{app.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
