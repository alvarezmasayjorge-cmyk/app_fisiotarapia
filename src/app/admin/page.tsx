import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Users, AlertCircle, Calendar } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Las 3 queries corren en paralelo, no secuencial (corta latencia ~3x)
  const [patientCount, appointmentsToday, allPatients] = await Promise.all([
    prisma.patientProfile.count({ where: { isActive: true } }).catch(() => 0),
    prisma.appointment.count({
      where: {
        physioId: session.user.id,
        date: { gte: today, lt: tomorrow },
      },
    }).catch(() => 0),
    prisma.patientProfile.findMany({
      include: {
        user: true,
        progressLogs: { orderBy: { date: 'desc' }, take: 3 },
      },
    }).catch(() => []),
  ]);

  // Alerta si el paciente no ha registrado en más de 3 días
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const inactivePatients = allPatients.filter(p => {
    if (p.progressLogs.length === 0) return true;
    return new Date(p.progressLogs[0].date) < threeDaysAgo;
  });

  const highPainPatients = allPatients.filter(p => {
    if (p.progressLogs.length === 0) return false;
    // Check if any log in the last 3 days had pain >= 7
    return p.progressLogs.some(log => log.painLevel && log.painLevel >= 7 && new Date(log.date) > threeDaysAgo);
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Hola, {session.user.name}</h1>
        <p className="text-sm text-slate-500 mt-1">Resumen de tu clínica al día de hoy.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
          <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600 shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 truncate">Pacientes Activos</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">{patientCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
          <div className="bg-green-50 p-2.5 rounded-lg text-green-600 shrink-0">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 truncate">Citas de Hoy</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">{appointmentsToday}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
          <div className="bg-amber-50 p-2.5 rounded-lg text-amber-600 shrink-0">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 truncate">Sin reportes 3+ días</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">{inactivePatients.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
          <div className="bg-red-50 p-2.5 rounded-lg text-red-600 shrink-0">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 truncate">Dolor Alto</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">{highPainPatients.length}</p>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {highPainPatients.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
          <h2 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Pacientes con Dolor Agudo (Nivel 7 o mayor)
          </h2>
          <div className="space-y-3">
            {highPainPatients.map(p => {
              const latestLog = p.progressLogs.find(l => l.painLevel && l.painLevel >= 7);
              return (
                <div key={p.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <p className="font-medium text-red-900">{p.user.name}</p>
                    <p className="text-sm text-red-700">Reportó dolor {latestLog?.painLevel}/10 recientemente.</p>
                  </div>
                  <Link href={`/admin/patients/${p.id}`} className="text-red-700 text-sm font-bold hover:underline">
                    Revisar caso
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {inactivePatients.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Pacientes con más de 3 días sin actividad
          </h2>
          <div className="space-y-3">
            {inactivePatients.map(p => (
              <div key={p.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border border-slate-100 transition-colors">
                <div>
                  <p className="font-medium text-slate-900">{p.user.name}</p>
                  <p className="text-sm text-slate-500">{p.diagnosis}</p>
                </div>
                <Link href={`/admin/patients/${p.id}`} className="text-amber-500 text-sm font-medium hover:underline">
                  Ver perfil
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
