import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { patientId } = await req.json();

    // Simular retraso de red
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generar resumen mock
    const aiSummary = "📝 Resumen Mágico (Simulado):\nEl paciente ha mantenido una excelente constancia (90% de adherencia). Su dolor ha bajado de 8 a 4 esta semana. Se sugiere mantener el volumen actual de repeticiones pero vigilar posibles sobrecargas en isquiotibiales.";

    return NextResponse.json({ summary: aiSummary });
  } catch (error) {
    return NextResponse.json({ error: 'Error generating summary' }, { status: 500 });
  }
}
