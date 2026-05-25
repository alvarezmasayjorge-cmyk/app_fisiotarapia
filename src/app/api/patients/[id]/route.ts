import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { patientUpdateSchema, parseBody } from '@/lib/validation';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const profile = await prisma.patientProfile.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!profile) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    const parsed = await parseBody(req, patientUpdateSchema);
    if (!parsed.success) return parsed.response;
    const { name, password, phone, diagnosis, notes, isActive } = parsed.data;

    const userData: { name?: string; password?: string; phone?: string | null } = {};
    if (name !== undefined) userData.name = name;
    if (password) userData.password = await bcrypt.hash(password, 10);
    if (phone !== undefined) userData.phone = phone || null;

    const profileData: { diagnosis?: string; notes?: string | null; isActive?: boolean } = {};
    if (diagnosis !== undefined) profileData.diagnosis = diagnosis;
    if (notes !== undefined) profileData.notes = notes || null;
    if (isActive !== undefined) profileData.isActive = isActive;

    await prisma.$transaction([
      ...(Object.keys(userData).length > 0
        ? [prisma.user.update({ where: { id: profile.userId }, data: userData })]
        : []),
      ...(Object.keys(profileData).length > 0
        ? [prisma.patientProfile.update({ where: { id }, data: profileData })]
        : []),
    ]);

    const updated = await prisma.patientProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[api/patients/[id] PATCH] error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const profile = await prisma.patientProfile.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!profile) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    // Appointments y Messages no tienen onDelete:Cascade en el schema,
    // los borramos manualmente antes para evitar FK constraint errors.
    await prisma.$transaction([
      prisma.appointment.deleteMany({
        where: { OR: [{ patientId: profile.userId }, { physioId: profile.userId }] },
      }),
      prisma.message.deleteMany({
        where: { OR: [{ senderId: profile.userId }, { receiverId: profile.userId }] },
      }),
      prisma.user.delete({ where: { id: profile.userId } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/patients/[id] DELETE] error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
