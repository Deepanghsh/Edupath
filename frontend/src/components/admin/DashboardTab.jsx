import { C, KpiCard, Panel, SectionHeader, SkillBar, Btn } from './ui';

const activityLog = [
  { color: '#b03030', name: 'Kanak Waradkar',   msg: 'Document verification rejected — CGPA mismatch',        time: '09:14' },
  { color: C.accent,  name: 'Abdullah Mukadam', msg: 'Applied for TCS – System Analyst drive',                 time: '09:02' },
  { color: C.gold,    name: 'Ayush Sharma',      msg: 'Profile submitted, awaiting mark-sheet verification',    time: '08:50' },
  { color: C.success, name: 'Deepangsh Naik',    msg: 'Shortlisted for Wipro – UI/UX Designer',                time: '08:31' },
  { color: C.accent,  name: 'Infosys Drive',     msg: 'New company drive created for Jun 02, 2026',            time: 'Yesterday' },
];

const upcomingDrives = [
  { abbr: 'TCS',   company: 'Tata Consultancy Services', role: 'System Analyst',      date: 'May 20\n2026' },
  { abbr: 'INFO',  company: 'Infosys Limited',           role: 'Software Engineer',   date: 'Jun 02\n2026' },
  { abbr: 'WIP',   company: 'Wipro Technologies',        role: 'UI/UX Designer',      date: 'Jun 10\n2026' },
  { abbr: 'MPHS',  company: 'Mphasis',                   role: 'PHP Developer',       date: 'Jun 18\n2026' },
  { abbr: 'COGS',  company: 'Cognizant Technology',      role: 'Full Stack Developer',date: 'Jun 25\n2026' },
];

export default function DashboardTab() {
  return (
    <div>
      <SectionHeader title="Dashboard Overview" sub="Placement Season Snapshot — AY 2025–26">
        <Btn variant="ghost" size="sm">↓ Export Report</Btn>
        <Btn variant="primary" size="sm">⟳ Refresh Data</Btn>
      </SectionHeader>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        <KpiCard label="Total Students Registered" value="62" accent={C.accent}
          sub={<><span style={{ color: C.success, fontWeight: 600 }}>↑ 8</span> from last semester</>} />
        <KpiCard label="Pending Verifications" value="4" accent={C.gold}
          sub={<><span style={{ color: '#b03030', fontWeight: 600 }}>⚠</span> Requires attention</>} />
        <KpiCard label="Active Company Drives" value="5" accent={C.success}
          sub={<>Next: <strong>Infosys</strong> · Jun 02</>} />
        <KpiCard label="At-Risk Students" value="7" accent="#b03030"
          sub={<><span style={{ color: '#b03030', fontWeight: 600 }}>Score &lt; 60</span> · Needs Training</>} />
      </div>

      {/* Panels Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
        <Panel head="Recent Activity Log" badge="LIVE">
          {activityLog.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderBottom: i < activityLog.length - 1 ? `1px solid ${C.gray100}` : 'none', fontSize: 12 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: r.color, marginTop: 4, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: C.gray600, marginTop: 1 }}>{r.msg}</div>
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: C.gray400, marginLeft: 'auto', paddingLeft: 10, whiteSpace: 'nowrap' }}>{r.time}</div>
            </div>
          ))}
        </Panel>

        <Panel head="Upcoming Company Drives" badge="5 ACTIVE">
          {upcomingDrives.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', borderBottom: i < upcomingDrives.length - 1 ? `1px solid ${C.gray100}` : 'none' }}>
              <div style={{ background: C.navy, color: C.gold, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, fontWeight: 700, padding: '3px 7px', letterSpacing: '0.5px', minWidth: 52, textAlign: 'center' }}>{d.abbr}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{d.company}</div>
                <div style={{ fontSize: 11, color: C.gray400, marginTop: 1 }}>{d.role}</div>
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: C.gray400, textAlign: 'right', whiteSpace: 'pre-line' }}>{d.date}</div>
            </div>
          ))}
        </Panel>
      </div>

      {/* Panels Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Panel head="Student Verification Status">
          <div style={{ padding: 16 }}>
            <SkillBar label="Approved" pct={74} fill={C.success} />
            <SkillBar label="Pending"  pct={6}  fill={C.gold} />
            <SkillBar label="Rejected" pct={19} fill="#b03030" />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {[['74%','Approved'],['6.5','Avg CGPA'],['68','Avg Score']].map(([v,l]) => (
                <div key={l} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: '8px 14px', border: `1px solid ${C.gray200}`, background: C.gray50, minWidth: 80 }}>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 20, fontWeight: 600, color: C.navy }}>{v}</div>
                  <div style={{ fontSize: 9, color: C.gray400, letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: 600, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel head="Skill Demand vs. Student Readiness">
          <div style={{ padding: 16 }}>
            <SkillBar label="PHP / Backend" pct={68} fill={C.accent} />
            <SkillBar label="UI / UX"       pct={52} fill={C.accent} />
            <SkillBar label="DSA"           pct={45} fill="#cc6e1a" />
            <SkillBar label="OOP / Java"    pct={72} fill={C.accent} />
            <SkillBar label="Full Stack"    pct={38} fill="#b03030" />
            <div style={{ fontSize: 10, color: C.gray400, marginTop: 10 }}>Based on oops_marks, dsa_marks and self-assessed skills</div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
