import { useState } from "react";

export default function ToggleSwitch({ def }) {
  const [on, setOn] = useState(def);

  return (
    <div
      onClick={() => setOn((p) => !p)}
      className={`w-11 h-6 rounded-full cursor-pointer relative transition-colors duration-200 ${
        on ? "bg-accent" : "bg-gray-200"
      }`}
    >
      <div
        className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all duration-200 ${
          on ? "left-[23px]" : "left-[3px]"
        }`}
      />
    </div>
  );
}
