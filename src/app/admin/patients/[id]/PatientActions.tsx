'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, AlertTriangle, Eye, EyeOff, UserCheck, UserX } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import PhoneInputBO from '@/components/ui/PhoneInputBO';

type Props = {
  profileId: string;
  initial: {
    name: string;
    phone: string | null;
    notes: string | null;
    isActive: boolean;
  };
};

export default function PatientActions({ profileId, initial }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: initial.name,
    phone: initial.phone ?? '',
    password: '',
    notes: initial.notes ?? '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        name: form.name,
        phone: form.phone,
        notes: form.notes,
      };
      if (form.password) payload.password = form.password;

      const res = await fetch(`/api/patients/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Error al guardar');
        return;
      }
      setEditOpen(false);
      router.refresh();
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    setArchiving(true);
    try {
      const res = await fetch(`/api/patients/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !initial.isActive }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Error al cambiar estado');
        setArchiving(false);
        return;
      }
      setArchiveOpen(false);
      router.refresh();
    } catch {
      alert('Error de conexión');
    } finally {
      setArchiving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/patients/${profileId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Error al eliminar paciente');
        setDeleting(false);
        return;
      }
      router.push('/admin/patients');
      router.refresh();
    } catch {
      alert('Error de conexión');
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setEditOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" /> Editar datos
      </button>
      <button
        onClick={() => setArchiveOpen(true)}
        className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
          initial.isActive
            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            : 'bg-green-50 text-green-700 hover:bg-green-100'
        }`}
      >
        {initial.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
        {initial.isActive ? 'Dar de alta' : 'Reactivar'}
      </button>
      <button
        onClick={() => setDeleteOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" /> Eliminar
      </button>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar paciente" size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Celular / WhatsApp</label>
            <PhoneInputBO
              value={form.phone}
              onChange={phone => setForm({ ...form, phone })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nueva contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Dejar en blanco para no cambiar"
                minLength={6}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 pr-10 text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Solo cámbiala si el paciente la olvidó</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none text-slate-900"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-amber-500 text-white px-4 py-2.5 rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Eliminar paciente" size="sm">
        <div className="space-y-4">
          <div className="flex gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm text-red-900">
              <p className="font-semibold">Esta acción no se puede deshacer.</p>
              <p className="mt-1">
                Se eliminarán <strong>{initial.name}</strong>, su perfil, planes de tratamiento, progreso, citas y mensajes.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50"
            >
              {deleting ? 'Eliminando...' : 'Sí, eliminar definitivamente'}
            </button>
            <button
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
              className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={archiveOpen} onClose={() => setArchiveOpen(false)} title={initial.isActive ? 'Dar de alta' : 'Reactivar paciente'} size="sm">
        <div className="space-y-4">
          <div className={`flex gap-3 p-3 rounded-lg border ${initial.isActive ? 'bg-slate-50 border-slate-200' : 'bg-green-50 border-green-100'}`}>
            <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${initial.isActive ? 'text-slate-500' : 'text-green-600'}`} />
            <div className="text-sm text-slate-800">
              {initial.isActive ? (
                <>
                  <p className="font-semibold">Vas a dar de alta a <strong>{initial.name}</strong>.</p>
                  <p className="mt-1">
                    No podrá iniciar sesión ni recibir recordatorios. No se borran sus datos — podés reactivarla más adelante si vuelve.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold">Vas a reactivar a <strong>{initial.name}</strong>.</p>
                  <p className="mt-1">Volverá a poder iniciar sesión y recibir recordatorios.</p>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleToggleActive}
              disabled={archiving}
              className={`flex-1 text-white px-4 py-2.5 rounded-lg transition-colors font-medium text-sm disabled:opacity-50 ${
                initial.isActive ? 'bg-slate-700 hover:bg-slate-800' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {archiving ? 'Guardando...' : initial.isActive ? 'Sí, dar de alta' : 'Sí, reactivar'}
            </button>
            <button
              onClick={() => setArchiveOpen(false)}
              disabled={archiving}
              className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
