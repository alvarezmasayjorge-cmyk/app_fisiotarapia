import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
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

    const parsed = await parseBody(req, dailyCheckInSchema);
    if (!parsed.success) return parsed.response;
    const { improvement, painLevel, notes } = parsed.data;

    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

    try {
      const checkIn = await prisma.dailyCheckIn.create({
        data: {
          patientId: profile.id,
          date: todayStart,
          improvement,
          painLevel: painLevel ?? null,
          notes: notes ?? null,
        },
      });
      return NextResponse.json(checkIn, { status: 201 });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        return NextResponse.json({ error: 'Ya registraste tu check-in de hoy' }, { status: 409 });
      }
      throw e;
    }
  } catch (error) {
    console.error('[api/daily-checkin POST] error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
