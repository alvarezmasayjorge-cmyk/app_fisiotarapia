import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { patientCreateSchema, parseBody } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const parsed = await parseBody(req, patientCreateSchema);
    if (!parsed.success) return parsed.response;
    const { name, email, password, phone, diagnosis, notes } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese correo' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: 'PATIENT',
        patientProfile: {
          create: {
            diagnosis,
            notes: notes || null,
          },
        },
      },
      include: { patientProfile: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('[api/patients POST] error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
