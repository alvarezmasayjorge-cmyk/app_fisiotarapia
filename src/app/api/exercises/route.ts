import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { parseBody } from '@/lib/validation';

const createSchema = z.object({
  name: z.string().trim().min(2, 'Nombre demasiado corto'),
  description: z.string().trim().min(1, 'Descripción requerida'),
  sets: z.union([z.number().int().positive(), z.string()]).optional().nullable(),
  reps: z.union([z.number().int().positive(), z.string()]).optional().nullable(),
  duration: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  isHomeOnly: z.boolean().optional(),
  imageUrl: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const parsed = await parseBody(req, createSchema);
    if (!parsed.success) return parsed.response;
    const d = parsed.data;

    const exercise = await prisma.exercise.create({
      data: {
        name: d.name,
        description: d.description,
        sets: d.sets ? Number(d.sets) : null,
        reps: d.reps ? Number(d.reps) : null,
        duration: d.duration || null,
        frequency: d.frequency || null,
        tags: d.tags || null,
        isHomeOnly: d.isHomeOnly ?? true,
        imageUrl: d.imageUrl || null,
        videoUrl: d.videoUrl || null,
      },
    });

    return NextResponse.json(exercise, { status: 201 });
  } catch (error) {
    console.error('[api/exercises POST] error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    await prisma.exercise.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/exercises DELETE] error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
