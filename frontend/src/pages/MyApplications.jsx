import { useState } from "react";
import { MOCK_APPLICATIONS } from "../data/mockData";

export default function MyApplications({ theme }) {
  const s = theme;
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Applied", "Shortlisted", "Selected", "Rejected"];

  const filtered =
    filter === "All" ? MOCK_APPLICATIONS : MOCK_APPLICATIONS.filter((a) => a.status === filter);

  const statusColors = {
    Applied: s.muted,
    Shortlisted: s.blue,
    Selected: s.success,
    Rejected: s.error,
  };
  const steps = ["Applied", "Aptitude Test", "Technical Round", "HR Interview", "Offer"];
  const stepIndexOf = (status) =>
    ({ Applied: 0, Shortlisted: 2, Selected: 4, Rejected: -1 }[status] ?? 0);

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: s.text, fontSize: 24, fontWeight: 800, margin: 0 }}>My Applications</h1>
        <p style={{ color: s.muted, fontSize: 13, marginTop: 4 }}>
          Track all your placement applications and their progress.
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "8px 18px",
              borderRadius: 20,
              border: `1.5px solid ${filter === f ? s.accent : s.border}`,
              background: filter === f ? s.accentLight : "transparent",
              color: filter === f ? s.accent : s.muted,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filtered.map((app) => {
          const sc = statusColors[app.status];
          const stepIdx = stepIndexOf(app.status);
          return (
            <div
              key={app.app_id}
              style={{
                background: s.card,
                border: `1px solid ${s.border}`,
                borderRadius: 14,
                padding: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 20,
                }}
              >
                <div>
                  <div style={{ color: s.text, fontWeight: 800, fontSize: 17 }}>{app.company_name}</div>
                  <div style={{ color: s.muted, fontSize: 13 }}>
                    {app.job_role} · Applied {app.applied_date}
                  </div>
                </div>
                <span
                  style={{
                    padding: "5px 14px",
                    borderRadius: 14,
                    background: sc + "22",
                    color: sc,
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {app.status}
                </span>
              </div>

              {/* Timeline Stepper */}
              {app.status !== "Rejected" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                  {steps.map((step, i) => (
                    <div
                      key={step}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flex: i < steps.length - 1 ? 1 : "none",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: i <= stepIdx ? s.accent : s.border,
                            color: i <= stepIdx ? "#fff" : s.muted,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {i <= stepIdx ? "✓" : i + 1}
                        </div>
                        <div
                          style={{
                            color: i <= stepIdx ? s.text : s.muted,
                            fontSize: 10,
                            whiteSpace: "nowrap",
                            fontWeight: i <= stepIdx ? 600 : 400,
                          }}
                        >
                          {step}
                        </div>
                      </div>
                      {i < steps.length - 1 && (
                        <div
                          style={{
                            flex: 1,
                            height: 2,
                            background: i < stepIdx ? s.accent : s.border,
                            margin: "0 4px",
                            marginBottom: 18,
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    background: s.error + "15",
                    border: `1px solid ${s.error}33`,
                    borderRadius: 10,
                    padding: "12px 16px",
                  }}
                >
                  <div style={{ color: s.error, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                    Application Rejected
                  </div>
                  {app.feedback && (
                    <div style={{ color: s.muted, fontSize: 12 }}>Feedback: {app.feedback}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px", color: s.muted }}>
            No applications found for this filter.
          </div>
        )}
      </div>
    </div>
  );
}
