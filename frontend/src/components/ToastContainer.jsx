import { useState, useEffect } from "react";

function Toast({ t, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slide in
    const inTimer = setTimeout(() => setVisible(true), 10);
    // Slide out before removal
    const outTimer = setTimeout(() => setVisible(false), 3000);
    return () => { clearTimeout(inTimer); clearTimeout(outTimer); };
  }, []);

  const icons = { success: "✓", error: "✕", info: "ℹ" };
  const colors = {
    success: { bg: "#1a6e3c", border: "#15573010" },
    error:   { bg: "#8b1a1a", border: "#8b1a1a10" },
    info:    { bg: "#1e5fa8", border: "#1e5fa810" },
  };
  const { bg } = colors[t.type] || colors.info;

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(() => onRemove(t.id), 300); }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: bg,
        color: "#fff",
        padding: "13px 16px",
        borderRadius: 8,
        fontWeight: 500,
        fontSize: 13,
        boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
        maxWidth: 340,
        minWidth: 240,
        cursor: "pointer",
        userSelect: "none",
        transform: visible ? "translateX(0)" : "translateX(120px)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease",
        pointerEvents: "all",
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1,
      }}>
        {icons[t.type] || "i"}
      </div>
      <div style={{ flex: 1, lineHeight: 1.5 }}>{t.msg}</div>
      <div style={{ fontSize: 16, opacity: 0.6, marginLeft: 4, flexShrink: 0 }}>×</div>
    </div>
  );
}

export default function ToastContainer({ toasts, onRemove }) {
  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 99999,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      pointerEvents: "none",
    }}>
      {toasts.map((t) => (
        <Toast key={t.id} t={t} onRemove={onRemove || (() => {})} />
      ))}
    </div>
  );
}
