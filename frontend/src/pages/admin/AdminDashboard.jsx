import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { C, KpiCard, Panel, SectionHeader, SkillBar, Btn } from '../../components/admin/ui';
import { getBatchRisk, getMLHealth, trainModels } from '../../utils/mlApi';

export default function DashboardTab() {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [mlRisk,     setMlRisk]     = useState(null);
  const [mlHealth,   setMlHealth]   = useState(null);
  const [training,   setTraining]   = useState(false);
  const [trainMsg,   setTrainMsg]   = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const { data: d } = await api.get('/admin/dashboard');
      setData(d);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchML = async () => {
    try {
      const [riskRes, healthRes] = await Promise.allSettled([
        getBatchRisk(),
        getMLHealth(),
      ]);
      if (riskRes.status   === 'fulfilled') setMlRisk(riskRes.value.data);
      if (healthRes.status === 'fulfilled') setMlHealth(healthRes.value.data);
    } catch {}
  };

  const handleTrain = async () => {
    setTraining(true); setTrainMsg('');
    try {
      const res = await trainModels();
      setTrainMsg(`✅ ${res.data.message || 'Models retrained successfully'}`);
    } catch (e) {
      setTrainMsg(`❌ ${e.response?.data?.error || 'Training failed — is ML service running?'}`);
    } finally { setTraining(false); }
  };

  useEffect(() => { fetchDashboard(); fetchML(); }, []);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: C.gray400, fontSize: 13 }}>
        Loading dashboard data...
      </div>
    );
  }

  const { kpis, recentActivity, upcomingDrives, verificationBreakdown } = data;
  const total = verificationBreakdown.approved + verificationBreakdown.pending + verificationBreakdown.rejected || 1;

  return (
    <div>
      <SectionHeader title="Dashboard Overview" sub="Placement Season Snapshot — AY 2025–26">
        <Btn variant="ghost" size="sm" onClick={fetchDashboard}>⟳ Refresh</Btn>
      </SectionHeader>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        <KpiCard label="Total Students Registered" value={kpis.totalStudents} accent={C.accent}
          sub={<>Live data from MongoDB</>} />
        <KpiCard label="Pending Verifications" value={kpis.pendingVerif} accent={C.gold}
          sub={<><span style={{ color: '#b03030', fontWeight: 600 }}>⚠</span> Requires attention</>} />
        <KpiCard label="Active Company Drives" value={kpis.activeDrives} accent={C.success}
          sub={<>Upcoming + Active drives</>} />
        <KpiCard label="At-Risk Students" value={kpis.atRisk} accent="#b03030"
          sub={<><span style={{ color: '#b03030', fontWeight: 600 }}>Score &lt; 60</span> · Needs Training</>} />
      </div>

      {/* Panels Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
        <Panel head="Recent Activity" badge="LIVE">
          {recentActivity.length === 0 && (
            <div style={{ padding: '20px 14px', color: C.gray400, fontSize: 12, textAlign: 'center' }}>No recent activity.</div>
          )}
          {recentActivity.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderBottom: i < recentActivity.length - 1 ? `1px solid ${C.gray100}` : 'none', fontSize: 12 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.accent, marginTop: 4, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{r.student_id?.full_name || 'Student'}</div>
                <div style={{ fontSize: 11, color: C.gray600, marginTop: 1 }}>Applied to {r.drive_id?.company_name || 'drive'} · Status: {r.status}</div>
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: C.gray400, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}
              </div>
            </div>
          ))}
        </Panel>

        <Panel head="Upcoming Company Drives" badge={`${upcomingDrives.length} ACTIVE`}>
          {upcomingDrives.length === 0 && (
            <div style={{ padding: '20px 14px', color: C.gray400, fontSize: 12, textAlign: 'center' }}>No upcoming drives.</div>
          )}
          {upcomingDrives.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', borderBottom: i < upcomingDrives.length - 1 ? `1px solid ${C.gray100}` : 'none' }}>
              <div style={{ background: C.navy, color: C.gold, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, fontWeight: 700, padding: '3px 7px', minWidth: 52, textAlign: 'center' }}>
                {d.company_name?.substring(0, 4).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{d.company_name}</div>
                <div style={{ fontSize: 11, color: C.gray400, marginTop: 1 }}>{d.job_role}</div>
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: C.gray400, textAlign: 'right' }}>
                {d.visit_date ? new Date(d.visit_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
              </div>
            </div>
          ))}
        </Panel>
      </div>

      {/* Panels Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Panel head="Student Verification Status">
          <div style={{ padding: 16 }}>
            <SkillBar label="Approved" pct={Math.round(verificationBreakdown.approved / total * 100)} fill={C.success} />
            <SkillBar label="Pending"  pct={Math.round(verificationBreakdown.pending  / total * 100)} fill={C.gold} />
            <SkillBar label="Rejected" pct={Math.round(verificationBreakdown.rejected / total * 100)} fill="#b03030" />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {[
                [`${verificationBreakdown.approved}`, 'Approved'],
                [`${verificationBreakdown.pending}`,  'Pending'],
                [`${verificationBreakdown.rejected}`, 'Rejected'],
              ].map(([v, l]) => (
                <div key={l} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: '8px 14px', border: `1px solid ${C.gray200}`, background: C.gray50, minWidth: 80 }}>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 20, fontWeight: 600, color: C.navy }}>{v}</div>
                  <div style={{ fontSize: 9, color: C.gray400, letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: 600, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel head="System Info">
          <div style={{ padding: 16, fontSize: 12, color: C.gray600 }}>
            {[
              ['Database', 'MongoDB (Mongoose ODM)'],
              ['Backend',  'Node.js + Express REST API'],
              ['Auth',     'JWT (7d expiry) + bcryptjs'],
              ['Upload',   'Multer' + (import.meta.env.VITE_USE_CLOUDINARY === 'true' ? ' + Cloudinary' : ' (Local Storage)')],
              ['Scoring',  'ES = Academic×0.4 + Technical×0.3 + Aptitude×0.3'],
              ['ML Engine', mlHealth ? `${mlHealth.status === 'ok' ? '🟢 Online' : '🔴 Offline'} · Tesseract ${mlHealth.models?.placement_predictor ? '✓' : '—'}` : '⏳ Checking…'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.gray100}` }}>
                <span style={{ fontWeight: 600, color: C.gray800 }}>{k}</span>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{v}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ── ML Risk Intelligence Panel ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 22 }}>
        <Panel head="🤖 ML Risk Intelligence" badge="SPIE">
          {!mlRisk ? (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: 12, color: C.gray400 }}>Loading risk data…</div>
          ) : (
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'High Risk',   val: mlRisk.summary?.High   || 0, color: '#b03030', bg: '#fee2e2' },
                  { label: 'Medium Risk', val: mlRisk.summary?.Medium || 0, color: '#854d0e', bg: '#fef9c3' },
                  { label: 'Low Risk',    val: mlRisk.summary?.Low    || 0, color: '#166534', bg: '#dcfce7' },
                ].map(r => (
                  <div key={r.label} style={{ background: r.bg, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 22, fontWeight: 700, color: r.color }}>{r.val}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: r.color, marginTop: 2 }}>{r.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: C.gray600, marginBottom: 12 }}>
                {mlRisk.students?.filter(s => s.risk_level === 'High Risk').slice(0, 3).map(s => (
                  <div key={s._id} style={{ padding: '5px 0', borderBottom: `1px solid ${C.gray100}`, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500 }}>{s.full_name}</span>
                    <span style={{ color: '#b03030', fontWeight: 700, fontSize: 10 }}>High Risk</span>
                  </div>
                ))}
              </div>
              {trainMsg && <div style={{ fontSize: 11, color: trainMsg.startsWith('✅') ? '#166534' : '#b03030', marginBottom: 8 }}>{trainMsg}</div>}
              <Btn variant="primary" size="sm" onClick={handleTrain} disabled={training}>
                {training ? 'Training…' : '⚙️ Retrain ML Models'}
              </Btn>
            </div>
          )}
        </Panel>

        <Panel head="📈 Placement Probability Distribution" badge="Random Forest">
          {!mlRisk ? (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: 12, color: C.gray400 }}>Loading…</div>
          ) : (
            <div style={{ padding: 16 }}>
              {mlRisk.students?.slice(0, 8).map((s, i) => {
                const pct = Math.round((s.cgpa || 0) / 10 * 100);
                const riskColor = s.risk_level === 'High Risk' ? '#b03030' : s.risk_level === 'Medium Risk' ? '#854d0e' : '#166534';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                    <span style={{ fontSize: 11, width: 100, fontWeight: 500, flexShrink: 0 }}>{s.full_name?.split(' ')[0] || 'Student'}</span>
                    <div style={{ flex: 1, height: 6, background: C.gray100, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: riskColor, transition: 'width 0.8s ease' }} />
                    </div>
                    <span style={{ fontSize: 10, color: riskColor, fontWeight: 700, width: 68, textAlign: 'right', flexShrink: 0 }}>
                      {s.risk_level || '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
