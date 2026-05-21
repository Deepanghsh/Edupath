import { useLocation, useNavigate } from "react-router-dom";

export default function Sidebar({ student, onLogout, unread }) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { id: "dashboard",    path: "/student/dashboard",       label: "Dashboard",       icon: <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 15, height: 15 }}><rect x="1" y="1" width="6" height="6"/><rect x="9" y="1" width="6" height="6"/><rect x="1" y="9" width="6" height="6"/><rect x="9" y="9" width="6" height="6"/></svg> },
    { id: "drives",       path: "/student/drives",          label: "Drive Browser",   icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ width: 15, height: 15 }}><rect x="1" y="4" width="14" height="10"/><path d="M4 4V3a1 1 0 011-1h6a1 1 0 011 1v1"/><line x1="8" y1="8" x2="8" y2="11"/><line x1="5" y1="9.5" x2="11" y2="9.5"/></svg> },
    { id: "applications", path: "/student/applications",    label: "My Applications", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ width: 15, height: 15 }}><rect x="2" y="2" width="12" height="12"/><line x1="5" y1="6" x2="11" y2="6" strokeWidth="1"/><line x1="5" y1="9" x2="11" y2="9" strokeWidth="1"/><line x1="5" y1="12" x2="8" y2="12" strokeWidth="1"/></svg> },
    { id: "notifications", path: "/student/notifications",   label: "Notifications",  icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ width: 15, height: 15 }}><path d="M8 1a5 5 0 015 5v3l1.5 2H1.5L3 9V6a5 5 0 015-5z"/><path d="M6.5 13a1.5 1.5 0 003 0"/></svg>, badge: unread },
    { id: "settings",     path: "/student/settings",        label: "Settings",        icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ width: 15, height: 15 }}><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/></svg> },
  ];

  const navy     = '#0d1b3e';
  const navyLight = '#162347';
  const gold     = '#b8902a';
  const accent   = '#1e5fa8';

  return (
    <div style={{
      width: 248, background: navyLight, position: 'fixed', left: 0, top: 0, bottom: 0,
      zIndex: 100, display: 'flex', flexDirection: 'column',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      fontFamily: 'IBM Plex Sans, Helvetica, Arial, sans-serif',
    }}>

      {/* ── LOGO HEADER ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 18px', height: 52, flexShrink: 0,
        borderBottom: `2px solid ${gold}`,
        background: navy,
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{
          width: 30, height: 30, background: gold,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, fontSize: 13,
          color: navy, flexShrink: 0,
        }}>EP</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.2px', lineHeight: 1.2 }}>EduPath</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase' }}>Student Portal</div>
        </div>
      </div>

      {/* ── USER BLOCK ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          width: 28, height: 28, background: accent, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: '#fff',
        }}>
          {student.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 11.5, color: '#fff', fontWeight: 500 }}>{student.full_name.split(' ')[0]}</div>
          <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.3px' }}>{student.roll_no}</div>
        </div>
      </div>

      {/* ── NAV ── */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', padding: '14px 18px 6px', fontWeight: 600 }}>
          Main Navigation
        </div>
        {navItems.map(item => {
          const active = location.pathname.includes(item.path);
          return (
            <div
              key={item.id}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 18px', cursor: 'pointer',
                color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                fontSize: 12.5, fontWeight: active ? 500 : 400,
                borderLeft: `3px solid ${active ? gold : 'transparent'}`,
                background: active ? 'rgba(30,95,168,0.22)' : 'transparent',
                userSelect: 'none', transition: 'all 0.15s',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}}
            >
              <span style={{ width: 15, height: 15, display: 'flex', alignItems: 'center', flexShrink: 0, opacity: 0.8 }}>
                {item.icon}
              </span>
              {item.label}
              {item.badge > 0 && (
                <span style={{
                  marginLeft: 'auto', background: '#b03030', color: '#fff',
                  fontSize: 9, padding: '1px 5px', fontWeight: 700,
                  fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.3px',
                }}>
                  {item.badge}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── SYSTEM SECTION ── */}
      <div>
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '8px 0' }} />
        <div style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', padding: '4px 18px 6px', fontWeight: 600 }}>
          System
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        marginTop: 'auto', padding: '12px 16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        fontSize: 9.5, color: 'rgba(255,255,255,0.28)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 1 }}>EduPath Intelligence v1.0</strong>
        Academic Year 2025–26<br />
        <button
          onClick={onLogout}
          style={{
            marginTop: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 11,
            padding: '4px 10px', fontFamily: 'IBM Plex Sans, sans-serif', width: '100%',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
        >
          ← Sign Out
        </button>
      </div>
    </div>
  );
}
