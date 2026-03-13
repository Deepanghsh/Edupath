import { useState } from "react";
import { MOCK_DRIVES, MOCK_APPLICATIONS } from "../data/mockData";

export default function DriveBrowser({ student, theme, addToast }) {
  const s = theme;
  const [search, setSearch] = useState("");
  const [filterCGPA, setFilterCGPA] = useState(false);
  const [selected, setSelected] = useState(null);
  const [applied, setApplied] = useState(MOCK_APPLICATIONS.map((a) => a.drive_id));

  const filtered = MOCK_DRIVES.filter((d) => {
    const matchSearch =
      d.company_name.toLowerCase().includes(search.toLowerCase()) ||
      d.job_role.toLowerCase().includes(search.toLowerCase());
    const matchCGPA =
      !filterCGPA ||
      (student.cgpa >= d.min_cgpa_required && student.active_backlogs <= d.max_backlogs_allowed);
    return matchSearch && matchCGPA;
  });

  const isEligible = (drive) =>
    student.cgpa >= drive.min_cgpa_required && student.active_backlogs <= drive.max_backlogs_allowed;

  const handleApply = (drive) => {
    if (applied.includes(drive.drive_id) || !isEligible(drive)) return;
    setApplied((p) => [...p, drive.drive_id]);
    setSelected(null);
    addToast(`Applied to ${drive.company_name} successfully! ✅`, "success");
  };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: s.text, fontSize: 24, fontWeight: 800, margin: 0 }}>Drive Browser</h1>
        <p style={{ color: s.muted, fontSize: 13, marginTop: 4 }}>
          Browse and apply to placement drives. Green = eligible.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center" }}>
        <input
          placeholder="Search company or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 10,
            border: `1.5px solid ${s.border}`,
            background: s.surface,
            color: s.text,
            fontSize: 14,
            outline: "none",
          }}
        />
        <button
          onClick={() => setFilterCGPA((p) => !p)}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            border: `1.5px solid ${filterCGPA ? s.accent : s.border}`,
            background: filterCGPA ? s.accentLight : "transparent",
            color: filterCGPA ? s.accent : s.muted,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {filterCGPA ? "✓ " : ""}Eligible Only
        </button>
      </div>

      {/* Drive Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {filtered.map((drive) => {
          const eligible = isEligible(drive);
          const hasApplied = applied.includes(drive.drive_id);
          return (
            <div
              key={drive.drive_id}
              onClick={() => setSelected(drive)}
              style={{
                background: s.card,
                border: `1.5px solid ${eligible ? s.success + "44" : s.border}`,
                borderRadius: 14,
                padding: 20,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ color: s.text, fontWeight: 800, fontSize: 16 }}>{drive.company_name}</div>
                  <div style={{ color: s.muted, fontSize: 12 }}>{drive.job_role}</div>
                </div>
                <span style={{ fontSize: 18 }}>{eligible ? "✅" : "❌"}</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                {drive.required_skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      background: s.accentLight,
                      color: s.accent,
                      padding: "3px 10px",
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: s.muted,
                  marginBottom: 14,
                }}
              >
                <span>
                  Min CGPA: <strong style={{ color: s.text }}>{drive.min_cgpa_required}</strong>
                </span>
                <span>
                  Max Backlogs: <strong style={{ color: s.text }}>{drive.max_backlogs_allowed}</strong>
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: s.success, fontWeight: 700, fontSize: 14 }}>{drive.avg_package}</div>
                  <div style={{ color: s.muted, fontSize: 11 }}>📅 {drive.visit_date}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApply(drive);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    cursor: hasApplied || !eligible ? "not-allowed" : "pointer",
                    background: hasApplied ? s.success + "33" : !eligible ? s.border : s.accent,
                    color: hasApplied ? s.success : !eligible ? s.muted : "#fff",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {hasApplied ? "Applied ✓" : !eligible ? "Not Eligible" : "Apply Now"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drive Detail Modal */}
      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{
              background: s.card,
              border: `1px solid ${s.border}`,
              borderRadius: 18,
              padding: 32,
              width: 480,
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ color: s.text, margin: 0, fontSize: 22, fontWeight: 800 }}>
                  {selected.company_name}
                </h2>
                <p style={{ color: s.muted, margin: "4px 0 0" }}>{selected.job_role}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: "none", border: "none", color: s.muted, fontSize: 22, cursor: "pointer" }}
              >
                ×
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              {[
                { label: "Package", val: selected.avg_package },
                { label: "Visit Date", val: selected.visit_date },
                { label: "Min CGPA", val: selected.min_cgpa_required },
                { label: "Max Backlogs", val: selected.max_backlogs_allowed },
                { label: "Applications", val: selected.applications },
                { label: "Status", val: isEligible(selected) ? "Eligible ✅" : "Not Eligible ❌" },
              ].map((item, i) => (
                <div key={i} style={{ background: s.surface, borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ color: s.muted, fontSize: 11 }}>{item.label}</div>
                  <div style={{ color: s.text, fontWeight: 700, fontSize: 15 }}>{item.val}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: s.muted, fontSize: 12, marginBottom: 8 }}>Required Skills</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {selected.required_skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      background: s.accentLight,
                      color: s.accent,
                      padding: "5px 12px",
                      borderRadius: 14,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => handleApply(selected)}
              disabled={applied.includes(selected.drive_id) || !isEligible(selected)}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: 10,
                border: "none",
                background: applied.includes(selected.drive_id)
                  ? s.success + "33"
                  : !isEligible(selected)
                  ? s.border
                  : s.accent,
                color: applied.includes(selected.drive_id)
                  ? s.success
                  : !isEligible(selected)
                  ? s.muted
                  : "#fff",
                fontWeight: 700,
                fontSize: 15,
                cursor:
                  applied.includes(selected.drive_id) || !isEligible(selected)
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {applied.includes(selected.drive_id)
                ? "Already Applied ✓"
                : !isEligible(selected)
                ? "Not Eligible"
                : "Apply to this Drive"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
