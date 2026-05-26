import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { patientSelfRegisterSchema, parseBody } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const parsed = await parseBody(req, patientSelfRegisterSchema);
    if (!parsed.success) return parsed.response;
    const { name, password, phone } = parsed.data;

    const existing = await prisma.user.findFirst({ where: { phone } });
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese número de WhatsApp' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: null,
        password: hashedPassword,
        phone,
        role: 'PATIENT',
        patientProfile: {
          create: {
            diagnosis: '',
            notes: null,
          },
        },
      },
      include: { patientProfile: true },
    });

    return NextResponse.json(
      { id: user.id, name: user.name, phone: user.phone },
      { status: 201 }
    );
  } catch (error) {
    console.error('[api/auth/register POST] error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
