import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPushNotification } from '@/lib/webpush';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization');
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 60 * 60 * 1000); // próxima 1 hora

  // Medicamentos activos que no han terminado
  const meds = await prisma.medication.findMany({
    where: {
      isActive: true,
      startAt: { lte: windowEnd },
      OR: [{ endAt: null }, { endAt: { gt: now } }],
    },
    include: {
      patient: {
        include: {
          user: {
            include: { pushSubscriptions: true },
          },
        },
      },
    },
  });

  let notified = 0;
  const expiredEndpoints: string[] = [];

  for (const med of meds) {
    // Calcular todas las dosis programadas desde startAt hasta windowEnd
    const doses: Date[] = [];
    const cursor = new Date(med.startAt);
    while (cursor <= windowEnd) {
      if (cursor >= now) doses.push(new Date(cursor));
      cursor.setTime(cursor.getTime() + med.frequencyHours * 60 * 60 * 1000);
    }

    for (const scheduledAt of doses) {
      // Verificar que no existe ya un log para esta dosis (±30 min)
      const margin = 30 * 60 * 1000;
      const existing = await prisma.medicationDoseLog.findFirst({
        where: {
          medicationId: med.id,
          scheduledAt: {
            gte: new Date(scheduledAt.getTime() - margin),
            lte: new Date(scheduledAt.getTime() + margin),
          },
        },
      });
      if (existing) continue;

      // Crear el log de dosis
      const doseLog = await prisma.medicationDoseLog.create({
        data: { medicationId: med.id, scheduledAt, notifiedAt: now },
      });

      // Enviar push al paciente
      const subs = med.patient.user.pushSubscriptions;
      if (subs.length === 0) continue;

      const hour = scheduledAt.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Lima',
      });

      for (const sub of subs) {
        const result = await sendPushNotification(sub, {
          title: `💊 Recordatorio: ${med.name}`,
          body: `${med.dose} — programado para las ${hour}`,
          url: '/patient/medications',
          icon: '/logo.png',
        });
        if (result.success) notified++;
        else if (result.expired) expiredEndpoints.push(sub.endpoint);
      }

      // Actualizar notifiedAt en el log
      await prisma.medicationDoseLog.update({
        where: { id: doseLog.id },
        data: { notifiedAt: now },
      });
    }
  }

  // Limpiar subs expiradas
  if (expiredEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: expiredEndpoints } },
    });
  }

  return NextResponse.json({ ok: true, notified, meds: meds.length });
}
