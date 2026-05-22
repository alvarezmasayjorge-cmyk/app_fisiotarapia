import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const otherUserId = searchParams.get('userId');

  if (!otherUserId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: session.user.id }
      ]
    },
    orderBy: { createdAt: 'asc' }
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const { receiverId, content } = body;

  if (!receiverId || !content) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      senderId: session.user.id,
      receiverId,
      content
    }
  });

  return NextResponse.json(message);
}
