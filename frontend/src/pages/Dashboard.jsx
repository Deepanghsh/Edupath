import { MOCK_DRIVES, MOCK_APPLICATIONS } from "../data/mockData";

export default function Dashboard({ student, theme, setPage }) {
  const s = theme;
  const eligibleDrives = MOCK_DRIVES.filter(
    (d) => student.cgpa >= d.min_cgpa_required && student.active_backlogs <= d.max_backlogs_allowed
  );

  const tierColor =
    student.tier === "Tier 1" ? s.success : student.tier === "Tier 2" ? s.blue : s.warning;

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = (student.readiness_score / 100) * circumference;

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: s.text, fontSize: 26, fontWeight: 800, margin: 0 }}>
          Welcome back, {student.full_name.split(" ")[0]}! 👋
        </h1>
        <p style={{ color: s.muted, fontSize: 14, marginTop: 4 }}>
          Here's your placement overview for this season.
        </p>
      </div>

      {/* Top Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {[
          { label: "CGPA", value: student.cgpa, sub: "/ 10.0", color: s.blue },
          {
            label: "Active Backlogs",
            value: student.active_backlogs,
            sub: "backlogs",
            color: student.active_backlogs > 0 ? s.error : s.success,
          },
          { label: "Eligible Drives", value: eligibleDrives.length, sub: "available", color: s.accent },
          { label: "Applications", value: MOCK_APPLICATIONS.length, sub: "submitted", color: s.purple },
        ].map((card, i) => (
          <div
            key={i}
            style={{
              background: s.card,
              border: `1px solid ${s.border}`,
              borderRadius: 14,
              padding: "20px 22px",
            }}
          >
            <div
              style={{
                color: s.muted,
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              {card.label}
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: card.color }}>
              {card.value}
              <span style={{ fontSize: 14, color: s.muted, fontWeight: 400, marginLeft: 4 }}>
                {card.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20 }}>
        {/* Readiness Score */}
        <div
          style={{
            background: s.card,
            border: `1px solid ${s.border}`,
            borderRadius: 14,
            padding: 28,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ color: s.text, fontSize: 15, fontWeight: 700, marginBottom: 20 }}>
            Placement Readiness
          </div>
          <svg width={130} height={130} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={65} cy={65} r={radius} fill="none" stroke={s.border} strokeWidth={10} />
            <circle
              cx={65}
              cy={65}
              r={radius}
              fill="none"
              stroke={s.accent}
              strokeWidth={10}
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <div style={{ marginTop: -100, marginBottom: 60, textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: s.accent }}>{student.readiness_score}%</div>
            <div style={{ fontSize: 12, color: s.muted }}>Score</div>
          </div>
          <div
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              background: tierColor + "22",
              border: `1.5px solid ${tierColor}`,
              color: tierColor,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {student.tier === "Tier 1"
              ? "🏆 CORE READY"
              : student.tier === "Tier 2"
              ? "⚡ MASS READY"
              : "📚 TRAINING MODE"}
          </div>
          <div style={{ marginTop: 20, width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "DSA Marks", val: student.dsa_marks, max: 100 },
              { label: "OOPs Marks", val: student.oops_marks, max: 100 },
            ].map((item, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: s.muted, fontSize: 12 }}>{item.label}</span>
                  <span style={{ color: s.text, fontSize: 12, fontWeight: 600 }}>{item.val}/100</span>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: s.border }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${(item.val / item.max) * 100}%`,
                      borderRadius: 4,
                      background: s.accent,
                      transition: "width 1s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Eligible Drives */}
        <div
          style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: 24 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <div style={{ color: s.text, fontSize: 15, fontWeight: 700 }}>Eligible Drives</div>
            <button
              onClick={() => setPage("drives")}
              style={{
                color: s.accent,
                background: "none",
                border: "none",
                fontSize: 13,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              View All →
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {eligibleDrives.slice(0, 4).map((drive) => (
              <div
                key={drive.drive_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: s.surface,
                  borderRadius: 10,
                  border: `1px solid ${s.border}`,
                }}
              >
                <div>
                  <div style={{ color: s.text, fontWeight: 600, fontSize: 14 }}>{drive.company_name}</div>
                  <div style={{ color: s.muted, fontSize: 12 }}>
                    {drive.job_role} · {drive.visit_date}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: s.success, fontWeight: 700, fontSize: 13 }}>{drive.avg_package}</div>
                  <div style={{ color: s.muted, fontSize: 11 }}>avg package</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div
        style={{
          background: s.card,
          border: `1px solid ${s.border}`,
          borderRadius: 14,
          padding: 24,
          marginTop: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <div style={{ color: s.text, fontSize: 15, fontWeight: 700 }}>Recent Applications</div>
          <button
            onClick={() => setPage("applications")}
            style={{
              color: s.accent,
              background: "none",
              border: "none",
              fontSize: 13,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            View All →
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {MOCK_APPLICATIONS.map((app) => {
            const statusColors = {
              Applied: s.muted,
              Shortlisted: s.blue,
              Selected: s.success,
              Rejected: s.error,
            };
            return (
              <div
                key={app.app_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: s.surface,
                  borderRadius: 8,
                }}
              >
                <div>
                  <span style={{ color: s.text, fontWeight: 600, fontSize: 13 }}>{app.company_name}</span>
                  <span style={{ color: s.muted, fontSize: 12, marginLeft: 8 }}>{app.job_role}</span>
                </div>
                <span
                  style={{
                    background: statusColors[app.status] + "22",
                    color: statusColors[app.status],
                    padding: "3px 10px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {app.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
