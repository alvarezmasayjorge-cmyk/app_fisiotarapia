'use client';

import { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';

export default function ReminderButton({ patientUserId, patientName }: { patientUserId: string; patientName: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'no_sub'>('idle');

  const handleSend = async () => {
    setStatus('sending');
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: patientUserId,
          title: '¡Hola! 👋 Tu fisioterapeuta te envía un recordatorio',
          body: `Recuerda completar tus ejercicios del día. ¡Tú puedes, ${patientName.split(' ')[0]}!`,
          url: '/patient',
        }),
      });
      const data = await res.json();
      setStatus(data.sent > 0 ? 'sent' : 'no_sub');
    } catch {
      setStatus('idle');
    } finally {
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <button
      onClick={handleSend}
      disabled={status === 'sending'}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        status === 'sent'
          ? 'bg-green-100 text-green-700'
          : status === 'no_sub'
          ? 'bg-slate-100 text-slate-500'
          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
      } disabled:opacity-50`}
      title={status === 'no_sub' ? 'El paciente no tiene notificaciones activadas' : 'Enviar recordatorio de ejercicios'}
    >
      {status === 'no_sub' ? (
        <><BellOff className="w-4 h-4" /> Sin notificaciones</>
      ) : status === 'sent' ? (
        <><Bell className="w-4 h-4" /> ¡Enviado!</>
      ) : (
        <><Bell className="w-4 h-4" /> {status === 'sending' ? 'Enviando...' : 'Recordatorio'}</>
      )}
    </button>
  );
}
