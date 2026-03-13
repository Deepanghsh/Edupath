import { useState } from "react";

export default function ToggleSwitch({ def, theme }) {
  const [on, setOn] = useState(def);
  const s = theme;

  return (
    <div
      onClick={() => setOn((p) => !p)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: on ? s.accent : s.border,
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: on ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
        }}
      />
    </div>
  );
}
