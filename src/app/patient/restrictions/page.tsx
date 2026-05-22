import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AlertTriangle, ShieldAlert, AlertCircle } from 'lucide-react';

export default async function RestrictionsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'PATIENT') return null;

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      treatmentPlans: {
        where: { isActive: true },
        include: {
          restrictions: true,
        },
      },
    },
  });

  const restrictions = profile?.treatmentPlans.flatMap(p => p.restrictions) ?? [];

  const critical = restrictions.filter(r => r.severity === 'CRITICAL');
  const important = restrictions.filter(r => r.severity === 'IMPORTANT');
  const warnings = restrictions.filter(r => r.severity === 'WARNING');

  function SeverityIcon({ severity }: { severity: string }) {
    if (severity === 'CRITICAL') return <ShieldAlert className="w-5 h-5 text-red-500" />;
    if (severity === 'IMPORTANT') return <AlertCircle className="w-5 h-5 text-orange-500" />;
    return <AlertTriangle className="w-5 h-5 text-amber-500" />;
  }

  function severityStyles(severity: string) {
    if (severity === 'CRITICAL') return 'bg-red-50 border-red-200 text-red-800';
    if (severity === 'IMPORTANT') return 'bg-orange-50 border-orange-200 text-orange-800';
    return 'bg-amber-50 border-amber-200 text-amber-800';
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Restricciones</h1>
        <p className="text-sm text-slate-500 mt-1">Actividades que debes evitar durante tu recuperación</p>
      </div>

      {restrictions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No tienes restricciones asignadas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {critical.map(r => (
            <div key={r.id} className={`p-4 rounded-2xl border flex items-start gap-3 ${severityStyles('CRITICAL')}`}>
              <SeverityIcon severity="CRITICAL" />
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider">Crítico</span>
                <p className="font-medium mt-0.5">{r.description}</p>
              </div>
            </div>
          ))}
          {important.map(r => (
            <div key={r.id} className={`p-4 rounded-2xl border flex items-start gap-3 ${severityStyles('IMPORTANT')}`}>
              <SeverityIcon severity="IMPORTANT" />
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider">Importante</span>
                <p className="font-medium mt-0.5">{r.description}</p>
              </div>
            </div>
          ))}
          {warnings.map(r => (
            <div key={r.id} className={`p-4 rounded-2xl border flex items-start gap-3 ${severityStyles('WARNING')}`}>
              <SeverityIcon severity="WARNING" />
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider">Precaución</span>
                <p className="font-medium mt-0.5">{r.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
