import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PILLAR_LABELS, type Pillar } from '@/lib/validation';
import PatientPlanClient from './PatientPlanClient';

export default async function PatientPlanPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'PATIENT') return null;

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      treatmentPlans: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        include: {
          restrictions: true,
          nutrition: true,
        },
      },
    },
  });

  if (!profile || profile.treatmentPlans.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-700">Sin plan activo</h2>
        <p className="text-slate-500 mt-2">Tu fisioterapeuta aún no ha asignado un plan de tratamiento.</p>
      </div>
    );
  }

  // Quedarnos con un solo plan activo por pilar (el más reciente)
  const seen = new Set<string>();
  const plans = profile.treatmentPlans
    .filter(p => {
      if (seen.has(p.pillar)) return false;
      seen.add(p.pillar);
      return true;
    })
    .map(p => ({
      id: p.id,
      pillar: p.pillar as Pillar,
      pillarLabel: PILLAR_LABELS[p.pillar as Pillar] ?? p.pillar,
      diagnosis: p.diagnosis,
      treatmentText: p.treatmentText,
      restrictions: p.restrictions.map(r => ({
        id: r.id,
        description: r.description,
        severity: r.severity,
      })),
    }));

  return <PatientPlanClient plans={plans} profileNotes={profile.notes} />;
}
