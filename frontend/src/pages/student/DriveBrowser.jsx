import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { C, CARD, CARD_HOVER } from './ui';

export default function DriveBrowser({ student, addToast }) {
  const [drives,       setDrives]       = useState([]);
  const [appliedIds,   setAppliedIds]   = useState(new Set());
  const [applying,     setApplying]     = useState(null);
  const [search,       setSearch]       = useState('');
  const [loading,      setLoading]      = useState(true);
  const [tooltip,      setTooltip]      = useState(null); // { driveId, reasons: string[] }

  const s = student || {};

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [drivesRes, appsRes] = await Promise.all([
          api.get('/student/drives'),
          api.get('/student/applications'),
        ]);
        setDrives(drivesRes.data);
        setAppliedIds(new Set(appsRes.data.map(a => String(a.drive_id))));
      } catch (err) {
        console.error('DriveBrowser fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Returns true if student meets the drive criteria
  const isEligible = d => s.cgpa >= d.min_cgpa_required && s.active_backlogs <= d.max_backlogs_allowed;

  // Returns array of human-readable reasons why NOT eligible
  const ineligibilityReasons = (drive) => {
    const reasons = [];
    const cgpa    = s.cgpa ?? 0;
    const backlogs = s.active_backlogs ?? 0;

    if (cgpa < drive.min_cgpa_required) {
      const gap = (drive.min_cgpa_required - cgpa).toFixed(2);
      reasons.push(`Your CGPA (${cgpa}) is ${gap} below the required ${drive.min_cgpa_required}`);
    }
    if (backlogs > drive.max_backlogs_allowed) {
      const extra = backlogs - drive.max_backlogs_allowed;
      reasons.push(`You have ${extra} extra backlog${extra > 1 ? 's' : ''} (${backlogs} vs max ${drive.max_backlogs_allowed})`);
    }
    if (cgpa === 0) {
      reasons.push('Your CGPA is 0 — update your profile in Settings');
    }
    return reasons;
  };

  const filtered = drives.filter(d =>
    d.company_name.toLowerCase().includes(search.toLowerCase()) ||
    d.job_role.toLowerCase().includes(search.toLowerCase())
  );

  const handleApply = async (drive) => {
    if (applying) return;
    setApplying(drive._id);
    try {
      await api.post('/student/apply', { drive_id: drive._id });
      setAppliedIds(prev => new Set([...prev, String(drive._id)]));
      addToast?.(`✅ Applied to ${drive.company_name} successfully!`, 'success');
    } catch (err) {
      addToast?.(err.response?.data?.message || 'Failed to apply.', 'error');
    } finally {
      setApplying(null);
    }
  };

  if (loading) {
    return <div className="p-7 min-h-screen bg-[#f5f6f9] flex items-center justify-center"><div className="text-[#8d97aa] text-sm">Loading drives...</div></div>;
  }

  return (
    <div className="p-5 md:p-7 bg-[#f5f6f9] min-h-screen" onClick={() => setTooltip(null)}>
      <div className="mb-6">
        <h1 className="text-[#0d1b3e] text-[22px] font-bold m-0 tracking-[-0.3px]">Drive Browser</h1>
        <p className="text-[#8d97aa] text-[12px] mt-1">Browse and apply to company drives. Your eligibility is calculated in real time.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Drives',     value: drives.length,                    accent: C.accent },
          { label: 'Eligible for You', value: drives.filter(isEligible).length, accent: C.success },
          { label: 'Your CGPA',        value: s.cgpa ?? '—',                    accent: C.gold },
        ].map((k, i) => (
          <div key={i} className={`${CARD_HOVER} p-[14px_18px] border-t-[3px]`} style={{ borderTopColor: k.accent }}>
            <div className="text-[9.5px] tracking-[1px] uppercase text-[#8d97aa] font-semibold mb-1.5">{k.label}</div>
            <div className="font-mono text-[26px] font-semibold text-[#0d1b3e] leading-none">{k.value}</div>
          </div>
        ))}
      </div>

      {/* CGPA=0 banner */}
      {(s.cgpa === 0 || !s.cgpa) && (
        <div style={{ background: '#fff8e1', border: '1px solid #f9a825', padding: '10px 16px', marginBottom: 16, fontSize: 12.5, color: '#7a5c00', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span>Your <strong>CGPA is 0</strong> — that's why all drives show "Ineligible". Go to <strong>Settings → Profile → Edit Profile</strong> to update your CGPA, DSA marks, and backlogs.</span>
        </div>
      )}

      <div className={`${CARD} mb-6 overflow-hidden`}>
        <div className="p-[9px_13px] flex items-center gap-2.5 border-b border-[#d8dce6] bg-[#f5f6f9] flex-wrap">
          <div className="text-[12px] font-semibold text-[#1e2939] mr-auto">All Company Drives — AY 2025-26</div>
          <span className="font-mono text-[10px] bg-[#eceef3] text-[#4f5d73] border border-[#d8dce6] px-2 py-0.5">{filtered.length} records</span>
          <div className="flex items-center border border-[#d8dce6] bg-white px-2 py-1 gap-1.5 focus-within:ring-2 focus-within:ring-[#1e5fa8] transition-all">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="#8d97aa" strokeWidth="1.5"/><line x1="11" y1="11" x2="15" y2="15" stroke="#8d97aa" strokeWidth="1.5"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search drives..."
              className="border-none outline-none font-sans text-[12px] text-[#1e2939] w-32 md:w-40 bg-transparent placeholder-[#8d97aa]" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px] min-w-[800px]">
            <thead>
              <tr className="bg-[#0d1b3e]">
                {['Company', 'Job Role', 'Min CGPA', 'Max Backlogs', 'Avg Package', 'Visit Date', 'Eligibility', 'Action'].map(h => (
                  <th key={h} className="p-[9px_13px] text-left text-[10px] font-semibold tracking-[0.9px] uppercase text-white/75 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-[#8d97aa] text-sm">No drives found.</td></tr>
              )}
              {filtered.map((drive, i) => {
                const eligible   = isEligible(drive);
                const hasApplied = appliedIds.has(String(drive._id));
                const isApplying = applying === drive._id;
                const reasons    = !eligible ? ineligibilityReasons(drive) : [];
                const isTooltipOpen = tooltip?.driveId === drive._id;

                return (
                  <tr key={drive._id} className={`border-b border-[#eceef3] transition-colors ${eligible ? 'bg-white hover:bg-[#f8f9fa]' : 'bg-[#f5f6f9] opacity-80'} ${i === filtered.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="p-[9px_13px] font-semibold">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-[#0d1b3e] text-[#b8902a] font-mono text-[9px] font-bold px-1.5 py-[3px] tracking-[0.5px]">
                          {drive.company_name.substring(0, 3).toUpperCase()}
                        </div>
                        {drive.company_name}
                      </div>
                    </td>
                    <td className="p-[9px_13px] text-[#4f5d73]">{drive.job_role}</td>
                    <td className="p-[9px_13px] font-mono text-[11px]">{drive.min_cgpa_required}</td>
                    <td className="p-[9px_13px] font-mono text-[11px]">{drive.max_backlogs_allowed}</td>
                    <td className="p-[9px_13px] font-mono text-[11px] text-[#1a6e3c] font-semibold">{drive.avg_package || '—'}</td>
                    <td className="p-[9px_13px] font-mono text-[11px]">{drive.visit_date}</td>

                    {/* ── Eligibility cell with tooltip ── */}
                    <td className="p-[9px_13px] relative">
                      {eligible ? (
                        <span className="text-[10px] font-bold text-[#1a6e3c]">✓ Eligible</span>
                      ) : (
                        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span className="text-[10px] font-bold text-[#b03030]">✗ Ineligible</span>
                          {/* Why? button */}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setTooltip(isTooltipOpen ? null : { driveId: drive._id, reasons });
                            }}
                            style={{
                              width: 16, height: 16, borderRadius: '50%', fontSize: 10, fontWeight: 700,
                              background: '#b03030', color: '#fff', border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}
                            title="Why am I ineligible?"
                          >?</button>

                          {/* Tooltip popup */}
                          {isTooltipOpen && (
                            <div
                              onClick={e => e.stopPropagation()}
                              style={{
                                position: 'absolute', top: '110%', left: 0, zIndex: 99,
                                background: '#fff', border: '1px solid #e8b4b4',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                padding: '10px 14px', minWidth: 240, maxWidth: 300,
                              }}
                            >
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#b03030', marginBottom: 6 }}>
                                ❌ Why Ineligible
                              </div>
                              {reasons.map((r, ri) => (
                                <div key={ri} style={{ fontSize: 11, color: '#4f5d73', marginBottom: 4, display: 'flex', gap: 6 }}>
                                  <span style={{ color: '#b03030', flexShrink: 0 }}>•</span>
                                  <span>{r}</span>
                                </div>
                              ))}
                              <div style={{ fontSize: 10, color: '#8d97aa', marginTop: 8, borderTop: '1px solid #f0f0f0', paddingTop: 6 }}>
                                💡 Update your profile in Settings to improve eligibility
                              </div>
                            </div>
                          )}
                        </span>
                      )}
                    </td>

                    <td className="p-[9px_13px]">
                      {hasApplied ? (
                        <span className="text-[10px] font-bold text-[#1a6e3c] bg-[#e8f5ec] border border-[#c3e6cb] px-2 py-0.5 rounded-sm">✓ Applied</span>
                      ) : eligible ? (
                        <button onClick={() => handleApply(drive)} disabled={isApplying}
                          className="px-2.5 py-1 bg-[#1e5fa8] text-white border border-[#1e5fa8] text-[11px] font-medium cursor-pointer font-sans hover:bg-[#2d72c4] hover:shadow-sm hover:-translate-y-[1px] transition-all active:translate-y-0 whitespace-nowrap disabled:opacity-60">
                          {isApplying ? '...' : 'Apply Now'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#8d97aa]">Not Eligible</span>
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
