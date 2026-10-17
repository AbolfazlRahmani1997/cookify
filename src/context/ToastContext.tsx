import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, number>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    window.clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-2), { id, message, variant }]);
      timers.current[id] = window.setTimeout(() => dismiss(id), 3600);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({ toasts, toast, dismiss }),
    [toasts, toast, dismiss],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
