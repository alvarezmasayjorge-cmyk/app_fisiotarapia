import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { parseBody } from '@/lib/validation';

const createSchema = z.object({
  patientUserId: z.string().min(1, 'Paciente requerido'),
  date: z.string().min(1, 'Fecha requerida'),
  mode: z.enum(['PRESENTIAL', 'VIDEO']).default('PRESENTIAL'),
});

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const parsed = await parseBody(req, createSchema);
    if (!parsed.success) return parsed.response;

    const appointment = await prisma.appointment.create({
      data: {
        physioId: session.user.id,
        patientId: parsed.data.patientUserId,
        date: new Date(parsed.data.date),
        mode: parsed.data.mode,
        status: 'SCHEDULED',
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('[api/appointments POST] error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const parsed = await parseBody(req, updateSchema);
    if (!parsed.success) return parsed.response;

    const appointment = await prisma.appointment.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('[api/appointments PATCH] error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
