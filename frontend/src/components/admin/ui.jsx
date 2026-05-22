// No router imports needed here — components are pure

// Shared design tokens used across admin tab components
// Colors directly from tpo_admin_panel.html CSS variables
export const C = {
  navy:      '#0d1b3e',
  navyLight: '#162347',
  navyMid:   '#1e3163',
  accent:    '#1e5fa8',
  accentLt:  '#2d72c4',
  gold:      '#b8902a',
  goldLt:    '#d4aa45',
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
  atriskBg:  '#fdf0ef',
  red:       '#b03030',
};

// Pill component
export function Pill({ type, children }) {
  const styles = {
    pending:     { background: C.pendingBg, color: C.pending,  border: '1px solid #b0c6e8' },
    approved:    { background: C.successBg, color: C.success,  border: '1px solid #9fcfb4' },
    rejected:    { background: C.dangerBg,  color: C.danger,   border: '1px solid #e8b4b4' },
    applied:     { background: '#edf4ff',   color: '#1e4d8c',  border: '1px solid #b0c6e8' },
    shortlisted: { background: C.warnBg,    color: C.warn,     border: '1px solid #e0c96e' },
    selected:    { background: C.successBg, color: C.success,  border: '1px solid #9fcfb4' },
  };
  const s = styles[type] || styles.pending;
  return (
    <span style={{
      ...s,
      display: 'inline-block', padding: '2px 8px',
      fontSize: 10, fontWeight: 600, letterSpacing: '0.4px',
      textTransform: 'uppercase', fontFamily: 'IBM Plex Mono, monospace',
      whiteSpace: 'nowrap',
    }} className="hover:-translate-y-[1px] transition-transform duration-200 cursor-default">{children}</span>
  );
}

// Score bar
export function ScoreBar({ val, max = 100 }) {
  const pct = (val / max) * 100;
  const fill = pct >= 70 ? C.accent : pct >= 50 ? '#cc6e1a' : C.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="group">
      <div style={{ width: 64, height: 5, background: C.gray200, flexShrink: 0 }} className="overflow-hidden">
        <div style={{ width: `${pct}%`, height: '100%', background: fill }} className="group-hover:opacity-80 transition-opacity" />
      </div>
      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: C.gray600, minWidth: 30 }}>{val}</span>
    </div>
  );
}

// Table cell components
export function TH({ children, style }) {
  return (
    <th style={{ padding: '9px 13px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.9px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', ...style }}>
      {children}
    </th>
  );
}
export function TD({ children, style }) {
  return (
    <td style={{ padding: '9px 13px', verticalAlign: 'middle', fontSize: 12.5, ...style }}>
      {children}
    </td>
  );
}
export function MONO({ children, style }) {
  return (
    <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11.5, ...style }}>
      {children}
    </span>
  );
}

// Section header
export function SectionHeader({ title, sub, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }} className="flex-wrap gap-4">
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.navy, letterSpacing: '-0.3px' }}>{title}</div>
        {sub && <div style={{ fontSize: 11.5, color: C.gray400, marginTop: 3 }}>{sub}</div>}
      </div>
      {children && <div style={{ display: 'flex', gap: 8 }}>{children}</div>}
    </div>
  );
}

// Btn
export function Btn({ variant = 'ghost', size = '', onClick, children, disabled }) {
  const baseClasses = "inline-flex items-center gap-1 border font-sans tracking-[0.2px] leading-relaxed whitespace-nowrap font-medium transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 active:shadow-none";

  const sizeClasses = {
    '':   'px-[11px] py-1 text-[11px]',
    'sm': 'px-2 py-[3px] text-[10.5px]',
    'lg': 'px-[18px] py-2 text-[13px]'
  };

  const variantClasses = {
    primary: 'bg-[#1e5fa8] text-white border-[#1e5fa8] hover:bg-[#2d72c4] hover:border-[#2d72c4]',
    ghost:   'bg-white text-[#4f5d73] border-[#d8dce6] hover:bg-[#f5f6f9] hover:text-[#0d1b3e]',
    success: 'bg-[#e6f4ec] text-[#1a6e3c] border-[#9fcfb4] hover:bg-[#d1e9db]',
    danger:  'bg-[#fceaea] text-[#8b1a1a] border-[#e8b4b4] hover:bg-[#f5d6d6]',
    gold:    'bg-[#b8902a] text-white border-[#b8902a] hover:bg-[#d4aa45] hover:border-[#d4aa45]',
    outline: 'bg-white text-[#1e5fa8] border-[#1e5fa8] hover:bg-[#1e5fa8] hover:text-white',
  };

  const classes = `${baseClasses} ${sizeClasses[size] || sizeClasses['']} ${variantClasses[variant] || variantClasses.ghost} ${disabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`;

  return <button onClick={onClick} disabled={disabled} className={classes}>{children}</button>;
}

