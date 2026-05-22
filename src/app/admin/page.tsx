import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Users, AlertCircle, Calendar } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') return null;

  // Obtener estadísticas
  const patientCount = await prisma.patientProfile.count({
    where: { isActive: true }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointmentsToday = await prisma.appointment.count({
    where: {
      physioId: session.user.id,
      date: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  const allPatients = await prisma.patientProfile.findMany({
    include: {
      user: true,
      progressLogs: {
        orderBy: { date: 'desc' },
        take: 3
      }
    }
  });

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Hola, {session.user.name}</h1>
        <p className="text-slate-500 mt-1">Resumen de tu clínica al día de hoy.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Pacientes Activos</p>
            <p className="text-2xl font-bold text-slate-900">{patientCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-lg text-green-600">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Citas de Hoy</p>
            <p className="text-2xl font-bold text-slate-900">{appointmentsToday}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-amber-50 p-3 rounded-lg text-amber-600">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Alertas de Inactividad</p>
            <p className="text-2xl font-bold text-slate-900">{inactivePatients.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-red-50 p-3 rounded-lg text-red-600">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Alertas Clínicas (Dolor)</p>
            <p className="text-2xl font-bold text-slate-900">{highPainPatients.length}</p>
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
                <Link href={`/admin/patients/${p.id}`} className="text-teal-600 text-sm font-medium hover:underline">
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
