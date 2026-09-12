import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
} from "react";

const ToastContext = createContext(null);

let toastIdCounter = 0;

function reducer(state, action) {
  switch (action.type) {
    case "ADD":
      return [...state, action.toast];
    case "REMOVE":
      return state.filter((t) => t.id !== action.id);
    default:
      return state;
  }
}

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(reducer, []);

  const addToast = useCallback((message, type = "info", duration = 5000) => {
    const id = ++toastIdCounter;
    dispatch({ type: "ADD", toast: { id, message, type } });
    if (duration > 0) {
      setTimeout(() => dispatch({ type: "REMOVE", id }), duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => dispatch({ type: "REMOVE", id }), []);

  const toast = {
    info: (msg, dur) => addToast(msg, "info", dur),
    success: (msg, dur) => addToast(msg, "success", dur),
    error: (msg, dur) => addToast(msg, "error", dur),
    remove: removeToast,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <span>{t.message}</span>
            <button
              type="button"
              className="toast__close"
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
