import { C, SectionHeader, SkillBar, ScoreBar, TableCard, Toolbar, TH, TD, MONO } from './ui';

const STUDENTS = [
  { roll: '24B-CO-027', name: 'Raj Upaskar',     score: 91, dsa: 88, oops: 90, cgpa: 8.5, tier: 'Tier 1' },
  { roll: '24B-CO-013', name: 'Priya Velkar',     score: 88, dsa: 85, oops: 86, cgpa: 8.1, tier: 'Tier 1' },
  { roll: '24B-CO-003', name: 'Abdullah Mukadam', score: 82, dsa: 79, oops: 81, cgpa: 7.8, tier: 'Tier 1' },
  { roll: '24B-CO-019', name: 'Deepangsh Naik',   score: 74, dsa: 70, oops: 72, cgpa: 7.0, tier: 'Tier 2' },
  { roll: '24B-CO-007', name: 'Ayush Sharma',     score: 61, dsa: 58, oops: 62, cgpa: 6.8, tier: 'Tier 2' },
  { roll: '24B-CO-015', name: 'Akshay Pillai',    score: 55, dsa: 50, oops: 55, cgpa: 6.4, tier: 'Training' },
  { roll: '24B-CO-001', name: 'Kanak Waradkar',   score: 49, dsa: 45, oops: 48, cgpa: 5.8, tier: 'Training' },
  { roll: '24B-CO-025', name: 'Rohan Gaonkar',    score: 48, dsa: 44, oops: 47, cgpa: 5.9, tier: 'Training' },
  { roll: '24B-CO-022', name: 'Sahil Sawant',     score: 43, dsa: 40, oops: 42, cgpa: 5.5, tier: 'Training' },
];

const atRiskList = STUDENTS.filter(s => s.score < 60);
const readyList  = STUDENTS.filter(s => s.score >= 70);
const avg        = Math.round(STUDENTS.reduce((a, s) => a + s.score, 0) / STUDENTS.length);

const insightCards = [
  { val: readyList.length, label: 'Placement Ready', sub: 'Score ≥ 70 · Tier 1 or 2', accent: C.accent },
  { val: avg,              label: 'Average Score',    sub: 'Across all registered students', accent: C.gold },
  { val: atRiskList.length,label: 'At-Risk Students', sub: 'Score < 60 · Needs intervention', accent: '#b03030' },
];

const tierColor = t => t === 'Tier 1' ? C.success : t === 'Tier 2' ? C.accent : C.warn;

export default function ReadinessTab() {
  return (
    <div>
      <SectionHeader title="Readiness & Early-Warning Analytics" sub="Heuristic-based placement readiness scoring · Early intervention for at-risk students" />

      {/* Insight strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
        {insightCards.map(({ val, label, sub, accent }) => (
          <div key={label} style={{ padding: '14px 16px', border: `1px solid ${C.gray200}`, background: '#fff', borderLeft: `4px solid ${accent}` }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 22, fontWeight: 600, color: C.navy }}>{val}</div>
            <div style={{ fontSize: 10, color: C.gray400, letterSpacing: '0.6px', textTransform: 'uppercase', fontWeight: 600, marginTop: 4 }}>{label}</div>
            <div style={{ fontSize: 11, color: C.gray600, marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
        <div style={{ background: '#fff', border: `1px solid ${C.gray200}`, padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: C.gray800, marginBottom: 12 }}>Average Skill Proficiency</div>
          <SkillBar label="DSA" pct={Math.round(STUDENTS.reduce((a,s)=>a+s.dsa,0)/STUDENTS.length)} fill={C.accent} />
          <SkillBar label="OOP / Java" pct={Math.round(STUDENTS.reduce((a,s)=>a+s.oops,0)/STUDENTS.length)} fill={C.accent} />
          <SkillBar label="Overall Score" pct={avg} fill={avg < 60 ? '#b03030' : avg < 70 ? '#cc6e1a' : C.success} />
        </div>
        <div style={{ background: '#fff', border: `1px solid ${C.gray200}`, padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: C.gray800, marginBottom: 12 }}>Tier Distribution</div>
          {[['Tier 1', 'Tier 1', C.success], ['Tier 2', 'Tier 2', C.accent], ['Training Mode', 'Training', '#b03030']].map(([label, key, fill]) => {
            const count = STUDENTS.filter(s => s.tier === key).length;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 11, width: 100, color: C.gray600, fontWeight: 500 }}>{label}</div>
                <div style={{ flex: 1, height: 8, background: C.gray200 }}>
                  <div style={{ width: `${(count/STUDENTS.length)*100}%`, height: '100%', background: fill }} />
                </div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: C.gray400, width: 20, textAlign: 'right' }}>{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full table */}
      <TableCard>
        <Toolbar title="Readiness Scores — All Students" count={STUDENTS.length} />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead><tr>{['Roll No.','Name','DSA Marks','OOP Marks','CGPA','Readiness Score','Tier','Status'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {STUDENTS.map(s => {
                const risk = s.score < 60;
                return (
                  <tr key={s.roll} style={{ borderBottom: `1px solid ${C.gray100}`, ...(risk ? { background: '#fdf0ef', borderLeft: '3px solid #cc6666' } : {}) }}>
                    <td style={{ ...TD, ...MONO }}>{s.roll}</td>
                    <td style={{ ...TD, fontWeight: 500 }}>{s.name}</td>
                    <td style={TD}><ScoreBar val={s.dsa} /></td>
                    <td style={TD}><ScoreBar val={s.oops} /></td>
                    <td style={{ ...TD, ...MONO }}>{s.cgpa}</td>
                    <td style={TD}><ScoreBar val={s.score} /></td>
                    <td style={{ ...TD, fontSize: 10, fontWeight: 700, color: tierColor(s.tier) }}>{s.tier.toUpperCase()}</td>
                    <td style={TD}><span style={{ fontSize: 10, fontWeight: 700, color: risk ? '#b03030' : C.success }}>{risk ? '⚠ AT-RISK' : '✓ OK'}</span></td>
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
