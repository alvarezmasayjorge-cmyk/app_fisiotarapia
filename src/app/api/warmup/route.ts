import { NextResponse } from 'next/server';

// Endpoint de precalentamiento: cron-job.org lo llama cada 10 minutos
// para evitar cold starts de Vercel que causan lentitud en demos.
export async function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() });
}
