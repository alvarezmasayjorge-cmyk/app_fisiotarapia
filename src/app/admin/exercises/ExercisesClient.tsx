'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Dumbbell, Plus, X, Trash2, AlertCircle, Pencil, Eye,
  Play, Clock, RotateCcw, Repeat, Home,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

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

type FormState = {
  name: string;
  description: string;
  sets: string;
  reps: string;
  duration: string;
  frequency: string;
  tags: string;
  isHomeOnly: boolean;
  imageUrl: string;
  videoUrl: string;
};

const EMPTY_FORM: FormState = {
  name: '', description: '', sets: '', reps: '', duration: '',
  frequency: '', tags: '', isHomeOnly: true, imageUrl: '', videoUrl: '',
};

function exerciseToForm(ex: Exercise): FormState {
  return {
    name: ex.name,
    description: ex.description,
    sets: ex.sets?.toString() ?? '',
    reps: ex.reps?.toString() ?? '',
    duration: ex.duration ?? '',
    frequency: ex.frequency ?? '',
    tags: ex.tags ?? '',
    isHomeOnly: ex.isHomeOnly,
    imageUrl: ex.imageUrl ?? '',
    videoUrl: ex.videoUrl ?? '',
  };
}

function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

/* ─── Exercise Form (shared for create & edit) ─── */
function ExerciseForm({
  form,
  setForm,
  onSubmit,
  saving,
  submitLabel,
  onCancel,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  submitLabel: string;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
          <input
            type="text" required value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Ej: Elevación de pierna"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
          <input
            type="text" value={form.tags}
            onChange={e => setForm({ ...form, tags: e.target.value })}
            placeholder="rodilla,pierna,fuerza"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción *</label>
        <textarea
          required value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Instrucciones detalladas del ejercicio..."
          rows={4}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none text-slate-900"
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Series</label>
          <input
            type="number" value={form.sets}
            onChange={e => setForm({ ...form, sets: e.target.value })}
            placeholder="3"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Repeticiones</label>
          <input
            type="number" value={form.reps}
            onChange={e => setForm({ ...form, reps: e.target.value })}
            placeholder="15"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Duración</label>
          <input
            type="text" value={form.duration}
            onChange={e => setForm({ ...form, duration: e.target.value })}
            placeholder="30s"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Frecuencia</label>
          <input
            type="text" value={form.frequency}
            onChange={e => setForm({ ...form, frequency: e.target.value })}
            placeholder="Diario / 3 veces por semana"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">URL de Imagen</label>
          <input
            type="url" value={form.imageUrl}
            onChange={e => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Enlace de YouTube</label>
        <input
          type="url" value={form.videoUrl}
          onChange={e => setForm({ ...form, videoUrl: e.target.value })}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox" id="homeOnly" checked={form.isHomeOnly}
          onChange={e => setForm({ ...form, isHomeOnly: e.target.checked })}
          className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
        />
        <label htmlFor="homeOnly" className="text-sm text-slate-700">Solo para hacer en casa</label>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="button" onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
        >
          Cancelar
        </button>
        <button
          type="submit" disabled={saving}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm disabled:opacity-50"
        >
          {saving ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

/* ─── Detail View Modal ─── */
function ExerciseDetailModal({ exercise, onClose, onEdit }: { exercise: Exercise; onClose: () => void; onEdit: () => void }) {
  const ytId = exercise.videoUrl ? getYouTubeId(exercise.videoUrl) : null;

  return (
    <Modal open onClose={onClose} title={exercise.name} size="lg">
      <div className="space-y-5">
        {/* Imagen / Video thumbnail */}
        {(exercise.imageUrl || ytId) && (
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-slate-100">
            {ytId ? (
              <Image
                src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                alt={exercise.name}
                fill
                className="object-cover"
              />
            ) : exercise.imageUrl ? (
              <Image src={exercise.imageUrl} alt={exercise.name} fill className="object-cover" />
            ) : null}
          </div>
        )}

        {/* Descripción */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Descripción / Instrucciones</h4>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{exercise.description}</p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-3">
          {exercise.sets && (
            <div className="bg-amber-50 rounded-xl p-3 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Series</p>
                <p className="font-bold text-slate-800 text-sm">{exercise.sets}</p>
              </div>
            </div>
          )}
          {exercise.reps && (
            <div className="bg-amber-50 rounded-xl p-3 flex items-center gap-2">
              <Repeat className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Repeticiones</p>
                <p className="font-bold text-slate-800 text-sm">{exercise.reps}</p>
              </div>
            </div>
          )}
          {exercise.duration && (
            <div className="bg-amber-50 rounded-xl p-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Duración</p>
                <p className="font-bold text-slate-800 text-sm">{exercise.duration}</p>
              </div>
            </div>
          )}
          {exercise.frequency && (
            <div className="bg-amber-50 rounded-xl p-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Frecuencia</p>
                <p className="font-bold text-slate-800 text-sm">{exercise.frequency}</p>
              </div>
            </div>
          )}
        </div>

        {/* Etiquetas */}
        {exercise.tags && (
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Etiquetas</h4>
            <div className="flex flex-wrap gap-1.5">
              {exercise.tags.split(',').map(tag => (
                <span key={tag} className="text-xs bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full border border-amber-100">{tag.trim()}</span>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="flex gap-2 flex-wrap">
          {exercise.isHomeOnly && (
            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">
              <Home className="w-3.5 h-3.5" /> Solo en casa
            </span>
          )}
          {ytId && (
            <a
              href={exercise.videoUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-full font-medium hover:bg-red-200 transition-colors"
            >
              <Play className="w-3.5 h-3.5" fill="currentColor" /> Ver en YouTube
            </a>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
          >
            Cerrar
          </button>
          <button
            onClick={onEdit}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm"
          >
            <Pencil className="w-4 h-4" /> Editar ejercicio
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Main Page Client ─── */
export default function ExercisesPageClient({ initialExercises }: { initialExercises: Exercise[] }) {
  const [exercises, setExercises] = useState(initialExercises);

  // Create
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  // View detail
  const [viewTarget, setViewTarget] = useState<Exercise | null>(null);

  // Edit
  const [editTarget, setEditTarget] = useState<Exercise | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Handlers */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        const newEx = await res.json();
        setExercises(prev => [...prev, newEx].sort((a, b) => a.name.localeCompare(b.name)));
        setShowCreateForm(false);
        setCreateForm(EMPTY_FORM);
      }
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (ex: Exercise) => {
    setViewTarget(null);
    setEditTarget(ex);
    setEditForm(exerciseToForm(ex));
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/exercises?id=${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setExercises(prev =>
          prev.map(ex => ex.id === updated.id ? updated : ex).sort((a, b) => a.name.localeCompare(b.name))
        );
        setEditTarget(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/exercises?id=${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) setExercises(exercises.filter(e => e.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ejercicios</h1>
          <p className="text-slate-500 mt-1">Biblioteca de ejercicios disponibles · {exercises.length} en total</p>
        </div>
        <button
          onClick={() => { setShowCreateForm(!showCreateForm); setCreateForm(EMPTY_FORM); }}
          className="inline-flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm shadow-sm"
        >
          {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreateForm ? 'Cancelar' : 'Nuevo Ejercicio'}
        </button>
      </div>

      {/* Create Form (inline) */}
      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Nuevo ejercicio</h2>
          <ExerciseForm
            form={createForm}
            setForm={setCreateForm}
            onSubmit={handleCreate}
            saving={creating}
            submitLabel="Crear Ejercicio"
            onCancel={() => { setShowCreateForm(false); setCreateForm(EMPTY_FORM); }}
          />
        </div>
      )}

      {/* Exercise Grid */}
      {exercises.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
          <Dumbbell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No hay ejercicios creados aún.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => {
            const ytId = ex.videoUrl ? getYouTubeId(ex.videoUrl) : null;
            return (
              <div
                key={ex.id}
                className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow relative group"
              >
                {/* Action buttons top-right */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setViewTarget(ex)}
                    className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Ver detalle"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEdit(ex)}
                    className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(ex)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Card content – clickable to view detail */}
                <button
                  onClick={() => setViewTarget(ex)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 relative overflow-hidden">
                      {ytId ? (
                        <Image
                          src={`https://img.youtube.com/vi/${ytId}/default.jpg`}
                          alt={ex.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : ex.imageUrl ? (
                        <Image
                          src={ex.imageUrl}
                          alt={ex.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <Dumbbell className="w-6 h-6 text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pr-16">
                      <h3 className="font-semibold text-slate-900 truncate">{ex.name}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{ex.description}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex-wrap">
                    {ex.sets && <span className="bg-slate-100 px-2 py-1 rounded">{ex.sets} series</span>}
                    {ex.reps && <span className="bg-slate-100 px-2 py-1 rounded">{ex.reps} reps</span>}
                    {ex.duration && <span className="bg-slate-100 px-2 py-1 rounded">{ex.duration}</span>}
                    {ex.isHomeOnly && <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Casa</span>}
                    {ytId && <span className="bg-red-100 text-red-600 px-2 py-1 rounded flex items-center gap-1"><Play className="w-2.5 h-2.5" fill="currentColor" />Video</span>}
                  </div>

                  {ex.tags && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {ex.tags.split(',').map(tag => (
                        <span key={tag} className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">{tag.trim()}</span>
                      ))}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* View Detail Modal */}
      {viewTarget && (
        <ExerciseDetailModal
          exercise={viewTarget}
          onClose={() => setViewTarget(null)}
          onEdit={() => openEdit(viewTarget)}
        />
      )}

      {/* Edit Modal */}
      <Modal
        open={editTarget !== null}
        onClose={() => !saving && setEditTarget(null)}
        title={`Editar: ${editTarget?.name ?? ''}`}
        size="lg"
      >
        <ExerciseForm
          form={editForm}
          setForm={setEditForm}
          onSubmit={handleEdit}
          saving={saving}
          submitLabel="Guardar cambios"
          onCancel={() => setEditTarget(null)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteTarget !== null} onClose={() => !deleting && setDeleteTarget(null)} size="sm">
        <div className="text-center space-y-4 pt-2">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">¿Eliminar este ejercicio?</h3>
            <p className="text-sm text-slate-500 mt-1">
              {deleteTarget ? `"${deleteTarget.name}" se eliminará de la biblioteca.` : ''} Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm disabled:opacity-50"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
