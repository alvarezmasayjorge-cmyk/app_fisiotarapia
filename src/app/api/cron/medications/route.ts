import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPushNotification, PushPayload } from '@/lib/webpush';

// Cron principal: corre cada hora. Envía recordatorios de:
//   - Medicamentos (próxima dosis dentro de 1h)
//   - Citas: 24h antes + 2h antes
//   - Ejercicios: una vez al día a las 9am hora Lima (UTC-5 = 14:00 UTC)

const EXERCISE_REMINDER_HOUR_UTC = 14; // 9am Lima

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization');
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const now = new Date();
  const expiredEndpoints: string[] = [];

  let medsNotified = 0;
  let appointmentsNotified = 0;
  let exercisesNotified = 0;

  // ============ 1. MEDICAMENTOS ============
  const windowEnd = new Date(now.getTime() + 60 * 60 * 1000);
  const meds = await prisma.medication.findMany({
    where: {
      isActive: true,
      startAt: { lte: windowEnd },
      OR: [{ endAt: null }, { endAt: { gt: now } }],
    },
    include: {
      patient: { include: { user: { include: { pushSubscriptions: true } } } },
    },
  });

  for (const med of meds) {
    const doses: Date[] = [];
    const cursor = new Date(med.startAt);
    while (cursor <= windowEnd) {
      if (cursor >= now) doses.push(new Date(cursor));
      cursor.setTime(cursor.getTime() + med.frequencyHours * 60 * 60 * 1000);
    }

    for (const scheduledAt of doses) {
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

      const doseLog = await prisma.medicationDoseLog.create({
        data: { medicationId: med.id, scheduledAt, notifiedAt: now },
      });

      const subs = med.patient.user.pushSubscriptions;
      const hour = scheduledAt.toLocaleTimeString('es-ES', {
        hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima',
      });

      const sent = await sendToSubs(subs, {
        title: `💊 Recordatorio: ${med.name}`,
        body: `${med.dose} — programado para las ${hour}`,
        url: '/patient/medications',
        icon: '/logo.png',
      }, expiredEndpoints);
      medsNotified += sent;

      await prisma.medicationDoseLog.update({
        where: { id: doseLog.id },
        data: { notifiedAt: now },
      });
    }
  }

  // ============ 2. CITAS (24h antes y 2h antes) ============
  const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);
  const in1h = new Date(now.getTime() + 1 * 60 * 60 * 1000);
  const in3h = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  // 24h antes
  const apts24h = await prisma.appointment.findMany({
    where: {
      status: 'SCHEDULED',
      reminded24h: false,
      date: { gte: in23h, lte: in25h },
    },
    include: { patient: { include: { pushSubscriptions: true } } },
  });
  for (const apt of apts24h) {
    const subs = apt.patient.pushSubscriptions;
    const day = apt.date.toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Lima',
    });
    const hour = apt.date.toLocaleTimeString('es-ES', {
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima',
    });
    const sent = await sendToSubs(subs, {
      title: '📅 Cita mañana',
      body: `Tienes una cita ${apt.mode === 'VIDEO' ? 'por video' : 'presencial'} el ${day} a las ${hour}`,
      url: '/patient/calendar',
      icon: '/logo.png',
    }, expiredEndpoints);
    appointmentsNotified += sent;
    await prisma.appointment.update({ where: { id: apt.id }, data: { reminded24h: true } });
  }

  // 2h antes
  const apts2h = await prisma.appointment.findMany({
    where: {
      status: 'SCHEDULED',
      reminded2h: false,
      date: { gte: in1h, lte: in3h },
    },
    include: { patient: { include: { pushSubscriptions: true } } },
  });
  for (const apt of apts2h) {
    const subs = apt.patient.pushSubscriptions;
    const hour = apt.date.toLocaleTimeString('es-ES', {
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima',
    });
    const sent = await sendToSubs(subs, {
      title: '⏰ Cita en 2 horas',
      body: `Tu cita ${apt.mode === 'VIDEO' ? 'por video' : 'presencial'} es a las ${hour}`,
      url: '/patient/calendar',
      icon: '/logo.png',
    }, expiredEndpoints);
    appointmentsNotified += sent;
    await prisma.appointment.update({ where: { id: apt.id }, data: { reminded2h: true } });
  }

  // ============ 3. EJERCICIOS (1x/día a las 9am Lima) ============
  if (now.getUTCHours() === EXERCISE_REMINDER_HOUR_UTC) {
    const todayStart = new Date(new Date().setUTCHours(0, 0, 0, 0));

    const profiles = await prisma.patientProfile.findMany({
      where: {
        isActive: true,
        OR: [
          { lastExerciseReminder: null },
          { lastExerciseReminder: { lt: todayStart } },
        ],
        treatmentPlans: { some: { isActive: true, exercises: { some: {} } } },
      },
      include: {
        user: { include: { pushSubscriptions: true } },
      },
    });

    for (const profile of profiles) {
      const sent = await sendToSubs(profile.user.pushSubscriptions, {
        title: '🏃‍♀️ Hora de tus ejercicios',
        body: '¡Buenos días! Recuerda completar tu rutina del día.',
        url: '/patient',
        icon: '/logo.png',
      }, expiredEndpoints);
      exercisesNotified += sent;
      await prisma.patientProfile.update({
        where: { id: profile.id },
        data: { lastExerciseReminder: now },
      });
    }
  }

  // Limpiar subs expiradas
  if (expiredEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: expiredEndpoints } },
    });
  }

  return NextResponse.json({
    ok: true,
    medsNotified,
    appointmentsNotified,
    exercisesNotified,
  });
}

async function sendToSubs(
  subs: { endpoint: string; p256dh: string; auth: string }[],
  payload: PushPayload,
  expiredEndpoints: string[],
): Promise<number> {
  let sent = 0;
  for (const sub of subs) {
    const result = await sendPushNotification(sub, payload);
    if (result.success) sent++;
    else if (result.expired) expiredEndpoints.push(sub.endpoint);
  }
  return sent;
}
