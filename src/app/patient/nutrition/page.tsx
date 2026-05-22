import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Apple, Pill, Ban } from 'lucide-react';

export default async function NutritionPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'PATIENT') return null;

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      treatmentPlans: {
        where: { isActive: true },
        include: {
          nutrition: true,
        },
      },
    },
  });

  const items = profile?.treatmentPlans.flatMap(p => p.nutrition) ?? [];

  const supplements = items.filter(i => i.type === 'SUPPLEMENT');
  const recommended = items.filter(i => i.type === 'DIET_RECOMMENDED');
  const avoid = items.filter(i => i.type === 'DIET_AVOID');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Nutrición y Suplementos</h1>
        <p className="text-sm text-slate-500 mt-1">Indicaciones de dieta y suplementación</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
          <Apple className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No tienes indicaciones nutricionales asignadas.</p>
        </div>
      ) : (
        <>
          {/* Suplementos */}
          {supplements.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Pill className="w-4 h-4" /> Suplementos
              </h2>
              <div className="space-y-2">
                {supplements.map(s => (
                  <div key={s.id} className="bg-blue-50 border border-blue-200 p-4 rounded-2xl">
                    <p className="font-semibold text-blue-900">{s.description}</p>
                    {s.dose && <p className="text-sm text-blue-700 mt-1">Dosis: {s.dose}</p>}
                    {s.time && <p className="text-sm text-blue-600 mt-0.5">Horario: {s.time}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dieta recomendada */}
          {recommended.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Apple className="w-4 h-4" /> Dieta Recomendada
              </h2>
              <div className="space-y-2">
                {recommended.map(r => (
                  <div key={r.id} className="bg-green-50 border border-green-200 p-4 rounded-2xl">
                    <p className="font-medium text-green-900">{r.description}</p>
                    {r.time && <p className="text-sm text-green-700 mt-1">{r.time}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evitar */}
          {avoid.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Ban className="w-4 h-4" /> Evitar
              </h2>
              <div className="space-y-2">
                {avoid.map(a => (
                  <div key={a.id} className="bg-red-50 border border-red-200 p-4 rounded-2xl">
                    <p className="font-medium text-red-900">{a.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
