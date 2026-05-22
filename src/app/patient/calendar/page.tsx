import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Calendar as CalendarIcon, Video, MapPin, Clock } from 'lucide-react';

export default async function PatientCalendarPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'PATIENT') return null;

  const upcomingAppointments = await prisma.appointment.findMany({
    where: { 
      patientId: session.user.id,
      date: { gte: new Date() }
    },
    orderBy: { date: 'asc' },
    include: { physio: true }
  });

  const pastAppointments = await prisma.appointment.findMany({
    where: { 
      patientId: session.user.id,
      date: { lt: new Date() }
    },
    orderBy: { date: 'desc' },
    take: 5,
    include: { physio: true }
  });

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 px-1">Mi Agenda</h1>
        <p className="text-slate-500 text-sm mt-1 px-1">Consulta tus próximas sesiones programadas.</p>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-600" /> Próximas Citas
        </h2>
        
        {upcomingAppointments.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <CalendarIcon className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium text-sm">No tienes citas programadas.</p>
            <p className="text-slate-400 text-xs mt-1">Tu fisioterapeuta te agendará tu próxima sesión pronto.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingAppointments.map(apt => (
              <div key={apt.id} className="p-4 rounded-xl border flex flex-col gap-3 bg-blue-50/50 border-blue-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-blue-900">Dr. {apt.physio.name}</h3>
                    <p className="text-blue-700 text-xs mt-0.5">Sesión de Fisioterapia</p>
                  </div>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase">
                    {apt.status === 'SCHEDULED' ? 'Programada' : apt.status}
                  </span>
                </div>
                
                <div className="flex flex-col gap-1.5 mt-1 border-t border-blue-100/50 pt-3">
                  <div className="flex items-center gap-2 text-sm text-blue-800 font-medium">
                    <Clock className="w-4 h-4 text-blue-500" />
                    {new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(apt.date))}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-800 font-medium">
                    {apt.mode === 'VIDEO' ? (
                      <><Video className="w-4 h-4 text-blue-500" /> Videollamada</>
                    ) : (
                      <><MapPin className="w-4 h-4 text-blue-500" /> Presencial (Clínica)</>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pastAppointments.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Historial Reciente</h2>
          <div className="space-y-2">
            {pastAppointments.map(apt => (
              <div key={apt.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-700 text-sm">
                    {new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(apt.date))}
                  </span>
                  <span className="text-slate-400 text-xs">{apt.mode === 'VIDEO' ? 'Videollamada' : 'Presencial'}</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  apt.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border border-green-100' :
                  apt.status === 'CANCELLED' ? 'bg-slate-50 text-slate-500 border border-slate-200 line-through' :
                  'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  {apt.status === 'COMPLETED' ? 'Completada' : apt.status === 'CANCELLED' ? 'Cancelada' : apt.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
