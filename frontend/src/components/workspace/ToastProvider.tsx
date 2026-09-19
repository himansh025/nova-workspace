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
            className="pointer-events-auto p-3.5 rounded-xl bg-[#161822]/95 backdrop-blur-md border border-white/15 shadow-2xl flex items-start justify-between gap-3 text-xs text-neutral-200 animate-in fade-in slide-in-from-bottom-3 duration-300"
          >
            <div className="flex items-start gap-2.5">
              {t.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {t.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
              {t.type === "accent" && <Sparkles className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" />}
              {t.type === "commit" && <GitCommit className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />}
              {t.type === "release" && <Rocket className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}

              <div>
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span>{t.title}</span>
                  <span className="text-[9px] font-mono text-neutral-500">• {t.timestamp}</span>
                </div>
                <p className="text-[11px] text-neutral-300 mt-0.5 leading-snug">{t.message}</p>
              </div>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="p-1 text-neutral-500 hover:text-white rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
