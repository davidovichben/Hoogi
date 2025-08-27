import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type Kind = "success" | "error" | "info";

type ToastItem = {
  id: string;
  kind: Kind;
  title: string;
  description?: string;
  duration: number;
};

type Ctx = {
  push: (t: Omit<ToastItem, "id">) => void;
  announce: (msg: string) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

function useToastCtx() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("ToastProvider missing");
  return ctx;
}

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const liveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  const push = useCallback((t: Omit<ToastItem, "id">) => {
    const id = `t_${++idRef.current}`;
    const item: ToastItem = { id, ...t };
    setToasts((prev) => [...prev, item]);
    if (t.duration > 0) {
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, t.duration);
    }
  }, []);

  const announce = useCallback((msg: string) => {
    if (liveRef.current) {
      liveRef.current.textContent = "";
      window.setTimeout(() => {
        if (liveRef.current) liveRef.current.textContent = msg;
      }, 10);
    }
  }, []);

  const ctx = useMemo<Ctx>(() => ({ push, announce }), [push, announce]);

  // Close last toast with Escape for basic keyboard support
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && toasts.length) {
      const last = toasts[toasts.length - 1];
      setToasts((prev) => prev.filter((x) => x.id !== last.id));
    }
  };

  return (
    <ToastCtx.Provider value={ctx}>
      <div
        ref={liveRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
      {children}
      {mounted &&
        createPortal(
          <div
            className="fixed z-[1000] w-full sm:w-auto px-3 sm:px-0 bottom-3 sm:bottom-4 sm:right-4 flex flex-col gap-2 items-stretch sm:items-end pointer-events-none"
            aria-live="polite"
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            {toasts.map((t) => (
              <div
                key={t.id}
                role="status"
                aria-live={t.kind === "error" ? "assertive" : "polite"}
                className={[
                  "pointer-events-auto rounded-xl shadow-lg border px-4 py-3 max-w-[92vw] sm:max-w-sm bg-card",
                  t.kind === "success" && "bg-emerald-50 border-emerald-200 text-emerald-900",
                  t.kind === "error" && "bg-red-50 border-red-200 text-red-900",
                  t.kind === "info" && "bg-slate-50 border-slate-200 text-slate-900",
                ].filter(Boolean).join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="font-medium">{t.title}</div>
                    {t.description ? (
                      <div className="text-sm opacity-80 mt-0.5">{t.description}</div>
                    ) : null}
                  </div>
                  <button
                    onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                    className="p-1 rounded-md hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black/20"
                    aria-label="Close notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastCtx.Provider>
  );
};

function useSingleton() {
  const { push, announce } = useToastCtx();
  return {
    success: (message: string, opts?: { description?: string; duration?: number }) =>
      push({ kind: "success", title: message, description: opts?.description, duration: opts?.duration ?? 3000 }),
    error: (message: string, opts?: { description?: string; duration?: number }) =>
      push({ kind: "error", title: message, description: opts?.description, duration: opts?.duration ?? 4000 }),
    info: (message: string, opts?: { description?: string; duration?: number }) =>
      push({ kind: "info", title: message, description: opts?.description, duration: opts?.duration ?? 3000 }),
    announce,
  };
}

let _api: ReturnType<typeof useSingleton> | null = null;
export const ToastBridge: React.FC = () => {
  _api = useSingleton();
  return null;
};

export const toast = {
  success: (m: string, o?: any) => _api?.success(m, o),
  error: (m: string, o?: any) => _api?.error(m, o),
  info: (m: string, o?: any) => _api?.info(m, o),
};

export const announce = (m: string) => _api?.announce(m);


