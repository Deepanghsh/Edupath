import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { C, CARD, CARD_HOVER, SECTION_TITLE, Pill } from './ui';

// ── ML widgets ────────────────────────────────────────────────────────────────
import SPIEScoreCard       from '../../components/ml/SPIEScoreCard';
import DriveRecommendations from '../../components/ml/DriveRecommendations';
import SkillGapWidget      from '../../components/ml/SkillGapWidget';
import RAGChat             from '../../components/ml/RAGChat';

export default function Dashboard({ student }) {
  const [eligibleDrives, setEligibleDrives] = useState([]);
  const [applications,   setApplications]   = useState([]);
  const [loading,        setLoading]         = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [drivesRes, appsRes] = await Promise.all([
          api.get('/student/eligible-drives'),
          api.get('/student/applications'),
        ]);
        setEligibleDrives(drivesRes.data);
        setApplications(appsRes.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const s = student || {};
  const score = s.readiness_score || 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const kpis = [
    { label: 'CGPA',            value: s.cgpa             ?? '—', sub: '/ 10.0',    accent: C.accent },
    { label: 'Active Backlogs', value: s.active_backlogs  ?? 0,   sub: 'backlogs',  accent: s.active_backlogs > 0 ? C.red : C.success },
    { label: 'Eligible Drives', value: eligibleDrives.length,     sub: 'available', accent: C.gold },
    { label: 'Applications',    value: applications.length,        sub: 'submitted', accent: C.pending },
  ];

  const statusColors = { Applied: C.pending, Shortlisted: C.gold, Selected: C.success, Rejected: C.red };

  if (loading) {
    return (
      <div className="p-7 min-h-screen bg-[#f5f6f9] flex items-center justify-center">
        <div className="text-[#8d97aa] text-sm">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-7 bg-[#f5f6f9] min-h-screen">

      {/* ── Keyframe animation for spinner ── */}
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,80%,100% { transform:scaleY(0.4); } 40% { transform:scaleY(1); } }
      `}</style>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[#0d1b3e] text-[22px] font-bold m-0 tracking-[-0.3px]">
          Welcome back, {s.full_name ? s.full_name.split(' ')[0] : 'Student'}!
        </h1>
        <p className="text-[#8d97aa] text-[12px] mt-1">Here's your placement overview for this season.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k, i) => (
          <div key={i} className={`${CARD_HOVER} p-[16px_18px] border-t-[3px]`} style={{ borderTopColor: k.accent }}>
            <div className="text-[9.5px] tracking-[1px] uppercase text-[#8d97aa] font-semibold mb-2">{k.label}</div>
            <div className="font-mono text-[28px] font-semibold text-[#0d1b3e] leading-none mb-1">{k.value}</div>
            <div className="text-[10.5px] text-[#8d97aa]">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── SPIE ML Score Card (full width) ── */}
      <SPIEScoreCard />

      {/* Readiness + Drives */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 mb-4">

        {/* Readiness card */}
        <div className={`${CARD} p-6 flex flex-col items-center`}>
          <div style={SECTION_TITLE} className="mb-[18px]">Placement Readiness</div>
          <div className="relative w-[130px] h-[130px]">
            <svg width={130} height={130} className="-rotate-90">
              <circle cx={65} cy={65} r={radius} fill="none" stroke={C.gray200} strokeWidth={10} />
              <circle cx={65} cy={65} r={radius} fill="none" stroke={C.accent} strokeWidth={10}
                strokeDasharray={circumference} strokeDashoffset={circumference - progress}
                strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-mono text-[26px] font-bold text-[#1e5fa8]">{score}%</div>
              <div className="text-[10px] text-[#8d97aa]">Score</div>
            </div>
          </div>
          <div className="mt-[14px] px-[14px] py-[5px] bg-[#eef3fb] border border-[#b0c6e8] text-[#1e4d8c] font-bold text-[12px] rounded-sm">
            {s.tier === 'Tier1' ? '🏆 CORE READY' : s.tier === 'Tier2' ? '⚡ MASS READY' : '📚 TRAINING MODE'}
          </div>
          <div className="mt-4 w-full">
            {[{ label: 'DSA Marks', val: s.dsa_marks || 0 }, { label: 'OOPs Marks', val: s.oops_marks || 0 }].map((item, i) => (
              <div key={i} className="mb-2.5 group">
                <div className="flex justify-between mb-1">
                  <span className="text-[#8d97aa] text-[11px]">{item.label}</span>
                  <span className="text-[#1e2939] text-[11px] font-mono">{item.val}/100</span>
                </div>
                <div className="h-[5px] bg-[#d8dce6] overflow-hidden">
                  <div className="h-full bg-[#1e5fa8] transition-all duration-1000 ease-out" style={{ width: `${item.val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Eligible drives */}
        <div className={`${CARD} p-5`}>
          <div className="flex justify-between items-center mb-4">
            <div style={SECTION_TITLE}>Eligible Drives</div>
            <button onClick={() => navigate('/student/drives')} className="text-[#1e5fa8] bg-transparent border-none text-[12px] cursor-pointer font-semibold hover:underline">View All →</button>
          </div>
          <div className="flex flex-col gap-2">
            {eligibleDrives.length === 0 && <p className="text-[#8d97aa] text-[12px] py-4 text-center">No eligible drives at the moment.</p>}
            {eligibleDrives.slice(0, 5).map(drive => (
              <div key={drive._id} className="flex items-center justify-between p-[10px_14px] bg-[#f5f6f9] border border-[#d8dce6] hover:bg-white hover:border-[#b0c6e8] hover:shadow-sm hover:-translate-y-[1px] transition-all duration-200 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="bg-[#0d1b3e] text-[#b8902a] font-mono text-[9px] font-bold px-1.5 py-[3px] tracking-[0.5px]">
                    {drive.company_name.substring(0, 4).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[#1e2939] font-semibold text-[13px] group-hover:text-[#1e5fa8] transition-colors">{drive.company_name}</div>
                    <div className="text-[#8d97aa] text-[11px]">{drive.job_role} · {drive.visit_date}</div>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-[#1a6e3c] font-bold text-[12px] font-mono">{drive.avg_package || '—'}</div>
                  <div className="text-[#8d97aa] text-[10px]">avg pkg</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AI Drive Recommendations + Skill Gap (side by side) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <DriveRecommendations />
        <SkillGapWidget />
      </div>

      {/* ── RAG Chat ── */}
      <RAGChat />

      {/* Recent Applications */}
      <div className={`${CARD} p-5 overflow-hidden`}>
        <div className="flex justify-between items-center mb-4">
          <div style={SECTION_TITLE}>Recent Applications</div>
          <button onClick={() => navigate('/student/applications')} className="text-[#1e5fa8] bg-transparent border-none text-[12px] cursor-pointer font-semibold hover:underline">View All →</button>
        </div>
        {applications.length === 0 ? (
          <p className="text-[#8d97aa] text-[12px] py-4 text-center">No applications yet. Browse drives to apply!</p>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full border-collapse text-[12.5px] min-w-[600px]">
              <thead>
                <tr className="bg-[#0d1b3e]">
                  {['Company', 'Role', 'Applied Date', 'Status'].map(h => (
                    <th key={h} className="p-[9px_13px] text-left text-[10px] font-semibold tracking-[0.9px] uppercase text-white/75">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.slice(0, 5).map((app, i) => (
                  <tr key={app._id} className={`border-b border-[#eceef3] hover:bg-[#f8f9fa] transition-colors ${i === applications.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="p-[9px_13px] font-medium">{app.company_name}</td>
                    <td className="p-[9px_13px] text-[#8d97aa]">{app.job_role}</td>
                    <td className="p-[9px_13px] font-mono text-[11px]">{app.applied_date || '—'}</td>
                    <td className="p-[9px_13px]"><Pill>{app.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
