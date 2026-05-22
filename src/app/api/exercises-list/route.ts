import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const exercises = await prisma.exercise.findMany({
    select: { id: true, name: true, sets: true, reps: true, duration: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(exercises);
}
