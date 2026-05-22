import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'PATIENT') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();
  const { painLevel, patientNotes } = body;

  const today = new Date().toISOString().split('T')[0];

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
  }

  // Check if we already updated streak today to prevent double counting
  const logId = `progress-${profile.id}-${today}`;
  const existingLog = await prisma.progressLog.findUnique({ where: { id: logId } });

  if (!existingLog || existingLog.painLevel !== null) {
    return NextResponse.json({ error: 'Log no encontrado o ya actualizado' }, { status: 400 });
  }

  const updatedLog = await prisma.progressLog.update({
    where: { id: logId },
    data: {
      painLevel,
      patientNotes: patientNotes || null,
    },
  });

  // Calculate Streak
  // We assume if they are submitting pain feedback, they reached 100% today.
  let newStreak = profile.currentStreak + 1;
  let newLongest = Math.max(profile.longestStreak, newStreak);

  await prisma.patientProfile.update({
    where: { id: profile.id },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
    },
  });

  return NextResponse.json({ log: updatedLog, newStreak });
}
