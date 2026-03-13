import { useState } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const add = (msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  };

  return { toasts, add };
}