// Panel
export function Panel({ head, badge, children }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.gray200}` }} className="hover:shadow-md transition-shadow duration-300 group">
      <div style={{ padding: '10px 14px', background: C.navy, color: '#fff', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.3px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {head}
        {badge && <span style={{ background: C.gold, color: C.navy, fontSize: 9, fontWeight: 700, padding: '2px 7px', fontFamily: 'IBM Plex Mono, monospace' }}>{badge}</span>}
      </div>
      {children}
    </div>
  );
}

// KPI card
export function KpiCard({ label, value, sub, accent = C.accent }) {
  return (
    <div 
      className="bg-white p-4 border border-[#d8dce6] border-t-[3px] hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
      style={{ borderTopColor: accent }}
    >
      <div style={{ fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase', color: C.gray400, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 30, fontWeight: 600, color: C.navy, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 10.5, color: C.gray400 }}>{sub}</div>
    </div>
  );
}

// Table card wrapper
export function TableCard({ children, style }) {
  return <div className="bg-white border border-[#d8dce6] mb-5 hover:shadow-md transition-shadow duration-300 overflow-hidden" style={style}>{children}</div>;
}

// Table toolbar — accepts search value + onSearch handler OR just onSearch
export function Toolbar({ title, count, search, onSearch, placeholder, searchPlaceholder, children }) {
  return (
    <div style={{ padding: '9px 13px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${C.gray200}`, background: C.gray50, flexWrap: 'wrap' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.gray800, marginRight: 'auto' }}>{title}</div>
      {count !== undefined && <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, background: C.gray100, color: C.gray600, border: `1px solid ${C.gray200}`, padding: '2px 8px' }}>{count} records</span>}
      {onSearch && (
        <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.gray200}`, background: '#fff', padding: '4px 8px', gap: 5 }} className="focus-within:ring-2 focus-within:ring-[#1e5fa8] focus-within:border-[#1e5fa8] transition-all">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="#8d97aa" strokeWidth="1.5"/><line x1="11" y1="11" x2="15" y2="15" stroke="#8d97aa" strokeWidth="1.5"/></svg>
          <input
            value={search !== undefined ? search : undefined}
            onChange={e => onSearch(e.target.value)}
            placeholder={placeholder || searchPlaceholder || 'Search...'}
            style={{ border: 'none', outline: 'none', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 12, color: C.gray800, width: 160, background: 'transparent' }} />
        </div>
      )}
      {children}
    </div>
  );
}

// Skill map bar
export function SkillBar({ label, pct, fill = C.accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
      <div style={{ fontSize: 11, width: 100, color: C.gray600, fontWeight: 500 }}>{label}</div>
      <div style={{ flex: 1, height: 8, background: C.gray200 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: fill }} />
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: C.gray400, width: 30, textAlign: 'right' }}>{pct}%</div>
    </div>
  );
}

// Form components
export function FormCard({ head, children, footer }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.gray200}`, marginBottom: 22 }}>
      <div style={{ padding: '10px 16px', background: C.navyMid, color: '#fff', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.3px' }}>{head}</div>
      <div style={{ padding: '18px 20px' }}>{children}</div>
      {footer && <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.gray100}`, background: C.gray50, display: 'flex', gap: 8 }}>{footer}</div>}
    </div>
  );
}

export const formControl = {
  border: `1px solid ${C.gray200}`, padding: '7px 10px',
  fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 13, color: C.gray800,
  background: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box',
};
export const formLabel = {
  fontSize: 10.5, fontWeight: 600, color: C.gray600, letterSpacing: '0.4px', textTransform: 'uppercase', display: 'block', marginBottom: 4,
};
