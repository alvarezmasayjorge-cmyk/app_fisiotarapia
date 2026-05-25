import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBody, treatmentPlanSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const parsed = await parseBody(req, treatmentPlanSchema);
    if (!parsed.success) return parsed.response;
    const { patientId, pillar, diagnosis, treatmentText, exerciseIds, restrictions, nutrition } = parsed.data;

    await prisma.treatmentPlan.updateMany({
      where: { patientId, pillar, isActive: true },
      data: { isActive: false },
    });

    const plan = await prisma.treatmentPlan.create({
      data: {
        patientId,
        physioId: session.user.id,
        pillar,
        diagnosis,
        treatmentText,
        exercises: {
          create: exerciseIds.map((exerciseId) => ({ exerciseId })),
        },
        restrictions: {
          create: restrictions.map((r) => ({
            description: r.description,
            severity: r.severity,
          })),
        },
        nutrition: {
          create: nutrition.map((n) => ({
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
  } catch (error) {
    console.error('[api/treatment-plans POST] error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
