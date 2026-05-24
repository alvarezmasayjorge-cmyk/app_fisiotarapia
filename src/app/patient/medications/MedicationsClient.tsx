'use client';

import { useState } from 'react';
import { Pill, CheckCircle, Clock, ChevronRight } from 'lucide-react';

type Dose = { id: string; scheduledAt: string; takenAt: string | null };
type Medication = {
  id: string;
  name: string;
  dose: string;
  frequencyHours: number;
  notes: string | null;
  nextDoseAt: string;
  lastTakenAt: string | null;
  doses: Dose[];
};

function freqLabel(h: number) {
  if (h === 24) return 'Una vez al día';
  if (h === 12) return 'Cada 12 horas';
  if (h === 8) return 'Cada 8 horas';
  if (h === 6) return 'Cada 6 horas';
  if (h === 4) return 'Cada 4 horas';
  return `Cada ${h} horas`;
}

function timeUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'ahora';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `en ${h}h ${m}m`;
  return `en ${m} min`;
}

export default function MedicationsClient({ medications }: { medications: Medication[] }) {
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);

  const markTaken = async (med: Medication) => {
    if (loading) return;
    setLoading(med.id);
    try {
      const res = await fetch('/api/medications/taken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicationId: med.id }),
      });
      if (res.ok) {
        setTaken(prev => new Set([...prev, med.id]));
      }
    } finally {
      setLoading(null);
    }
  };

  if (medications.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <Pill className="w-12 h-12 text-slate-300 mx-auto" />
        <p className="text-slate-500 font-medium">Sin medicamentos activos</p>
        <p className="text-slate-400 text-sm">Tu fisioterapeuta aún no ha registrado medicamentos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 px-1">Mis Medicamentos</h1>
        <p className="text-slate-500 text-sm mt-1 px-1">Registra cuándo tomas cada medicamento.</p>
      </div>

      <div className="space-y-3">
        {medications.map(med => {
          const isTaken = taken.has(med.id);
          const nextDate = new Date(med.nextDoseAt);
          const isPast = nextDate < new Date();
          const isLoading = loading === med.id;

          return (
            <div
              key={med.id}
              className={`bg-white rounded-2xl shadow-sm border p-5 space-y-3 ${
                isTaken ? 'border-green-100' : isPast ? 'border-amber-200' : 'border-slate-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isTaken ? 'bg-green-100' : isPast ? 'bg-amber-100' : 'bg-blue-50'}`}>
                    <Pill className={`w-5 h-5 ${isTaken ? 'text-green-600' : isPast ? 'text-amber-600' : 'text-blue-500'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{med.name}</p>
                    <p className="text-sm text-slate-500">{med.dose} · {freqLabel(med.frequencyHours)}</p>
                  </div>
                </div>
                {isTaken && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" /> Tomado
                  </span>
                )}
              </div>

              {med.notes && (
                <p className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">{med.notes}</p>
              )}

              <div className={`flex items-center gap-2 text-sm rounded-xl px-3 py-2 ${
                isPast ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'
              }`}>
                <Clock className="w-4 h-4 shrink-0" />
                <span>
                  Próxima dosis: <strong>
                    {nextDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </strong>
                  {' '}({timeUntil(med.nextDoseAt)})
                </span>
              </div>

              {!isTaken && (
                <button
                  onClick={() => markTaken(med)}
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl font-medium text-sm transition-all bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    'Registrando...'
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> Marcar como tomado</>
                  )}
                </button>
              )}

              {med.doses.length > 0 && (
                <details className="group">
                  <summary className="text-xs text-slate-400 cursor-pointer flex items-center gap-1 select-none">
                    <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
                    Historial reciente
                  </summary>
                  <div className="mt-2 space-y-1">
                    {med.doses.map(d => (
                      <div key={d.id} className="flex justify-between items-center text-xs px-2 py-1 bg-slate-50 rounded-lg">
                        <span className="text-slate-500">
                          {new Date(d.scheduledAt).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {d.takenAt ? (
                          <span className="text-green-600 font-medium flex items-center gap-0.5">
                            <CheckCircle className="w-3 h-3" /> Tomado
                          </span>
                        ) : (
                          <span className="text-slate-400">Pendiente</span>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
