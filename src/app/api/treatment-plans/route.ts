import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();
  const { patientProfileId, exerciseIds, restrictions, nutrition } = body;

  if (!patientProfileId) {
    return NextResponse.json({ error: 'ID del paciente requerido' }, { status: 400 });
  }

  // Deactivate existing active plans for this patient
  await prisma.treatmentPlan.updateMany({
    where: { patientId: patientProfileId, isActive: true },
    data: { isActive: false },
  });

  const plan = await prisma.treatmentPlan.create({
    data: {
      patientId: patientProfileId,
      physioId: session.user.id,
      exercises: {
        create: (exerciseIds || []).map((exId: string) => ({
          exerciseId: exId,
        })),
      },
      restrictions: {
        create: (restrictions || []).map((r: { description: string; severity: string }) => ({
          description: r.description,
          severity: r.severity || 'WARNING',
        })),
      },
      nutrition: {
        create: (nutrition || []).map((n: { type: string; description: string; dose?: string; time?: string }) => ({
          type: n.type,
          description: n.description,
          dose: n.dose || null,
          time: n.time || null,
        })),
      },
    },
    include: {
      exercises: { include: { exercise: true } },
      restrictions: true,
      nutrition: true,
    },
  });

  return NextResponse.json(plan, { status: 201 });
}
