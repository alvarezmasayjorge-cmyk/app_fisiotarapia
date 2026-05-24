'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import Link from 'next/link';
import { PILLAR_LABELS, PILLAR_VALUES, type Pillar } from '@/lib/validation';

interface Exercise {
  id: string;
  name: string;
  sets: number | null;
  reps: number | null;
  duration: string | null;
}

interface Restriction {
  description: string;
  severity: string;
}

interface Nutrition {
  type: string;
  description: string;
  dose: string;
  time: string;
}

const PILLAR_ACCENT: Record<Pillar, string> = {
  PELVIC_FLOOR: 'bg-rose-50 text-rose-700 border-rose-200',
  PAIN: 'bg-amber-50 text-amber-700 border-amber-200',
  AESTHETIC: 'bg-violet-50 text-violet-700 border-violet-200',
};

export default function EditPlanPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const patientId = params.id as string;

  const initialPillar = (searchParams.get('pillar') as Pillar) || 'PAIN';
  const [pillar, setPillar] = useState<Pillar>(
    PILLAR_VALUES.includes(initialPillar) ? initialPillar : 'PAIN'
  );
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentText, setTreatmentText] = useState('');
  const [hasExercises, setHasExercises] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [nutrition, setNutrition] = useState<Nutrition[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch('/api/exercises-list')
      .then(res => res.json())
      .then(data => {
        setAllExercises(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleExercise = (id: string) => {
    setSelectedExerciseIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const addRestriction = () => {
    setRestrictions([...restrictions, { description: '', severity: 'WARNING' }]);
  };

  const removeRestriction = (i: number) => {
    setRestrictions(restrictions.filter((_, idx) => idx !== i));
  };

  const updateRestriction = (i: number, field: keyof Restriction, value: string) => {
    const updated = [...restrictions];
    updated[i] = { ...updated[i], [field]: value };
    setRestrictions(updated);
  };

  const addNutrition = () => {
    setNutrition([...nutrition, { type: 'SUPPLEMENT', description: '', dose: '', time: '' }]);
  };

  const removeNutrition = (i: number) => {
    setNutrition(nutrition.filter((_, idx) => idx !== i));
  };

  const updateNutrition = (i: number, field: keyof Nutrition, value: string) => {
    const updated = [...nutrition];
    updated[i] = { ...updated[i], [field]: value };
    setNutrition(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!diagnosis.trim()) {
      setError('El diagnóstico es obligatorio.');
      return;
    }
    if (!treatmentText.trim()) {
      setError('Escribe el tratamiento que vas a aplicar.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/treatment-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          pillar,
          diagnosis: diagnosis.trim(),
          treatmentText: treatmentText.trim(),
          exerciseIds: hasExercises ? selectedExerciseIds : [],
          restrictions: restrictions.filter(r => r.description.trim()),
          nutrition: nutrition.filter(n => n.description.trim()),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Error al guardar el plan');
        return;
      }

      router.push(`/admin/patients/${patientId}`);
      router.refresh();
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/patients/${patientId}`} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Plan de Tratamiento</h1>
          <p className="text-slate-500 text-sm">Define el pilar y registra el plan clínico</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Pilar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-semibold text-slate-900 mb-1">Pilar de tratamiento</h2>
          <p className="text-xs text-slate-500 mb-4">El paciente puede tener planes activos en varios pilares.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PILLAR_VALUES.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPillar(p)}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                  pillar === p
                    ? PILLAR_ACCENT[p] + ' ring-2 ring-offset-1 ring-current/30'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                }`}
              >
                {PILLAR_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Diagnóstico */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <label className="block">
            <h2 className="font-semibold text-slate-900 mb-2">Diagnóstico <span className="text-red-500">*</span></h2>
            <textarea
              required
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              placeholder="Describe el diagnóstico para este pilar..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 resize-y"
            />
          </label>
        </div>

        {/* Tratamiento abierto */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <label className="block">
            <h2 className="font-semibold text-slate-900 mb-2">Tratamiento a aplicar <span className="text-red-500">*</span></h2>
            <p className="text-xs text-slate-500 mb-3">Describe libremente el tratamiento, técnicas, sesiones, frecuencia, etc.</p>
            <textarea
              required
              value={treatmentText}
              onChange={e => setTreatmentText(e.target.value)}
              placeholder="Ej: 2 sesiones semanales de electroestimulación + masaje miofascial. Duración estimada: 6 semanas..."
              rows={5}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 resize-y"
            />
          </label>
        </div>

        {/* Ejercicios opcionales */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasExercises}
              onChange={e => setHasExercises(e.target.checked)}
              className="mt-1 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
            />
            <div className="flex-1">
              <h2 className="font-semibold text-slate-900">Asignar ejercicios</h2>
              <p className="text-xs text-slate-500 mt-0.5">Marca solo si este tratamiento requiere ejercicios para el paciente.</p>
            </div>
          </label>

          {hasExercises && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              {loading ? (
                <p className="text-sm text-slate-400">Cargando ejercicios...</p>
              ) : allExercises.length === 0 ? (
                <p className="text-sm text-slate-400">No hay ejercicios en la biblioteca. <Link href="/admin/exercises" className="text-amber-500 hover:underline">Crea uno primero</Link>.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {allExercises.map(ex => (
                    <label
                      key={ex.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedExerciseIds.includes(ex.id)
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedExerciseIds.includes(ex.id)}
                        onChange={() => toggleExercise(ex.id)}
                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{ex.name}</p>
                        <p className="text-xs text-slate-500">
                          {ex.sets && `${ex.sets}s`}{ex.reps && ` x ${ex.reps}r`}{ex.duration && ` · ${ex.duration}`}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Restricciones */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-semibold text-slate-900">Recomendaciones y restricciones</h2>
              <p className="text-xs text-slate-500 mt-0.5">Actividades a evitar o precauciones a tomar.</p>
            </div>
            <button type="button" onClick={addRestriction} className="inline-flex items-center gap-1 text-sm text-amber-500 hover:text-amber-600 font-medium">
              <Plus className="w-4 h-4" /> Agregar
            </button>
          </div>
          {restrictions.length === 0 ? (
            <p className="text-sm text-slate-400">Sin restricciones. Haz clic en &quot;Agregar&quot; para añadir una.</p>
          ) : (
            <div className="space-y-3">
              {restrictions.map((r, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej: No saltar ni correr"
                      value={r.description}
                      onChange={e => updateRestriction(i, 'description', e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                    />
                    <button type="button" onClick={() => removeRestriction(i)} className="p-2 text-red-400 hover:text-red-600 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <select
                    value={r.severity}
                    onChange={e => updateRestriction(i, 'severity', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 bg-white"
                  >
                    <option value="WARNING">Precaución</option>
                    <option value="IMPORTANT">Importante</option>
                    <option value="CRITICAL">Crítico</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nutrición */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-semibold text-slate-900">Nutrición / Suplementos</h2>
              <p className="text-xs text-slate-500 mt-0.5">Opcional. Se muestra al paciente en su sección de Nutrición.</p>
            </div>
            <button type="button" onClick={addNutrition} className="inline-flex items-center gap-1 text-sm text-amber-500 hover:text-amber-600 font-medium">
              <Plus className="w-4 h-4" /> Agregar
            </button>
          </div>
          {nutrition.length === 0 ? (
            <p className="text-sm text-slate-400">Sin indicaciones nutricionales.</p>
          ) : (
            <div className="space-y-4">
              {nutrition.map((n, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={n.type}
                      onChange={e => updateNutrition(i, 'type', e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 bg-white"
                    >
                      <option value="SUPPLEMENT">Suplemento</option>
                      <option value="DIET_RECOMMENDED">Dieta Recomendada</option>
                      <option value="DIET_AVOID">Evitar</option>
                    </select>
                    <button type="button" onClick={() => removeNutrition(i)} className="p-2 text-red-400 hover:text-red-600 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Descripción (ej: Colágeno Hidrolizado)"
                    value={n.description}
                    onChange={e => updateNutrition(i, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Dosis (ej: 1 cacito)"
                      value={n.dose}
                      onChange={e => updateNutrition(i, 'dose', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                    />
                    <input
                      type="text"
                      placeholder="Horario (ej: Con el desayuno)"
                      value={n.time}
                      onChange={e => updateNutrition(i, 'time', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full inline-flex justify-center items-center gap-2 bg-amber-500 text-white px-4 py-3 rounded-lg hover:bg-amber-600 transition-colors font-medium disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Guardando...' : `Guardar plan de ${PILLAR_LABELS[pillar]}`}
        </button>
      </form>
    </div>
  );
}
