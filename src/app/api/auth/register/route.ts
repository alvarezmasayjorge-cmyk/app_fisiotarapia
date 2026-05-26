import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { patientSelfRegisterSchema, parseBody } from '@/lib/validation';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta más tarde.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

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
