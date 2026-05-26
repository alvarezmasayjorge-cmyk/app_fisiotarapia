import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ArrowLeft, Activity, AlertTriangle, Apple, Calendar, FileText, Stethoscope, Plus, Pencil, Phone, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProgressChart from './LazyProgressChart';
import ChatClient from '@/components/ChatClient';
import ReminderButton from './ReminderButton';
import AISummaryButton from './AISummaryButton';
import PatientActions from './PatientActions';
import MedicationsAdmin from './MedicationsAdmin';
import { PILLAR_LABELS, PILLAR_VALUES, type Pillar } from '@/lib/validation';

const PILLAR_STYLES: Record<Pillar, { bg: string; border: string; text: string; pill: string }> = {
  PELVIC_FLOOR: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', pill: 'bg-rose-100 text-rose-800' },
  PAIN: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', pill: 'bg-amber-100 text-amber-800' },
  AESTHETIC: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', pill: 'bg-violet-100 text-violet-800' },
};

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return null;

  const { id } = await params;

  let profile;
  try {
    profile = await prisma.patientProfile.findUnique({
      where: { id },
      include: {
        user: true,
        treatmentPlans: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          include: {
            exercises: { include: { exercise: true } },
            restrictions: true,
            nutrition: true,
          },
        },
        progressLogs: { orderBy: { date: 'desc' }, take: 14 },
      },
    });
  } catch (error) {
    console.error('[admin/patients/[id]] error cargando perfil:', error);
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 rounded-full p-4">
              <WifiOff className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error de conexión</h2>
          <p className="text-slate-500 text-sm">
            No se pudo cargar el paciente. Por favor recarga la página.
          </p>
        </div>
      </div>
    );
  }

  if (!profile) return notFound();

  // Indexar planes por pilar (último activo gana, por createdAt desc)
  const plansByPillar = new Map<Pillar, (typeof profile.treatmentPlans)[number]>();
  for (const p of profile.treatmentPlans) {
    const key = p.pillar as Pillar;
    if (!plansByPillar.has(key)) plansByPillar.set(key, p);
  }

  let appointments: Awaited<ReturnType<typeof prisma.appointment.findMany>> = [];
  let medications: Awaited<ReturnType<typeof prisma.medication.findMany>> = [];
  try {
    [appointments, medications] = await Promise.all([
      prisma.appointment.findMany({
        where: { patientId: profile.userId },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      prisma.medication.findMany({
        where: { patientId: profile.id },
        orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);
  } catch (error) {
    console.error('[admin/patients/[id]] error cargando citas/medicamentos:', error);
  }

  const chartData = profile.progressLogs.map(log => ({
    date: log.date.toISOString(),
    cumplimiento: log.percentage,
    dolor: log.painLevel,
  }));

  const hasAnyPlan = profile.treatmentPlans.length > 0;

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
            <p className="text-slate-600 text-xs sm:text-sm mt-0.5 line-clamp-2">
              {profile.treatmentPlans.length > 0
                ? profile.treatmentPlans[0]?.diagnosis
                : 'Pendiente de diagnóstico'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReminderButton patientUserId={profile.userId} patientName={profile.user.name} />
          <PatientActions
            profileId={profile.id}
            initial={{
              name: profile.user.name,
              email: profile.user.email,
              phone: profile.user.phone,
              notes: profile.notes,
              isActive: profile.isActive,
            }}
          />
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-2">Información</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Diagnóstico</dt>
              <dd className="text-slate-900 font-medium text-right max-w-[60%]">
                {profile.treatmentPlans.length > 0
                  ? profile.treatmentPlans[0]?.diagnosis
                  : 'Pendiente de diagnóstico'}
              </dd>
            </div>
            {profile.user.phone && (
              <div className="flex justify-between items-center">
                <dt className="text-slate-500">WhatsApp</dt>
                <dd>
                  <a
                    href={`https://wa.me/${profile.user.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
                  >
                    <Phone className="w-3.5 h-3.5" /> {profile.user.phone}
                  </a>
                </dd>
              </div>
            )}
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
              <dd className="text-orange-600 font-bold">{profile.currentStreak} días</dd>
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

      {/* Pilares de tratamiento */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900">Pilares de tratamiento</h2>
          {!hasAnyPlan && (
            <span className="text-xs text-slate-500">Aún no hay planes asignados</span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PILLAR_VALUES.map(pillar => {
            const plan = plansByPillar.get(pillar);
            const styles = PILLAR_STYLES[pillar];
            return (
              <div key={pillar} className={`rounded-xl border ${styles.border} ${styles.bg} p-5 flex flex-col`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-bold ${styles.text}`}>{PILLAR_LABELS[pillar]}</h3>
                  <Link
                    href={`/admin/patients/${id}/plan?pillar=${pillar}`}
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${styles.pill} hover:opacity-90 transition-opacity`}
                  >
                    {plan ? (<><Pencil className="w-3 h-3" /> Editar</>) : (<><Plus className="w-3 h-3" /> Crear</>)}
                  </Link>
                </div>

                {plan ? (
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Stethoscope className="w-3 h-3" /> Diagnóstico
                      </p>
                      <p className="text-slate-800 mt-1 line-clamp-3 whitespace-pre-wrap">{plan.diagnosis || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Tratamiento
                      </p>
                      <p className="text-slate-800 mt-1 line-clamp-4 whitespace-pre-wrap">{plan.treatmentText || '—'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/60">
                      <span className="inline-flex items-center gap-1 text-[11px] bg-white/80 px-2 py-0.5 rounded-full text-slate-700">
                        <Activity className="w-3 h-3" /> {plan.exercises.length} ej.
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] bg-white/80 px-2 py-0.5 rounded-full text-slate-700">
                        <AlertTriangle className="w-3 h-3" /> {plan.restrictions.length} restr.
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] bg-white/80 px-2 py-0.5 rounded-full text-slate-700">
                        <Apple className="w-3 h-3" /> {plan.nutrition.length} nutr.
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">Sin plan activo en este pilar.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Medicamentos */}
      <MedicationsAdmin
        patientId={profile.id}
        initial={medications.map(m => ({
          id: m.id,
          name: m.name,
          dose: m.dose,
          frequencyHours: m.frequencyHours,
          startAt: m.startAt.toISOString(),
          endAt: m.endAt?.toISOString() ?? null,
          isActive: m.isActive,
          notes: m.notes,
        }))}
      />

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
