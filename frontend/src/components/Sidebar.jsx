export default function Sidebar({ page, setPage, student, theme, onLogout, unread }) {
  const s = theme;
  const navItems = [
    { id: "dashboard", icon: "⊞", label: "Dashboard" },
    { id: "profile", icon: "👤", label: "My Profile" },
    { id: "drives", icon: "🏢", label: "Drive Browser" },
    { id: "applications", icon: "📋", label: "My Applications" },
    { id: "notifications", icon: "🔔", label: "Notifications", badge: unread },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <div
      style={{
        width: 240,
        background: s.surface,
        borderRight: `1px solid ${s.border}`,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "24px 20px", borderBottom: `1px solid ${s.border}` }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: s.accent, letterSpacing: -1 }}>EduPath</div>
        <div style={{ fontSize: 10, color: s.muted, letterSpacing: 2, textTransform: "uppercase" }}>Student Portal</div>
      </div>

      {/* User */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${s.border}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: s.accentLight,
            border: `2px solid ${s.accent}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            color: s.accent,
            fontSize: 13,
          }}
        >
          {student.avatar}
        </div>
        <div>
          <div style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>{student.full_name.split(" ")[0]}</div>
          <div style={{ color: s.muted, fontSize: 11 }}>{student.roll_no}</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 12px", overflowY: "auto" }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              marginBottom: 2,
              textAlign: "left",
              background: page === item.id ? s.accentLight : "transparent",
              color: page === item.id ? s.accent : s.muted,
              fontWeight: page === item.id ? 700 : 500,
              fontSize: 14,
              transition: "all 0.15s",
              position: "relative",
            }}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
            {item.badge > 0 && (
              <span
                style={{
                  marginLeft: "auto",
                  background: s.error,
                  color: "#fff",
                  borderRadius: 10,
                  fontSize: 10,
                  padding: "1px 6px",
                  fontWeight: 700,
                }}
              >
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: 16, borderTop: `1px solid ${s.border}` }}>
        <button
          onClick={onLogout}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: 8,
            border: `1px solid ${s.border}`,
            background: "transparent",
            color: s.muted,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ← Sign Out
        </button>
      </div>
    </div>
  );
}
