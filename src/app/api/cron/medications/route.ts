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
  if (!process.env.CRON_SECRET) {
    console.error('[cron] CRON_SECRET no está configurado en el entorno');
    return NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 500 });
  }
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('[cron] 401 - header authorization no coincide con CRON_SECRET');
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const now = new Date();
  const expiredEndpoints: string[] = [];

  let medsNotified = 0;
  let medsMatched = 0;
  let medsSkippedDedup = 0;
  let appointmentsNotified = 0;
  let exercisesNotified = 0;
  let errors = 0;

  console.log(`[cron] start now=${now.toISOString()} hourUTC=${now.getUTCHours()}`);

  try {
    // ============ 1. MEDICAMENTOS ============
    const windowEnd = new Date(now.getTime() + 60 * 60 * 1000);
    let meds: Awaited<ReturnType<typeof prisma.medication.findMany<{ include: { patient: { include: { user: { include: { pushSubscriptions: true } } } } } }>>> = [];
    try {
      meds = await prisma.medication.findMany({
        where: {
          isActive: true,
          startAt: { lte: windowEnd },
          OR: [{ endAt: null }, { endAt: { gt: now } }],
        },
        include: {
          patient: { include: { user: { include: { pushSubscriptions: true } } } },
        },
      });
    } catch (err) {
      console.error('[cron] error obteniendo medicamentos:', err);
      errors++;
    }

    for (const med of meds) {
      try {
        medsMatched++;
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
          if (existing) {
            medsSkippedDedup++;
            continue;
          }

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
      } catch (err) {
        console.error(`[cron] error procesando medicamento id=${med.id}:`, err);
        errors++;
      }
    }

    // ============ 2. CITAS (24h antes y 2h antes) ============
    try {
      const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);
      const in1h = new Date(now.getTime() + 1 * 60 * 60 * 1000);
      const in3h = new Date(now.getTime() + 3 * 60 * 60 * 1000);

      const apts24h = await prisma.appointment.findMany({
        where: {
          status: 'SCHEDULED',
          reminded24h: false,
          date: { gte: in23h, lte: in25h },
        },
        include: { patient: { include: { pushSubscriptions: true } } },
      });
      for (const apt of apts24h) {
        try {
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
        } catch (err) {
          console.error(`[cron] error procesando cita 24h id=${apt.id}:`, err);
          errors++;
        }
      }

      const apts2h = await prisma.appointment.findMany({
        where: {
          status: 'SCHEDULED',
          reminded2h: false,
          date: { gte: in1h, lte: in3h },
        },
        include: { patient: { include: { pushSubscriptions: true } } },
      });
      for (const apt of apts2h) {
        try {
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
        } catch (err) {
          console.error(`[cron] error procesando cita 2h id=${apt.id}:`, err);
          errors++;
        }
      }
    } catch (err) {
      console.error('[cron] error en bloque de citas:', err);
      errors++;
    }

    // ============ 3. EJERCICIOS (1x/día a las 9am Lima) ============
    if (now.getUTCHours() === EXERCISE_REMINDER_HOUR_UTC) {
      try {
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
          try {
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
          } catch (err) {
            console.error(`[cron] error enviando recordatorio ejercicio profileId=${profile.id}:`, err);
            errors++;
          }
        }
      } catch (err) {
        console.error('[cron] error en bloque de ejercicios:', err);
        errors++;
      }
    }

    // Limpiar subs expiradas
    if (expiredEndpoints.length > 0) {
      try {
        await prisma.pushSubscription.deleteMany({
          where: { endpoint: { in: expiredEndpoints } },
        });
      } catch (err) {
        console.error('[cron] error limpiando subs expiradas:', err);
      }
    }

    console.log(
      `[cron] meds matched=${medsMatched} skippedDedup=${medsSkippedDedup} notified=${medsNotified} | ` +
      `appts notified=${appointmentsNotified} | exercises notified=${exercisesNotified} ` +
      `(exerciseWindow=${now.getUTCHours() === EXERCISE_REMINDER_HOUR_UTC}) | ` +
      `expiredSubsCleaned=${expiredEndpoints.length} | errors=${errors}`
    );

    return NextResponse.json({
      ok: true,
      medsMatched,
      medsSkippedDedup,
      medsNotified,
      appointmentsNotified,
      exercisesNotified,
      expiredSubsCleaned: expiredEndpoints.length,
      errors,
    });
  } catch (err) {
    console.error('[cron] error fatal no controlado:', err);
    return NextResponse.json({ ok: false, error: 'Error interno del cron' }, { status: 500 });
  }
}

async function sendToSubs(
  subs: { endpoint: string; p256dh: string; auth: string }[],
  payload: PushPayload,
  expiredEndpoints: string[],
): Promise<number> {
  let sent = 0;
  for (const sub of subs) {
    try {
      const result = await sendPushNotification(sub, payload);
      if (result.success) sent++;
      else if (result.expired) expiredEndpoints.push(sub.endpoint);
    } catch (err) {
      console.error('[cron/sendToSubs] error enviando push:', err);
    }
  }
  return sent;
}
