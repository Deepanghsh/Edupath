// Shared design tokens for student pages — matches admin panel exactly
export const C = {
  navy:      '#0d1b3e',
  accent:    '#1e5fa8',
  gold:      '#b8902a',
  gray50:    '#f5f6f9',
  gray100:   '#eceef3',
  gray200:   '#d8dce6',
  gray400:   '#8d97aa',
  gray600:   '#4f5d73',
  gray800:   '#1e2939',
  success:   '#1a6e3c',
  successBg: '#e6f4ec',
  danger:    '#8b1a1a',
  dangerBg:  '#fceaea',
  warn:      '#7a4f00',
  warnBg:    '#fff3d6',
  pendingBg: '#eef3fb',
  pending:   '#1e4d8c',
  red:       '#b03030',
};

export const CARD = "bg-white border border-[#d8dce6] hover:shadow-md transition-shadow duration-300";
export const CARD_HOVER = "bg-white border border-[#d8dce6] hover:shadow-lg hover:-translate-y-1 transition-all duration-300";
export const SECTION_TITLE = { fontSize: 15, fontWeight: 700, color: '#0d1b3e', letterSpacing: '-0.2px' };

export function Pill({ type, children }) {
  const map = {
    Applied:     { bg: '#edf4ff', color: '#1e4d8c', border: '#b0c6e8' },
    Shortlisted: { bg: '#fff3d6', color: '#7a4f00', border: '#e0c96e' },
    Selected:    { bg: '#e6f4ec', color: '#1a6e3c', border: '#9fcfb4' },
    Rejected:    { bg: '#fceaea', color: '#8b1a1a', border: '#e8b4b4' },
  };
  const s = map[children] || map.Applied;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      display: 'inline-block', padding: '2px 9px', fontSize: 10, fontWeight: 600,
      letterSpacing: '0.4px', textTransform: 'uppercase',
      fontFamily: 'IBM Plex Mono, monospace', whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}
