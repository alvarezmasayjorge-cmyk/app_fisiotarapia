'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Plus, X, Trash2 } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  description: string;
  sets: number | null;
  reps: number | null;
  duration: string | null;
  frequency: string | null;
  tags: string | null;
  isHomeOnly: boolean;
  imageUrl: string | null;
  videoUrl: string | null;
}

export default function ExercisesPageClient({ initialExercises }: { initialExercises: Exercise[] }) {
  const router = useRouter();
  const [exercises, setExercises] = useState(initialExercises);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', sets: '', reps: '', duration: '', frequency: '', tags: '', isHomeOnly: true, imageUrl: '', videoUrl: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ name: '', description: '', sets: '', reps: '', duration: '', frequency: '', tags: '', isHomeOnly: true, imageUrl: '', videoUrl: '' });
        router.refresh();
        const newEx = await res.json();
        setExercises([...exercises, newEx]);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este ejercicio?')) return;
    const res = await fetch(`/api/exercises?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setExercises(exercises.filter(e => e.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ejercicios</h1>
          <p className="text-slate-500 mt-1">Biblioteca de ejercicios disponibles</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm shadow-sm"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Nuevo Ejercicio'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
              <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                placeholder="Ej: Elevación de pierna" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
              <input type="text" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})}
                placeholder="rodilla,pierna,fuerza" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción *</label>
            <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Instrucciones detalladas del ejercicio..." rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none text-slate-900" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Series</label>
              <input type="number" value={form.sets} onChange={e => setForm({...form, sets: e.target.value})}
                placeholder="3" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Repeticiones</label>
              <input type="number" value={form.reps} onChange={e => setForm({...form, reps: e.target.value})}
                placeholder="15" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duración</label>
              <input type="text" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})}
                placeholder="30s" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Enlace de YouTube</label>
              <input type="url" value={form.videoUrl} onChange={e => setForm({...form, videoUrl: e.target.value})}
                placeholder="https://youtube.com/watch?v=..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Frecuencia</label>
              <input type="text" value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})}
                placeholder="Diario" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="homeOnly" checked={form.isHomeOnly} onChange={e => setForm({...form, isHomeOnly: e.target.checked})}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
            <label htmlFor="homeOnly" className="text-sm text-slate-700">Solo para hacer en casa</label>
          </div>
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm disabled:opacity-50">
            <Plus className="w-4 h-4" /> {saving ? 'Guardando...' : 'Crear Ejercicio'}
          </button>
        </form>
      )}

      {/* Exercise Grid */}
      {exercises.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
          <Dumbbell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No hay ejercicios creados aún.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => (
            <div key={ex.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow group relative">
              <button onClick={() => handleDelete(ex.id)}
                className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                  {ex.imageUrl ? (
                    <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Dumbbell className="w-6 h-6 text-teal-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{ex.name}</h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{ex.description}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex-wrap">
                {ex.sets && <span className="bg-slate-100 px-2 py-1 rounded">{ex.sets} series</span>}
                {ex.reps && <span className="bg-slate-100 px-2 py-1 rounded">{ex.reps} reps</span>}
                {ex.duration && <span className="bg-slate-100 px-2 py-1 rounded">{ex.duration}</span>}
                {ex.isHomeOnly && <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Casa</span>}
              </div>
              {ex.tags && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {ex.tags.split(',').map(tag => (
                    <span key={tag} className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{tag.trim()}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
