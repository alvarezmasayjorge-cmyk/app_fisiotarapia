import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { messageSchema, parseBody } from '@/lib/validation';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

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
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const parsed = await parseBody(req, messageSchema);
  if (!parsed.success) return parsed.response;

  const message = await prisma.message.create({
    data: {
      senderId: session.user.id,
      receiverId: parsed.data.receiverId,
      content: parsed.data.content,
    },
  });

  return NextResponse.json(message);
}
