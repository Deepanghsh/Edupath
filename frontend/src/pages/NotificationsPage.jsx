import { useState } from "react";

export default function NotificationsPage({ notifications, setNotifications, theme }) {
  const s = theme;
  const [filter, setFilter] = useState("All");

  const typeMap = {
    drive: { color: s.blue, icon: "🏢" },
    system: { color: s.success, icon: "⚙️" },
    mentor: { color: s.purple, icon: "👨‍🏫" },
  };

  const filtered =
    filter === "All"
      ? notifications
      : filter === "Unread"
      ? notifications.filter((n) => !n.read)
      : notifications.filter((n) => n.type === filter.toLowerCase().replace(" alerts", ""));

  const markRead = (id) =>
    setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () => setNotifications((p) => p.map((n) => ({ ...n, read: true })));

  return (
    <div style={{ padding: 32 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ color: s.text, fontSize: 24, fontWeight: 800, margin: 0 }}>Notifications</h1>
          <p style={{ color: s.muted, fontSize: 13, marginTop: 4 }}>
            Stay updated with drives and placement alerts.
          </p>
        </div>
        <button
          onClick={markAllRead}
          style={{
            color: s.accent,
            background: s.accentLight,
            border: "none",
            padding: "8px 16px",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Mark All Read
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["All", "Unread", "Drive Alerts", "Mentor Alerts"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "7px 16px",
              borderRadius: 20,
              border: `1.5px solid ${filter === f ? s.accent : s.border}`,
              background: filter === f ? s.accentLight : "transparent",
              color: filter === f ? s.accent : s.muted,
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((notif) => {
          const t = typeMap[notif.type] || { color: s.muted, icon: "📬" };
          return (
            <div
              key={notif.id}
              onClick={() => markRead(notif.id)}
              style={{
                background: s.card,
                border: `1px solid ${notif.read ? s.border : s.accent + "44"}`,
                borderRadius: 12,
                padding: "16px 20px",
                cursor: "pointer",
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
                opacity: notif.read ? 0.8 : 1,
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: 22, marginTop: 2 }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{ color: s.text, fontWeight: notif.read ? 500 : 700, fontSize: 14 }}
                  >
                    {notif.title}
                  </span>
                  {!notif.read && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: s.accent,
                        display: "inline-block",
                      }}
                    />
                  )}
                </div>
                <div style={{ color: s.muted, fontSize: 13, marginTop: 4 }}>{notif.message}</div>
                <div style={{ color: s.muted, fontSize: 11, marginTop: 6 }}>{notif.timestamp}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
