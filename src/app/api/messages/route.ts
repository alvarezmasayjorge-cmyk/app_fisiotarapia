import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { messageSchema, parseBody } from '@/lib/validation';
import { sendPushNotification } from '@/lib/webpush';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get('userId');
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 200);

    if (!otherUserId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 });

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: session.user.id },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(messages.reverse());
  } catch (error) {
    console.error('[api/messages GET] error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const parsed = await parseBody(req, messageSchema);
    if (!parsed.success) return parsed.response;

    const [message, sender] = await Promise.all([
      prisma.message.create({
        data: {
          senderId: session.user.id,
          receiverId: parsed.data.receiverId,
          content: parsed.data.content,
        },
      }),
      prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } }),
    ]);

    // Enviar push al receptor en background (sin bloquear la respuesta)
    prisma.pushSubscription
      .findMany({ where: { userId: parsed.data.receiverId } })
      .then((subs) => {
        const url = session.user.role === 'ADMIN' ? '/patient/chat' : `/admin/patients`;
        for (const sub of subs) {
          sendPushNotification(sub, {
            title: `Mensaje de ${sender?.name ?? 'tu fisioterapeuta'}`,
            body: parsed.data.content.slice(0, 100),
            url,
            icon: '/logo.png',
          }).catch((err) => {
            console.error('[api/messages] error enviando push a sub:', sub.endpoint, err);
          });
        }
      })
      .catch((err) => {
        console.error('[api/messages] error buscando suscripciones push:', err);
      });

    return NextResponse.json(message);
  } catch (error) {
    console.error('[api/messages POST] error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
