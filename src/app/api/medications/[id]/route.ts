import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { medicationUpdateSchema, parseBody } from '@/lib/validation';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await params;

  const parsed = await parseBody(req, medicationUpdateSchema);
  if (!parsed.success) return parsed.response;

  const data: Record<string, unknown> = {};
  for (const k of ['name', 'dose', 'frequencyHours', 'isActive', 'notes'] as const) {
    if (parsed.data[k] !== undefined) data[k] = parsed.data[k];
  }
  if (parsed.data.startAt) data.startAt = new Date(parsed.data.startAt);
  if (parsed.data.endAt !== undefined) {
    data.endAt = parsed.data.endAt ? new Date(parsed.data.endAt) : null;
  }

  const med = await prisma.medication.update({ where: { id }, data });
  return NextResponse.json(med);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await params;
  await prisma.medication.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
