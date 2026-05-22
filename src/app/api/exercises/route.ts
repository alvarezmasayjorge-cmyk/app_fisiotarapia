import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, sets, reps, duration, frequency, tags, isHomeOnly, imageUrl, videoUrl } = body;

  if (!name || !description) {
    return NextResponse.json({ error: 'Nombre y descripción son obligatorios' }, { status: 400 });
  }

  const exercise = await prisma.exercise.create({
    data: {
      name,
      description,
      sets: sets ? parseInt(sets) : null,
      reps: reps ? parseInt(reps) : null,
      duration: duration || null,
      frequency: frequency || null,
      tags: tags || null,
      isHomeOnly: isHomeOnly ?? true,
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null,
    },
  });

  return NextResponse.json(exercise, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

  await prisma.exercise.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
