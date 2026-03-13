export default function ToastContainer({ toasts, theme }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background:
              t.type === "success"
                ? theme.success
                : t.type === "error"
                ? theme.error
                : theme.accent,
            color: "#fff",
            padding: "12px 18px",
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 14,
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            animation: "slideIn 0.3s ease",
            maxWidth: 300,
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
