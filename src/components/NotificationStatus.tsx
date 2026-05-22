'use client';

import { useState } from 'react';
import { Bell, BellOff, BellRing, Share2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function NotificationStatus() {
  const { status, error, enable } = usePushNotifications();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [testError, setTestError] = useState<string>('');

  const handleTest = async () => {
    setTesting(true);
    setTestResult('idle');
    try {
      const res = await fetch('/api/push/test', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.sent > 0) {
        setTestResult('ok');
      } else {
        setTestResult('fail');
        setTestError(data.error || 'No se pudo enviar');
      }
    } catch {
      setTestResult('fail');
      setTestError('Error de red');
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult('idle'), 4000);
    }
  };

  if (status === 'loading' || status === 'unsupported') return null;

  if (status === 'ios_needs_install') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Share2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-blue-900">Instala la app para recibir notificaciones</p>
          <p className="text-blue-700 mt-1">
            En Safari, toca el botón <strong>Compartir</strong> y luego <strong>"Agregar a pantalla de inicio"</strong>. Después abre la app desde el ícono.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <BellOff className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-red-900">Notificaciones bloqueadas</p>
          <p className="text-red-700 mt-1">
            Para recibir recordatorios, activa las notificaciones desde la configuración del navegador.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'default') {
    return (
      <button
        onClick={enable}
        className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-left transition-colors"
      >
        <BellRing className="w-5 h-5 text-amber-600 shrink-0" />
        <div className="text-sm flex-1">
          <p className="font-semibold text-amber-900">Activa las notificaciones</p>
          <p className="text-amber-700 mt-0.5">Recibe recordatorios diarios de tus ejercicios.</p>
        </div>
      </button>
    );
  }

  if (status === 'granted_no_sub') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <p className="font-semibold text-amber-900">Hubo un problema con las notificaciones</p>
            {error && <p className="text-amber-700 mt-1 text-xs">{error}</p>}
            <button onClick={enable} className="mt-2 text-amber-700 font-medium text-sm hover:underline">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // subscribed
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-sm text-green-800 min-w-0">
        <Bell className="w-4 h-4 shrink-0" />
        <span className="font-medium truncate">
          {testResult === 'ok' ? '¡Notificación enviada!' : testResult === 'fail' ? testError : 'Notificaciones activadas'}
        </span>
      </div>
      <button
        onClick={handleTest}
        disabled={testing}
        className="text-xs font-medium text-green-700 hover:text-green-900 disabled:opacity-50 shrink-0 px-2 py-1 rounded hover:bg-green-100 transition-colors"
      >
        {testing ? 'Enviando...' : testResult === 'ok' ? <CheckCircle2 className="w-4 h-4 inline" /> : 'Probar'}
      </button>
    </div>
  );
}
