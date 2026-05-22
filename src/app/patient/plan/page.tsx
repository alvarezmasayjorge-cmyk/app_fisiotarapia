import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AlertCircle, Apple, FileText, Stethoscope } from 'lucide-react';

export default async function PatientPlanPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'PATIENT') return null;

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      treatmentPlans: {
        where: { isActive: true },
        include: {
          restrictions: true,
          nutrition: true,
          physio: true
        }
      }
    }
  });

  if (!profile || profile.treatmentPlans.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-700">Sin plan activo</h2>
        <p className="text-slate-500 mt-2">Tu fisioterapeuta aún no ha asignado un plan de tratamiento.</p>
      </div>
    );
  }

  const plan = profile.treatmentPlans[0];

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 px-1">Mi Plan Médico</h1>
        <p className="text-slate-500 text-sm mt-1 px-1">Instrucciones y pautas de tu fisioterapeuta.</p>
      </div>

      {/* Diagnóstico y Educación */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-amber-500" /> Diagnóstico
        </h2>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="font-medium text-slate-900">{profile.diagnosis}</p>
        </div>

        {profile.notes && (
          <div className="mt-4">
            <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" /> Notas y Educación Médica
            </h3>
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {profile.notes}
            </div>
          </div>
        )}
      </div>

      {/* Restricciones */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" /> Restricciones de Movilidad
        </h2>
        {plan.restrictions.length === 0 ? (
          <p className="text-sm text-slate-500">No tienes restricciones específicas. Muévete con cuidado respetando la regla del no-dolor.</p>
        ) : (
          <div className="space-y-3">
            {plan.restrictions.map(r => (
              <div key={r.id} className={`p-3 rounded-xl border flex gap-3 ${
                r.severity === 'CRITICAL' ? 'bg-red-50 border-red-100 text-red-900' :
                r.severity === 'IMPORTANT' ? 'bg-orange-50 border-orange-100 text-orange-900' :
                'bg-amber-50 border-amber-100 text-amber-900'
              }`}>
                <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
                  r.severity === 'CRITICAL' ? 'text-red-500' :
                  r.severity === 'IMPORTANT' ? 'text-orange-500' :
                  'text-amber-500'
                }`} />
                <div>
                  <p className="font-medium text-sm">{r.description}</p>
                  <span className="text-[10px] font-bold uppercase opacity-60 mt-1 block">{r.severity}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nutrición y Suplementos */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Apple className="w-5 h-5 text-green-600" /> Nutrición y Suplementos
        </h2>
        {plan.nutrition.length === 0 ? (
          <p className="text-sm text-slate-500">No hay indicaciones nutricionales específicas en este plan.</p>
        ) : (
          <div className="space-y-3">
            {plan.nutrition.map(n => (
              <div key={n.id} className="p-3 bg-green-50 rounded-xl border border-green-100 flex flex-col gap-1">
                <p className="font-medium text-green-900 text-sm">{n.description}</p>
                <div className="flex gap-3 text-xs text-green-700 mt-1 font-medium">
                  {n.dose && <span className="bg-green-100 px-2 py-1 rounded-md">Dosis: {n.dose}</span>}
                  {n.time && <span className="bg-green-100 px-2 py-1 rounded-md">Horario: {n.time}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
