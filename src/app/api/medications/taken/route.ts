import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'PATIENT') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { doseId, medicationId } = await req.json();

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });

  if (doseId) {
    // Verificar que la dosis pertenece al paciente
    const dose = await prisma.medicationDoseLog.findUnique({
      where: { id: doseId },
      include: { medication: { select: { patientId: true } } },
    });
    if (!dose || dose.medication.patientId !== profile.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    const updated = await prisma.medicationDoseLog.update({
      where: { id: doseId },
      data: { takenAt: new Date() },
    });
    return NextResponse.json(updated);
  }

  if (medicationId) {
    // Verificar ownership y crear/actualizar log para la dosis más próxima
    const med = await prisma.medication.findUnique({
      where: { id: medicationId },
      select: { patientId: true },
    });
    if (!med || med.patientId !== profile.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    // Buscar dosis programada sin tomar más cercana al ahora (±2h de margen)
    const now = new Date();
    const window2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    let dose = await prisma.medicationDoseLog.findFirst({
      where: {
        medicationId,
        takenAt: null,
        scheduledAt: { lte: window2h },
      },
      orderBy: { scheduledAt: 'asc' },
    });
    // Si no hay log creado, crearlo ahora
    if (!dose) {
      dose = await prisma.medicationDoseLog.create({
        data: { medicationId, scheduledAt: now, takenAt: now },
      });
    } else {
      dose = await prisma.medicationDoseLog.update({
        where: { id: dose.id },
        data: { takenAt: now },
      });
    }
    return NextResponse.json(dose);
  }

  return NextResponse.json({ error: 'doseId o medicationId requerido' }, { status: 400 });
}
