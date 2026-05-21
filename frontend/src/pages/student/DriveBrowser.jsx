import { useState } from 'react';
import { MOCK_DRIVES } from '../../data/mockData';
import { C, CARD, CARD_HOVER, SECTION_TITLE, Pill } from './ui';

export default function DriveBrowser({ student, addToast }) {
  const [search, setSearch] = useState('');

  const drives = MOCK_DRIVES.filter(d =>
    d.company_name.toLowerCase().includes(search.toLowerCase()) ||
    d.job_role.toLowerCase().includes(search.toLowerCase())
  );

  const isEligible = d => student.cgpa >= d.min_cgpa_required && student.active_backlogs <= d.max_backlogs_allowed;

  return (
    <div className="p-5 md:p-7 bg-[#f5f6f9] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[#0d1b3e] text-[22px] font-bold m-0 tracking-[-0.3px]">Drive Browser</h1>
        <p className="text-[#8d97aa] text-[12px] mt-1">Browse and apply to company drives. Your eligibility is calculated in real time.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Drives', value: MOCK_DRIVES.length, accent: C.accent },
          { label: 'Eligible for You', value: MOCK_DRIVES.filter(isEligible).length, accent: C.success },
          { label: 'Your CGPA', value: student.cgpa, accent: C.gold },
        ].map((k, i) => (
          <div key={i} className={`${CARD_HOVER} p-[14px_18px] border-t-[3px]`} style={{ borderTopColor: k.accent }}>
            <div className="text-[9.5px] tracking-[1px] uppercase text-[#8d97aa] font-semibold mb-1.5">{k.label}</div>
            <div className="font-mono text-[26px] font-semibold text-[#0d1b3e] leading-none">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className={`${CARD} mb-6 overflow-hidden`}>
        <div className="p-[9px_13px] flex items-center gap-2.5 border-b border-[#d8dce6] bg-[#f5f6f9] flex-wrap">
          <div className="text-[12px] font-semibold text-[#1e2939] mr-auto">All Company Drives — AY 2025-26</div>
          <span className="font-mono text-[10px] bg-[#eceef3] text-[#4f5d73] border border-[#d8dce6] px-2 py-0.5">{drives.length} records</span>
          <div className="flex items-center border border-[#d8dce6] bg-white px-2 py-1 gap-1.5 focus-within:ring-2 focus-within:ring-[#1e5fa8] focus-within:border-[#1e5fa8] transition-all">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="#8d97aa" strokeWidth="1.5"/><line x1="11" y1="11" x2="15" y2="15" stroke="#8d97aa" strokeWidth="1.5"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search drives..." className="border-none outline-none font-sans text-[12px] text-[#1e2939] w-32 md:w-40 bg-transparent placeholder-[#8d97aa]" />
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
              {drives.map((drive, i) => {
                const eligible = isEligible(drive);
                return (
                  <tr key={drive.drive_id} className={`border-b border-[#eceef3] transition-colors ${eligible ? 'bg-white hover:bg-[#f8f9fa]' : 'bg-[#f5f6f9] opacity-70'} ${i === drives.length - 1 ? 'border-b-0' : ''}`}>
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
                    <td className="p-[9px_13px] font-mono text-[11px] text-[#1a6e3c] font-semibold">{drive.avg_package}</td>
                    <td className="p-[9px_13px] font-mono text-[11px]">{drive.visit_date}</td>
                    <td className="p-[9px_13px]">
                      <span className={`text-[10px] font-bold ${eligible ? 'text-[#1a6e3c]' : 'text-[#b03030]'}`}>
                        {eligible ? '✓ Eligible' : '✗ Ineligible'}
                      </span>
                    </td>
                    <td className="p-[9px_13px]">
                      {eligible ? (
                        <button onClick={() => addToast(`Applied to ${drive.company_name}!`, 'success')}
                          className="px-2.5 py-1 bg-[#1e5fa8] text-white border border-[#1e5fa8] text-[11px] font-medium cursor-pointer font-sans hover:bg-[#2d72c4] hover:shadow-sm hover:-translate-y-[1px] transition-all active:translate-y-0 active:shadow-none whitespace-nowrap">
                          Apply Now
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
