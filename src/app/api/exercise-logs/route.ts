import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'PATIENT') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();
  const { planExerciseId } = body;

  if (!planExerciseId) {
    return NextResponse.json({ error: 'ID de ejercicio requerido' }, { status: 400 });
  }

  // Check if already completed today
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
    // Toggle off - delete the log
    await prisma.exerciseLog.delete({ where: { id: existing.id } });
    return NextResponse.json({ completed: false });
  }

  // Create completion log
  const log = await prisma.exerciseLog.create({
    data: { planExerciseId, completed: true },
  });

  // Update progress log for the patient
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
    const percentage = Math.round((completedEx / totalEx) * 100);

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
  }

  return NextResponse.json({ completed: true, log });
}
