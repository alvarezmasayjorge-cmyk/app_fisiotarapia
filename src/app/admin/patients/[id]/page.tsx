import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ArrowLeft, Activity, AlertTriangle, Apple, Calendar } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProgressChart from './LazyProgressChart';
import ChatClient from '@/components/ChatClient';
import ReminderButton from './ReminderButton';
import AISummaryButton from './AISummaryButton';

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return null;

  const { id } = await params;

  // Primero obtenemos el profile para conocer su userId, luego las citas en paralelo
  const profile = await prisma.patientProfile.findUnique({
    where: { id },
    include: {
      user: true,
      treatmentPlans: {
        where: { isActive: true },
        include: {
          exercises: { include: { exercise: true } },
          restrictions: true,
          nutrition: true,
        },
      },
      progressLogs: { orderBy: { date: 'desc' }, take: 14 },
    },
  });

  if (!profile) return notFound();

  const plan = profile.treatmentPlans[0];

  const appointments = await prisma.appointment.findMany({
    where: { patientId: profile.userId },
    orderBy: { date: 'desc' },
    take: 5,
  });

  const chartData = profile.progressLogs.map(log => ({
    date: log.date.toISOString(),
    cumplimiento: log.percentage,
    dolor: log.painLevel
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <Link href="/admin/patients" className="p-2 hover:bg-slate-100 rounded-lg transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{profile.user.name}</h1>
            <p className="text-slate-500 text-xs sm:text-sm truncate">{profile.user.email}</p>
            <p className="text-slate-600 text-xs sm:text-sm mt-0.5 line-clamp-2">{profile.diagnosis}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReminderButton patientUserId={profile.userId} patientName={profile.user.name} />
          <Link
            href={`/admin/patients/${id}/plan`}
            className="inline-flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm shadow-sm"
          >
            {plan ? 'Editar Plan' : 'Crear Plan'}
          </Link>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-2">Información</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Diagnóstico</dt>
              <dd className="text-slate-900 font-medium text-right max-w-[60%]">{profile.diagnosis}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Inicio</dt>
              <dd className="text-slate-900">{new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(new Date(profile.startDate))}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Estado</dt>
              <dd><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${profile.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>{profile.isActive ? 'Activo' : 'Inactivo'}</span></dd>
            </div>
            {profile.notes && (
              <div className="pt-2 border-t border-slate-100">
                <dt className="text-slate-500 mb-1">Notas</dt>
                <dd className="text-slate-700">{profile.notes}</dd>
              </div>
            )}
            <div className="pt-2 border-t border-slate-100 flex justify-between">
              <dt className="text-slate-500">Racha Actual</dt>
              <dd className="text-orange-600 font-bold">{profile.currentStreak} días 🔥</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Racha Máxima</dt>
              <dd className="text-slate-700 font-medium">{profile.longestStreak} días</dd>
            </div>
          </dl>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Evolución Clínica (Adherencia vs Dolor)</h3>
          {profile.progressLogs.length === 0 ? (
            <p className="text-sm text-slate-400">Sin registros de progreso aún.</p>
          ) : (
            <div className="pt-2">
              <ProgressChart data={chartData} />
            </div>
          )}
          
          <AISummaryButton patientId={profile.id} />
        </div>
      </div>

      {/* Treatment Plan */}
      {plan ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Exercises */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" /> Ejercicios ({plan.exercises.length})
            </h3>
            <div className="space-y-2">
              {plan.exercises.map(pe => (
                <div key={pe.id} className="text-sm p-2 bg-slate-50 rounded-lg">
                  <p className="font-medium text-slate-800">{pe.exercise.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {pe.exercise.sets && `${pe.exercise.sets} series`}
                    {pe.exercise.reps && ` x ${pe.exercise.reps} reps`}
                    {pe.exercise.duration && ` · ${pe.exercise.duration}`}
                  </p>
                </div>
              ))}
              {plan.exercises.length === 0 && <p className="text-sm text-slate-400">Sin ejercicios asignados</p>}
            </div>
          </div>

          {/* Restrictions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Restricciones ({plan.restrictions.length})
            </h3>
            <div className="space-y-2">
              {plan.restrictions.map(r => (
                <div key={r.id} className={`text-sm p-2 rounded-lg ${r.severity === 'CRITICAL' ? 'bg-red-50 text-red-800' : r.severity === 'IMPORTANT' ? 'bg-orange-50 text-orange-800' : 'bg-amber-50 text-amber-800'}`}>
                  <p className="font-medium">{r.description}</p>
                  <p className="text-xs opacity-70 mt-0.5">{r.severity}</p>
                </div>
              ))}
              {plan.restrictions.length === 0 && <p className="text-sm text-slate-400">Sin restricciones</p>}
            </div>
          </div>

          {/* Nutrition */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Apple className="w-4 h-4 text-green-600" /> Nutrición ({plan.nutrition.length})
            </h3>
            <div className="space-y-2">
              {plan.nutrition.map(n => (
                <div key={n.id} className="text-sm p-2 bg-green-50 rounded-lg">
                  <p className="font-medium text-green-900">{n.description}</p>
                  {n.dose && <p className="text-green-700 text-xs mt-0.5">Dosis: {n.dose}</p>}
                  {n.time && <p className="text-green-600 text-xs">Horario: {n.time}</p>}
                </div>
              ))}
              {plan.nutrition.length === 0 && <p className="text-sm text-slate-400">Sin indicaciones nutricionales</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-800 font-medium">Este paciente no tiene un plan de tratamiento activo.</p>
          <Link href={`/admin/patients/${id}/plan`} className="text-amber-500 font-medium text-sm hover:underline mt-2 inline-block">
            Crear plan ahora →
          </Link>
        </div>
      )}

      {/* Appointments */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" /> Últimas Citas
        </h3>
        {appointments.length === 0 ? (
          <p className="text-sm text-slate-400">Sin citas registradas.</p>
        ) : (
          <div className="space-y-2">
            {appointments.map(apt => (
              <div key={apt.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-700">{new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(apt.date))}</span>
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${apt.mode === 'VIDEO' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {apt.mode === 'VIDEO' ? 'Video' : 'Presencial'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${apt.status === 'SCHEDULED' ? 'bg-amber-100 text-amber-700' : apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {apt.status === 'SCHEDULED' ? 'Programada' : apt.status === 'COMPLETED' ? 'Completada' : 'Cancelada'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat */}
      <div className="pt-4">
        <h3 className="font-semibold text-slate-900 mb-3">Mensajes con el Paciente</h3>
        <ChatClient 
          currentUserId={session.user.id} 
          otherUserId={profile.userId} 
          otherUserName={profile.user.name} 
        />
      </div>
    </div>
  );
}
