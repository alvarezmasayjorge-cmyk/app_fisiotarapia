'use client';

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';

type ToastVariant = 'info' | 'success' | 'warning' | 'error';

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  show: (message: string, variant?: ToastVariant, durationMs?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let counter = 0;

const config: Record<ToastVariant, { bg: string; border: string; text: string; icon: typeof Info }> = {
  info: { bg: 'bg-white', border: 'border-slate-200', text: 'text-slate-800', icon: Info },
  success: { bg: 'bg-white', border: 'border-emerald-200', text: 'text-emerald-700', icon: CheckCircle },
  warning: { bg: 'bg-white', border: 'border-amber-200', text: 'text-amber-700', icon: AlertTriangle },
  error: { bg: 'bg-white', border: 'border-red-200', text: 'text-red-700', icon: XCircle },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, variant: ToastVariant = 'info', durationMs = 3500) => {
      const id = `toast-${++counter}`;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), durationMs);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (m) => show(m, 'success'),
      error: (m) => show(m, 'error', 5000),
      info: (m) => show(m, 'info'),
      warning: (m) => show(m, 'warning'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed top-4 inset-x-4 sm:top-6 sm:right-6 sm:left-auto sm:inset-x-auto z-[100] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => {
          const { bg, border, text, icon: Icon } = config[t.variant];
          return (
            <div
              key={t.id}
              role="status"
              className={`flex items-start gap-3 ${bg} ${border} ${text} border rounded-xl shadow-lg p-3 sm:w-80 pointer-events-auto animate-in slide-in-from-top duration-200`}
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="flex-1 text-sm leading-snug">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Cerrar notificación"
                className="p-1 -m-1 hover:bg-slate-100 rounded transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>');
  }
  return ctx;
}
