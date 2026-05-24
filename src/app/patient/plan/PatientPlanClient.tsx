'use client';

import { useState } from 'react';
import { AlertCircle, FileText, Stethoscope, Sparkles } from 'lucide-react';
import { type Pillar } from '@/lib/validation';

type Restriction = { id: string; description: string; severity: string };
type Plan = {
  id: string;
  pillar: Pillar;
  pillarLabel: string;
  diagnosis: string;
  treatmentText: string;
  restrictions: Restriction[];
};

const PILLAR_STYLES: Record<Pillar, { active: string; inactive: string; accent: string }> = {
  PELVIC_FLOOR: {
    active: 'bg-rose-500 text-white shadow-sm',
    inactive: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
    accent: 'text-rose-500',
  },
  PAIN: {
    active: 'bg-amber-500 text-white shadow-sm',
    inactive: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
    accent: 'text-amber-500',
  },
  AESTHETIC: {
    active: 'bg-violet-500 text-white shadow-sm',
    inactive: 'bg-violet-50 text-violet-700 hover:bg-violet-100',
    accent: 'text-violet-500',
  },
};

export default function PatientPlanClient({
  plans,
  profileNotes,
}: {
  plans: Plan[];
  profileNotes: string | null;
}) {
  const [activeId, setActiveId] = useState(plans[0]?.id ?? '');
  const active = plans.find(p => p.id === activeId) ?? plans[0];
  const styles = PILLAR_STYLES[active.pillar];

  return (
    <div className="space-y-5 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 px-1">Mi Plan Médico</h1>
        <p className="text-slate-500 text-sm mt-1 px-1">
          {plans.length > 1
            ? `Tienes ${plans.length} pilares de tratamiento activos.`
            : 'Pautas de tu fisioterapeuta.'}
        </p>
      </div>

      {/* Tabs por pilar */}
      {plans.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {plans.map(p => (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeId === p.id ? PILLAR_STYLES[p.pillar].active : PILLAR_STYLES[p.pillar].inactive
              }`}
            >
              {p.pillarLabel}
            </button>
          ))}
        </div>
      )}

      {/* Encabezado del pilar activo */}
      {plans.length === 1 && (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${styles.inactive}`}>
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-xs font-bold uppercase tracking-wider">{active.pillarLabel}</span>
        </div>
      )}

      {/* Diagnóstico */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Stethoscope className={`w-5 h-5 ${styles.accent}`} /> Diagnóstico
        </h2>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-slate-800 whitespace-pre-wrap">{active.diagnosis || 'Sin diagnóstico registrado.'}</p>
        </div>
      </div>

      {/* Tratamiento */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
          <FileText className={`w-5 h-5 ${styles.accent}`} /> Tratamiento a aplicar
        </h2>
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
          {active.treatmentText || 'Tu fisioterapeuta detallará pronto el tratamiento.'}
        </div>
      </div>

      {/* Recomendaciones y restricciones */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" /> Recomendaciones y restricciones
        </h2>
        {active.restrictions.length === 0 ? (
          <p className="text-sm text-slate-500">Sin restricciones específicas para este pilar.</p>
        ) : (
          <div className="space-y-3">
            {active.restrictions.map(r => (
              <div
                key={r.id}
                className={`p-3 rounded-xl border flex gap-3 ${
                  r.severity === 'CRITICAL'
                    ? 'bg-red-50 border-red-100 text-red-900'
                    : r.severity === 'IMPORTANT'
                      ? 'bg-orange-50 border-orange-100 text-orange-900'
                      : 'bg-amber-50 border-amber-100 text-amber-900'
                }`}
              >
                <AlertCircle
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    r.severity === 'CRITICAL'
                      ? 'text-red-500'
                      : r.severity === 'IMPORTANT'
                        ? 'text-orange-500'
                        : 'text-amber-500'
                  }`}
                />
                <div className="flex flex-wrap items-start gap-2">
                  <p className="font-medium text-sm">{r.description}</p>
                  <span className="text-[10px] font-bold uppercase opacity-60 mt-0.5">
                    {r.severity === 'CRITICAL' ? 'Crítico' : r.severity === 'IMPORTANT' ? 'Importante' : 'Precaución'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notas generales del perfil */}
      {profileNotes && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-400" /> Notas generales
          </h2>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
            {profileNotes}
          </div>
        </div>
      )}
    </div>
  );
}
