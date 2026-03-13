export default function AdminPortal({ onLogout, theme }) {
  const s = theme;
  return (
    <div
      style={{
        minHeight: "100vh",
        background: s.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏛️</div>
        <h1 style={{ color: s.text, fontSize: 26, fontWeight: 800 }}>Admin Portal</h1>
        <p style={{ color: s.muted, fontSize: 14, maxWidth: 380, margin: "12px auto" }}>
          You're logged in as TPO Admin. The admin panel (Student Management, Drive Management,
          Analytics, Notifications) is handled by the Admin team member.
        </p>
        <button
          onClick={onLogout}
          style={{
            marginTop: 20,
            padding: "12px 28px",
            borderRadius: 10,
            background: s.accent,
            border: "none",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 15,
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
