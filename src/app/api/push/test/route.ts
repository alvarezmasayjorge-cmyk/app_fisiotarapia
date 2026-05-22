import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendPushNotification } from '@/lib/webpush';

// Envía una notificación de prueba al usuario autenticado.
// Útil para que cualquier paciente o admin verifique que su suscripción funciona.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  // Verificar config del servidor
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return NextResponse.json(
      { error: 'Configuración de notificaciones incompleta en el servidor (faltan VAPID keys)' },
      { status: 500 }
    );
  }

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: session.user.id },
  });

  if (subs.length === 0) {
    return NextResponse.json(
      { error: 'No tienes notificaciones activadas en este dispositivo. Activa los permisos primero.' },
      { status: 400 }
    );
  }

  let sent = 0;
  const expiredEndpoints: string[] = [];
  const errors: string[] = [];

  for (const sub of subs) {
    const result = await sendPushNotification(sub, {
      title: '🎉 ¡Notificaciones activadas!',
      body: 'Sentirse Única te enviará recordatorios para mantener tu rutina.',
      url: '/patient',
      icon: '/logo.png',
    });
    if (result.success) sent++;
    else if (result.expired) expiredEndpoints.push(sub.endpoint);
    else errors.push(String(result.error?.message || 'desconocido'));
  }

  if (expiredEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: expiredEndpoints } } });
  }

  if (sent === 0 && errors.length > 0) {
    return NextResponse.json({ error: `No se pudo enviar: ${errors[0]}` }, { status: 500 });
  }

  return NextResponse.json({ sent, total: subs.length });
}
