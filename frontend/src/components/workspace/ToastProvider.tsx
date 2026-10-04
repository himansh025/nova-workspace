"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Sparkles, CheckCircle2, AlertTriangle, GitCommit, X, Rocket } from "lucide-react";

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: "success" | "warning" | "accent" | "commit" | "release";
  timestamp: string;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id" | "timestamp">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {}
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (toast: Omit<ToastItem, "id" | "timestamp">) => {
    const newItem: ToastItem = {
      ...toast,
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: "Just now"
    };
    setToasts((prev) => [newItem, ...prev].slice(0, 5));

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      removeToast(newItem.id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto p-3.5 rounded-xl bg-[var(--nova-surface)] backdrop-blur-md border border-[var(--nova-border)] shadow-[0_12px_32px_rgba(0,0,0,0.08)] flex items-start justify-between gap-3 text-xs text-[var(--nova-text-primary)] animate-in fade-in slide-in-from-bottom-3 duration-300"
          >
            <div className="flex items-start gap-2.5">
              {t.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
              {t.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
              {t.type === "accent" && <Sparkles className="w-4 h-4 text-[var(--nova-accent)] shrink-0 mt-0.5" />}
              {t.type === "commit" && <GitCommit className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />}
              {t.type === "release" && <Rocket className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}

              <div>
                <div className="font-semibold text-[var(--nova-text-primary)] flex items-center gap-1.5">
                  <span>{t.title}</span>
                  <span className="text-[9px] font-mono text-[var(--nova-text-muted)]">• {t.timestamp}</span>
                </div>
                <p className="text-[11px] text-[var(--nova-text-secondary)] mt-0.5 leading-snug">{t.message}</p>
              </div>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="p-1 text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] rounded hover:bg-[var(--nova-deep)] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
