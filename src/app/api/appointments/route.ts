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
  const { patientUserId, date, mode } = body;

  if (!patientUserId || !date) {
    return NextResponse.json({ error: 'Paciente y fecha requeridos' }, { status: 400 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      physioId: session.user.id,
      patientId: patientUserId,
      date: new Date(date),
      mode: mode || 'PRESENTIAL',
      status: 'SCHEDULED',
    },
  });

  return NextResponse.json(appointment, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();
  const { id, status } = body;

  if (!id || !status) {
    return NextResponse.json({ error: 'ID y estado requeridos' }, { status: 400 });
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(appointment);
}
