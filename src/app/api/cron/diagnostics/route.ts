import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Endpoint de auto-diagnóstico para el sistema de notificaciones push.
// Lee el estado actual sin enviar nada. Requiere sesión.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const env = {
    cronSecretConfigured: !!process.env.CRON_SECRET,
    vapidPublicConfigured: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    vapidPrivateConfigured: !!process.env.VAPID_PRIVATE_KEY,
    vapidEmailConfigured: !!process.env.VAPID_EMAIL,
  };

  const pushSubscriptions = await prisma.pushSubscription.count({
    where: { userId: session.user.id },
  });

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, lastExerciseReminder: true },
  });

  let activeMedications = 0;
  let upcomingDoses: Array<{
    medication: string;
    dose: string;
    frequencyHours: number;
    nextDoseAt: string | null;
  }> = [];
  let lastDoseLog: { scheduledAt: string; notifiedAt: string | null } | null = null;
  let upcomingAppointments24h = 0;

  if (profile) {
    const meds = await prisma.medication.findMany({
      where: {
        patientId: profile.id,
        isActive: true,
        OR: [{ endAt: null }, { endAt: { gt: now } }],
      },
    });
    activeMedications = meds.length;

    upcomingDoses = meds.map((med) => {
      const cursor = new Date(med.startAt);
      while (cursor < now) {
        cursor.setTime(cursor.getTime() + med.frequencyHours * 60 * 60 * 1000);
      }
      return {
        medication: med.name,
        dose: med.dose,
        frequencyHours: med.frequencyHours,
        nextDoseAt: cursor.toISOString(),
      };
    });

    const last = await prisma.medicationDoseLog.findFirst({
      where: { medication: { patientId: profile.id } },
      orderBy: { scheduledAt: 'desc' },
    });
    if (last) {
      lastDoseLog = {
        scheduledAt: last.scheduledAt.toISOString(),
        notifiedAt: last.notifiedAt?.toISOString() ?? null,
      };
    }

    upcomingAppointments24h = await prisma.appointment.count({
      where: {
        patientId: profile.id,
        status: 'SCHEDULED',
        date: { gte: now, lte: in25h },
      },
    });
  }

  return NextResponse.json({
    now: now.toISOString(),
    hourUTC: now.getUTCHours(),
    env,
    user: { id: session.user.id, role: session.user.role },
    pushSubscriptions,
    patientProfileId: profile?.id ?? null,
    activeMedications,
    upcomingDoses,
    lastDoseLog,
    upcomingAppointments24h,
    lastExerciseReminder: profile?.lastExerciseReminder?.toISOString() ?? null,
  });
}
