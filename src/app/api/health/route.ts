import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const checks = {
    db: false,
    env: {
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      VAPID_PRIVATE_KEY: !!process.env.VAPID_PRIVATE_KEY,
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      VAPID_EMAIL: !!process.env.VAPID_EMAIL,
      CRON_SECRET: !!process.env.CRON_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
    },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = true;
  } catch (err) {
    console.error('[health] DB check failed:', err);
  }

  const allEnvOk = Object.values(checks.env).every(Boolean);
  const ok = checks.db && allEnvOk;

  return NextResponse.json(
    { ok, ...checks, timestamp: new Date().toISOString() },
    { status: ok ? 200 : 503 }
  );
}
