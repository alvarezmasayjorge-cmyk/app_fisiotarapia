import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dailyCheckInSchema, parseBody } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'PATIENT') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });

    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const todayEnd = new Date(new Date().setHours(24, 0, 0, 0));
    const existing = await prisma.dailyCheckIn.findFirst({
      where: { patientId: profile.id, date: { gte: todayStart, lt: todayEnd } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Ya registraste tu check-in de hoy' }, { status: 409 });
    }

    const parsed = await parseBody(req, dailyCheckInSchema);
    if (!parsed.success) return parsed.response;
    const { improvement, painLevel, notes } = parsed.data;

    const checkIn = await prisma.dailyCheckIn.create({
      data: {
        patientId: profile.id,
        improvement,
        painLevel: painLevel ?? null,
        notes: notes ?? null,
      },
    });

    return NextResponse.json(checkIn, { status: 201 });
  } catch (error) {
    console.error('[api/daily-checkin POST] error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
