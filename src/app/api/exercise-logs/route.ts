import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { parseBody } from '@/lib/validation';

const toggleSchema = z.object({
  planExerciseId: z.string().min(1, 'ID requerido'),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'PATIENT') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const parsed = await parseBody(req, toggleSchema);
    if (!parsed.success) return parsed.response;
    const { planExerciseId } = parsed.data;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await prisma.exerciseLog.findFirst({
      where: {
        planExerciseId,
        date: { gte: today, lt: tomorrow },
      },
    });

    if (existing) {
      await prisma.exerciseLog.delete({ where: { id: existing.id } });
      return NextResponse.json({ completed: false });
    }

    const log = await prisma.exerciseLog.create({
      data: { planExerciseId, completed: true },
    });

    const planExercise = await prisma.planExercise.findUnique({
      where: { id: planExerciseId },
      include: {
        plan: {
          include: {
            exercises: {
              include: {
                completedLogs: {
                  where: { date: { gte: today, lt: tomorrow } },
                },
              },
            },
          },
        },
      },
    });

    if (planExercise) {
      const totalEx = planExercise.plan.exercises.length;
      const completedEx = planExercise.plan.exercises.filter(e => e.completedLogs.length > 0).length;
      const percentage = totalEx > 0 ? Math.round((completedEx / totalEx) * 100) : 0;

      try {
        await prisma.progressLog.upsert({
          where: {
            id: `progress-${planExercise.plan.patientId}-${today.toISOString().split('T')[0]}`,
          },
          update: { percentage },
          create: {
            patientId: planExercise.plan.patientId,
            percentage,
            date: new Date(),
          },
        });
      } catch (upsertError) {
        console.error('[api/exercise-logs] error en upsert de progressLog:', upsertError);
      }
    }

    return NextResponse.json({ completed: true, log });
  } catch (error) {
    console.error('[api/exercise-logs POST] error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
