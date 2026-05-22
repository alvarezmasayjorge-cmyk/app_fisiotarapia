import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendPushNotification, PushPayload } from '@/lib/webpush';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { userId, userIds, title, body, url } = await req.json();

  const payload: PushPayload = {
    title: title || 'Sentirse Única',
    body,
    url: url || '/patient',
    icon: '/logo.png',
  };

  // Enviar a uno o varios usuarios
  const targets: string[] = userId ? [userId] : (userIds || []);

  if (targets.length === 0) {
    return NextResponse.json({ error: 'Debes especificar destinatario(s)' }, { status: 400 });
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: targets } },
  });

  if (subscriptions.length === 0) {
    return NextResponse.json({ sent: 0, message: 'El paciente no tiene notificaciones activadas' });
  }

  let sent = 0;
  const expiredEndpoints: string[] = [];

  for (const sub of subscriptions) {
    const result = await sendPushNotification(sub, payload);
    if (result.success) {
      sent++;
    } else if (result.expired) {
      expiredEndpoints.push(sub.endpoint);
    }
  }

  // Limpiar suscripciones expiradas
  if (expiredEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: expiredEndpoints } },
    });
  }

  return NextResponse.json({ sent, total: subscriptions.length });
}
