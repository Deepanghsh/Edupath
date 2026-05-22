import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { C, KpiCard, Panel, SectionHeader, SkillBar, Btn } from '../../components/admin/ui';

export default function DashboardTab() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { fetchDashboard(); }, []);

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
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.gray100}` }}>
                <span style={{ fontWeight: 600, color: C.gray800 }}>{k}</span>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{v}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
