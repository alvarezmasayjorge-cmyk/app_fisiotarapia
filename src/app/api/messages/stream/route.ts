import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// SSE endpoint: stream nuevos mensajes en tiempo casi-real.
// Server-side polling cada 2.5s con conexión persistente al cliente.
// Más eficiente que polling del cliente (1 conexión vs request loop).
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const POLL_MS = 2500;
const HEARTBEAT_MS = 25000;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const otherUserId = searchParams.get('userId');
  if (!otherUserId) {
    return new Response('userId requerido', { status: 400 });
  }

  const userId = session.user.id;
  let lastTimestamp = new Date(0);
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          closed = true;
        }
      };

      const cleanup = () => {
        closed = true;
        clearInterval(pollInterval);
        clearInterval(heartbeatInterval);
        try {
          controller.close();
        } catch {}
      };

      const where = {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      };

      // Cargar mensajes iniciales (últimos 200)
      try {
        const initial = await prisma.message.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 200,
        });
        const ordered = initial.reverse();
        if (ordered.length > 0) {
          lastTimestamp = ordered[ordered.length - 1].createdAt;
        }
        send('initial', ordered);
      } catch (err) {
        send('error', { message: 'No se pudieron cargar los mensajes' });
        cleanup();
        return;
      }

      // Poll de nuevos mensajes
      const pollInterval = setInterval(async () => {
        if (closed) return;
        try {
          const news = await prisma.message.findMany({
            where: { ...where, createdAt: { gt: lastTimestamp } },
            orderBy: { createdAt: 'asc' },
            take: 50,
          });
          if (news.length > 0) {
            lastTimestamp = news[news.length - 1].createdAt;
            send('messages', news);
          }
        } catch {
          // Silenciar errores transitorios de DB; siguiente tick reintenta
        }
      }, POLL_MS);

      // Heartbeat para mantener conexión viva (proxies/load balancers)
      const heartbeatInterval = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          cleanup();
        }
      }, HEARTBEAT_MS);

      // Cerrar cuando el cliente desconecta
      req.signal.addEventListener('abort', cleanup);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
