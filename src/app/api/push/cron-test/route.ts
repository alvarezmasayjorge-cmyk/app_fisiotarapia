import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPushNotification } from '@/lib/webpush';

// Endpoint de prueba protegido con CRON_SECRET.
// Manda una notificación push de prueba a TODOS los suscritos.
// Útil para verificar que el sistema de push funciona end-to-end.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[cron-test] CRON_SECRET no configurado — abortando');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }
  const secret = req.headers.get('authorization');
  if (secret !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const subs = await prisma.pushSubscription.findMany();
  if (subs.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No hay suscripciones activas' });
  }

  let sent = 0;
  const expiredEndpoints: string[] = [];
  for (const sub of subs) {
    const result = await sendPushNotification(sub, {
      title: '🔔 Notificación de prueba',
      body: 'Si ves esto, el sistema de notificaciones funciona perfectamente.',
      url: '/patient',
      icon: '/logo.png',
    });
    if (result.success) sent++;
    else if (result.expired) expiredEndpoints.push(sub.endpoint);
  }

  if (expiredEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: expiredEndpoints } },
    });
  }

  return NextResponse.json({ sent, total: subs.length, expired: expiredEndpoints.length });
}
