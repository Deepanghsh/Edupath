import { useState } from 'react';
import { MOCK_APPLICATIONS } from '../../data/mockData';
import { C, CARD, CARD_HOVER, SECTION_TITLE, Pill } from './ui';

const FILTERS = ['All', 'Applied', 'Shortlisted', 'Selected', 'Rejected'];

export default function MyApplications() {
  const [filter, setFilter] = useState('All');

  const filtered = MOCK_APPLICATIONS.filter(a => filter === 'All' || a.status === filter);
  const counts = FILTERS.reduce((acc, f) => ({ ...acc, [f]: f === 'All' ? MOCK_APPLICATIONS.length : MOCK_APPLICATIONS.filter(a => a.status === f).length }), {});

  return (
    <div className="p-5 md:p-7 bg-[#f5f6f9] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[#0d1b3e] text-[22px] font-bold m-0 tracking-[-0.3px]">My Applications</h1>
        <p className="text-[#8d97aa] text-[12px] mt-1">Track the status of all your company drive applications.</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {FILTERS.filter(f => f !== 'All').map(f => (
          <div key={f} className={`${CARD_HOVER} flex flex-col items-center p-[16px_18px] border-t-[3px]`} 
               style={{ borderTopColor: f === 'Selected' ? C.success : f === 'Rejected' ? C.red : f === 'Shortlisted' ? C.gold : C.pending }}>
            <div className="font-mono text-[26px] font-semibold text-[#0d1b3e] leading-none">{counts[f]}</div>
            <div className="text-[9.5px] text-[#8d97aa] tracking-[1px] uppercase font-semibold mt-1.5">{f}</div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 text-[11.5px] font-sans transition-all duration-200 border hover:-translate-y-[1px] hover:shadow-sm active:translate-y-0 active:shadow-none ${
              filter === f 
                ? 'bg-[#0d1b3e] text-white border-[#0d1b3e] font-medium' 
                : 'bg-white text-[#4f5d73] border-[#d8dce6] hover:bg-[#f5f6f9] hover:text-[#0d1b3e]'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="p-[9px_13px] flex items-center gap-2.5 border-b border-[#d8dce6] bg-[#f5f6f9]">
          <div className="text-[12px] font-semibold text-[#1e2939] mr-auto">Application History</div>
          <span className="font-mono text-[10px] bg-[#eceef3] text-[#4f5d73] border border-[#d8dce6] px-2 py-0.5">{filtered.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px] min-w-[500px]">
            <thead>
              <tr className="bg-[#0d1b3e]">
                {['App ID', 'Company', 'Job Role', 'Applied On', 'Status'].map(h => (
                  <th key={h} className="p-[9px_13px] text-left text-[10px] font-semibold tracking-[0.9px] uppercase text-white/75 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((app, i) => (
                <tr key={app.app_id} className={`border-b border-[#eceef3] hover:bg-[#f8f9fa] transition-colors ${i === filtered.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="p-[9px_13px] font-mono text-[11px]">{app.app_id}</td>
                  <td className="p-[9px_13px] font-medium">{app.company_name}</td>
                  <td className="p-[9px_13px] text-[#4f5d73]">{app.job_role}</td>
                  <td className="p-[9px_13px] font-mono text-[11px]">{app.applied_date || 'May 2026'}</td>
                  <td className="p-[9px_13px]"><Pill>{app.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
