import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { parseBody } from '@/lib/validation';

const painUpdateSchema = z.object({
  painLevel: z.number().int().min(1).max(10),
  patientNotes: z.string().max(1000).nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'PATIENT') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const parsed = await parseBody(req, painUpdateSchema);
    if (!parsed.success) return parsed.response;
    const { painLevel, patientNotes } = parsed.data;

    const today = new Date().toISOString().split('T')[0];

    const profile = await prisma.patientProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
    }

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

    const newStreak = profile.currentStreak + 1;
    const newLongest = Math.max(profile.longestStreak, newStreak);

    await prisma.patientProfile.update({
      where: { id: profile.id },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongest,
      },
    });

    return NextResponse.json({ log: updatedLog, newStreak });
  } catch (error) {
    console.error('[api/progress-logs PATCH] error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
