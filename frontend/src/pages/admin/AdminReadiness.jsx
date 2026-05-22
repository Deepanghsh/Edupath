import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { C, SectionHeader, Panel, SkillBar } from '../../components/admin/ui';

export default function ReadinessTab() {
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studRes, analRes] = await Promise.all([
          api.get('/admin/students'),
          api.get('/admin/analytics/placements'),
        ]);
        setStudents(studRes.data);
        setAnalytics(analRes.data);
      } catch (err) { console.error('Readiness fetch error:', err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: C.gray400, fontSize: 13 }}>Loading analytics...</div>;
  }

  const sorted  = [...students].sort((a, b) => b.readiness_score - a.readiness_score);
  const atRisk  = students.filter(s => s.readiness_score < 60);
  const flagged = students.filter(s => s.rejection_count >= 3);

  const tierColor = { Tier1: C.success, Tier2: C.gold, Tier3: '#b03030' };

  const searched = sorted.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_no?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <SectionHeader title="Placement Readiness Analytics" sub="Heuristic Employability Score — formula: Academic×0.4 + Technical×0.3 + Aptitude×0.3" />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Avg ES Score',   value: analytics?.avgScore   ?? '—', color: C.accent },
          { label: 'Tier 1 (Core)',  value: analytics?.tier1      ?? 0,   color: C.success },
          { label: 'Tier 2 (Mass)',  value: analytics?.tier2      ?? 0,   color: C.gold },
          { label: 'At-Risk (< 60)', value: atRisk.length,                color: '#b03030' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#fff', border: `1px solid ${C.gray200}`, borderTop: `3px solid ${color}`, padding: '14px 18px' }}>
            <div style={{ fontSize: 9.5, letterSpacing: '1px', textTransform: 'uppercase', color: C.gray400, fontWeight: 600, marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 28, fontWeight: 600, color: C.navy }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Tier distribution */}
        <Panel head="Tier Distribution">
          <div style={{ padding: 16 }}>
            <SkillBar label={`Tier 1 — Core Ready (${analytics?.tier1 || 0})`} pct={Math.round((analytics?.tier1 || 0) / (analytics?.total_students || 1) * 100)} fill={C.success} />
            <SkillBar label={`Tier 2 — Mass Ready (${analytics?.tier2 || 0})`}  pct={Math.round((analytics?.tier2 || 0) / (analytics?.total_students || 1) * 100)} fill={C.gold} />
            <SkillBar label={`Tier 3 — Training   (${analytics?.tier3 || 0})`}  pct={Math.round((analytics?.tier3 || 0) / (analytics?.total_students || 1) * 100)} fill="#b03030" />
          </div>
        </Panel>

        {/* Flagged students */}
        <Panel head={`⚑ Flagged Students (${flagged.length})`} badge={flagged.length > 0 ? 'ATTENTION' : 'CLEAR'}>
          {flagged.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: C.gray400, fontSize: 12 }}>No flagged students. 🎉</div>
          ) : (
            flagged.map((s, i) => (
              <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: i < flagged.length - 1 ? `1px solid ${C.gray100}` : 'none', fontSize: 12 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#b03030', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{s.full_name}</div>
                  <div style={{ fontSize: 11, color: C.gray400 }}>{s.roll_no} · Rejections: {s.rejection_count}</div>
                </div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#b03030', fontWeight: 600 }}>ES: {s.readiness_score}</div>
              </div>
            ))
          )}
        </Panel>
      </div>

      {/* Full leaderboard */}
      <div style={{ background: '#fff', border: `1px solid ${C.gray200}` }}>
        <div style={{ padding: '9px 13px', borderBottom: `1px solid ${C.gray200}`, background: C.gray50, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.gray800, marginRight: 'auto' }}>Readiness Leaderboard</div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student..."
            style={{ padding: '5px 10px', border: `1px solid ${C.gray200}`, fontSize: 12, fontFamily: 'inherit', width: 180, outline: 'none' }} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: C.navy }}>
                {['#', 'Student', 'Roll No', 'CGPA', 'DSA', 'OOPs', 'ES Score', 'Tier'].map(h => (
                  <th key={h} style={{ padding: '9px 13px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.9px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {searched.map((s, i) => (
                <tr key={s._id} style={{ borderBottom: `1px solid ${C.gray100}`, background: i % 2 === 0 ? '#fff' : C.gray50 }}>
                  <td style={{ padding: '9px 13px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: C.gray400 }}>#{i + 1}</td>
                  <td style={{ padding: '9px 13px', fontWeight: 500 }}>{s.full_name}</td>
                  <td style={{ padding: '9px 13px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{s.roll_no}</td>
                  <td style={{ padding: '9px 13px', fontFamily: 'IBM Plex Mono, monospace' }}>{s.cgpa}</td>
                  <td style={{ padding: '9px 13px', fontFamily: 'IBM Plex Mono, monospace' }}>{s.dsa_marks}</td>
                  <td style={{ padding: '9px 13px', fontFamily: 'IBM Plex Mono, monospace' }}>{s.oops_marks}</td>
                  <td style={{ padding: '9px 13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 4, background: C.gray200, overflow: 'hidden', maxWidth: 80 }}>
                        <div style={{ height: '100%', background: tierColor[s.tier] || C.accent, width: `${s.readiness_score}%`, transition: 'width 1s ease' }} />
                      </div>
                      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 600, color: tierColor[s.tier] }}>{s.readiness_score}</span>
                    </div>
                  </td>
                  <td style={{ padding: '9px 13px' }}>
                    <span style={{ padding: '2px 7px', fontSize: 10, fontWeight: 700, color: tierColor[s.tier], background: `${tierColor[s.tier]}18`, border: `1px solid ${tierColor[s.tier]}40` }}>
                      {s.tier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
