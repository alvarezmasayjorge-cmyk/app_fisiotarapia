import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { medicationCreateSchema, parseBody } from '@/lib/validation';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const patientProfileId = searchParams.get('patientId');

  // Si es paciente, sólo puede ver los suyos
  if (session.user.role === 'PATIENT') {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!profile) return NextResponse.json([]);
    const meds = await prisma.medication.findMany({
      where: { patientId: profile.id, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        doses: {
          where: { scheduledAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          orderBy: { scheduledAt: 'asc' },
        },
      },
    });
    return NextResponse.json(meds);
  }

  // Admin: debe pasar patientId
  if (!patientProfileId) {
    return NextResponse.json({ error: 'patientId requerido' }, { status: 400 });
  }
  const meds = await prisma.medication.findMany({
    where: { patientId: patientProfileId },
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json(meds);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const parsed = await parseBody(req, medicationCreateSchema);
  if (!parsed.success) return parsed.response;
  const { patientId, name, dose, frequencyHours, startAt, endAt, notes } = parsed.data;

  const profile = await prisma.patientProfile.findUnique({ where: { id: patientId } });
  if (!profile) return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });

  const med = await prisma.medication.create({
    data: {
      patientId,
      name,
      dose,
      frequencyHours,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : null,
      notes: notes || null,
    },
  });

  return NextResponse.json(med, { status: 201 });
}
