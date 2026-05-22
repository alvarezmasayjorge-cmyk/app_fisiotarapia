'use client';

import { useCallback, useState } from 'react';

type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

let counter = 0;

export function useToast() {
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

  return {
    toasts,
    show,
    dismiss,
    success: useCallback((m: string) => show(m, 'success'), [show]),
    error: useCallback((m: string) => show(m, 'error'), [show]),
    info: useCallback((m: string) => show(m, 'info'), [show]),
    warning: useCallback((m: string) => show(m, 'warning'), [show]),
  };
}
