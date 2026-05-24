'use client';

import { useState } from 'react';
import { Plus, Pill, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

type Medication = {
  id: string;
  name: string;
  dose: string;
  frequencyHours: number;
  startAt: string;
  endAt: string | null;
  isActive: boolean;
  notes: string | null;
};

const FREQ_OPTIONS = [
  { label: 'Cada 4 horas', value: 4 },
  { label: 'Cada 6 horas', value: 6 },
  { label: 'Cada 8 horas', value: 8 },
  { label: 'Cada 12 horas', value: 12 },
  { label: 'Una vez al día', value: 24 },
  { label: 'Cada 2 días', value: 48 },
];

function freqLabel(h: number) {
  return FREQ_OPTIONS.find(o => o.value === h)?.label ?? `Cada ${h}h`;
}

export default function MedicationsAdmin({
  patientId,
  initial,
}: {
  patientId: string;
  initial: Medication[];
}) {
  const [meds, setMeds] = useState<Medication[]>(initial);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const now = new Date().toISOString().slice(0, 16); // datetime-local format
  const [form, setForm] = useState({
    name: '',
    dose: '',
    frequencyHours: 8,
    startAt: now,
    endAt: '',
    notes: '',
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          name: form.name,
          dose: form.dose,
          frequencyHours: form.frequencyHours,
          startAt: new Date(form.startAt).toISOString(),
          endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Error al guardar');
        return;
      }
      const med = await res.json();
      setMeds(prev => [med, ...prev]);
      setAddOpen(false);
      setForm({ name: '', dose: '', frequencyHours: 8, startAt: now, endAt: '', notes: '' });
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (med: Medication) => {
    const res = await fetch(`/api/medications/${med.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !med.isActive }),
    });
    if (res.ok) {
      setMeds(prev => prev.map(m => m.id === med.id ? { ...m, isActive: !m.isActive } : m));
    }
  };

  const deleteMed = async (id: string) => {
    const res = await fetch(`/api/medications/${id}`, { method: 'DELETE' });
    if (res.ok) setMeds(prev => prev.filter(m => m.id !== id));
  };

  const active = meds.filter(m => m.isActive);
  const inactive = meds.filter(m => !m.isActive);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Pill className="w-4 h-4 text-blue-500" /> Medicamentos
        </h3>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Agregar
        </button>
      </div>

      {meds.length === 0 ? (
        <p className="text-sm text-slate-400">Sin medicamentos registrados.</p>
      ) : (
        <div className="space-y-2">
          {active.map(med => (
            <MedRow key={med.id} med={med} onToggle={toggleActive} onDelete={deleteMed} />
          ))}
          {inactive.length > 0 && (
            <>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-2">Inactivos</p>
              {inactive.map(med => (
                <MedRow key={med.id} med={med} onToggle={toggleActive} onDelete={deleteMed} />
              ))}
            </>
          )}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Agregar medicamento" size="md">
        <form onSubmit={handleAdd} className="space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg text-sm text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Medicamento *</label>
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Ibuprofeno"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dosis *</label>
              <input
                required
                value={form.dose}
                onChange={e => setForm({ ...form, dose: e.target.value })}
                placeholder="Ej: 400mg"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Frecuencia *</label>
              <select
                value={form.frequencyHours}
                onChange={e => setForm({ ...form, frequencyHours: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              >
                {FREQ_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Primera dosis *</label>
              <input
                type="datetime-local"
                required
                value={form.startAt}
                onChange={e => setForm({ ...form, startAt: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hasta (opcional)</label>
              <input
                type="datetime-local"
                value={form.endAt}
                onChange={e => setForm({ ...form, endAt: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
              <input
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Con alimentos, tomar con agua..."
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Agregar medicamento'}
            </button>
            <button type="button" onClick={() => setAddOpen(false)} className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function MedRow({
  med,
  onToggle,
  onDelete,
}: {
  med: Medication;
  onToggle: (m: Medication) => void;
  onDelete: (id: string) => void;
}) {
  const start = new Date(med.startAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${med.isActive ? 'bg-blue-50/40 border-blue-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
      <Pill className={`w-4 h-4 shrink-0 ${med.isActive ? 'text-blue-500' : 'text-slate-400'}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-slate-900 truncate">{med.name} <span className="font-normal text-slate-500">— {med.dose}</span></p>
        <p className="text-xs text-slate-500">{freqLabel(med.frequencyHours)} · desde {start}</p>
        {med.notes && <p className="text-xs text-slate-400 mt-0.5">{med.notes}</p>}
      </div>
      <button onClick={() => onToggle(med)} className="p-1.5 rounded-lg hover:bg-white transition-colors" title={med.isActive ? 'Pausar' : 'Reactivar'}>
        {med.isActive
          ? <ToggleRight className="w-5 h-5 text-blue-500" />
          : <ToggleLeft className="w-5 h-5 text-slate-400" />}
      </button>
      <button onClick={() => onDelete(med.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
