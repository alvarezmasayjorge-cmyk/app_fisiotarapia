'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Video, MapPin, Plus, X } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
}

interface Appointment {
  id: string;
  date: string;
  mode: string;
  status: string;
  patient: { name: string };
}

export default function CalendarClient({ appointments, patients }: { appointments: Appointment[]; patients: Patient[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ patientUserId: '', date: '', time: '10:00', mode: 'PRESENTIAL' });

  const upcoming = appointments.filter(a => new Date(a.date) >= new Date());
  const past = appointments.filter(a => new Date(a.date) < new Date());

  function formatDate(date: string) {
    return new Intl.DateTimeFormat('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date));
  }

  function formatTime(date: string) {
    return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(date));
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dateTime = new Date(`${form.date}T${form.time}`);
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientUserId: form.patientUserId, date: dateTime.toISOString(), mode: form.mode }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ patientUserId: '', date: '', time: '10:00', mode: 'PRESENTIAL' });
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('¿Cancelar esta cita?')) return;
    await fetch('/api/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'CANCELLED' }),
    });
    router.refresh();
  };

  const handleComplete = async (id: string) => {
    await fetch('/api/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'COMPLETED' }),
    });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Agenda</h1>
          <p className="text-slate-500 mt-1">Gestiona tus citas con pacientes</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm shadow-sm">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Nueva Cita'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Paciente *</label>
              <select required value={form.patientUserId} onChange={e => setForm({...form, patientUserId: e.target.value})}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900">
                <option value="">Seleccionar paciente...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Modalidad</label>
              <select value={form.mode} onChange={e => setForm({...form, mode: e.target.value})}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900">
                <option value="PRESENTIAL">Presencial</option>
                <option value="VIDEO">Videollamada</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha *</label>
              <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hora *</label>
              <input type="time" required value={form.time} onChange={e => setForm({...form, time: e.target.value})}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900" />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm disabled:opacity-50">
            <Plus className="w-4 h-4" /> {saving ? 'Creando...' : 'Crear Cita'}
          </button>
        </form>
      )}

      {/* Upcoming */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Próximas Citas</h2>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No hay citas programadas.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map(apt => (
              <div key={apt.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-50 p-2.5 rounded-xl shrink-0">
                    <Calendar className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{apt.patient.name}</p>
                    <p className="text-sm text-slate-500 capitalize mt-0.5">{formatDate(apt.date)}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="flex items-center gap-1 text-slate-600 text-xs">
                        <Clock className="w-3.5 h-3.5" /> {formatTime(apt.date)}
                      </span>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${apt.mode === 'VIDEO' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {apt.mode === 'VIDEO' ? <><Video className="w-3 h-3" /> Video</> : <><MapPin className="w-3 h-3" /> Presencial</>}
                      </span>
                      {apt.status === 'SCHEDULED' && (
                        <>
                          <button onClick={() => handleComplete(apt.id)} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors">Completar</button>
                          <button onClick={() => handleCancel(apt.id)} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors">Cancelar</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Citas Pasadas</h2>
          <div className="space-y-3 opacity-75">
            {past.map(apt => (
              <div key={apt.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
                <div className="bg-slate-100 p-3 rounded-xl"><Calendar className="w-6 h-6 text-slate-400" /></div>
                <div className="flex-1">
                  <p className="font-medium text-slate-700">{apt.patient.name}</p>
                  <p className="text-sm text-slate-400 capitalize">{formatDate(apt.date)}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {apt.status === 'COMPLETED' ? 'Completada' : apt.status === 'CANCELLED' ? 'Cancelada' : 'Programada'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
