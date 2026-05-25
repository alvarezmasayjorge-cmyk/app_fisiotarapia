'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function PatientError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[patient-error]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <div className="bg-amber-100 rounded-full p-4">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          No se pudo cargar tu panel
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          Hubo un problema al conectar con el servidor. Por favor intenta de nuevo.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
