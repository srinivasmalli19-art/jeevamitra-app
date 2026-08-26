import { createContext, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [message, setMessage] = useState("");
  const [show, setShow] = useState(false);
  const timerRef = useRef(null);

  function showToast(msg, duration = 2200) {
    setMessage(msg);
    setShow(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShow(false), duration);
  }

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className={`toast-host ${show ? "show" : ""}`} role="status" aria-live="polite">
        {message}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
