import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import MedicationsClient from './MedicationsClient';

export default async function PatientMedicationsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'PATIENT') return null;

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Sin perfil activo.</p>
      </div>
    );
  }

  const medications = await prisma.medication.findMany({
    where: { patientId: profile.id, isActive: true },
    orderBy: { startAt: 'asc' },
    include: {
      doses: {
        where: {
          scheduledAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
      },
    },
  });

  const now = new Date();

  const medsData = medications.map(med => {
    // Calcular próxima dosis
    const cursor = new Date(med.startAt);
    while (cursor < now) {
      cursor.setTime(cursor.getTime() + med.frequencyHours * 60 * 60 * 1000);
    }
    const nextDose = cursor;

    // Última dosis tomada
    const lastTaken = med.doses.filter(d => d.takenAt).at(-1);

    return {
      id: med.id,
      name: med.name,
      dose: med.dose,
      frequencyHours: med.frequencyHours,
      notes: med.notes,
      nextDoseAt: nextDose.toISOString(),
      lastTakenAt: lastTaken?.takenAt?.toISOString() ?? null,
      doses: med.doses.map(d => ({
        id: d.id,
        scheduledAt: d.scheduledAt.toISOString(),
        takenAt: d.takenAt?.toISOString() ?? null,
      })),
    };
  });

  return <MedicationsClient medications={medsData} />;
}
