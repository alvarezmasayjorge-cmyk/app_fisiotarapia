import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { diagnosis } = await req.json();

    // Simular retraso
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Base de datos de ejercicios mock
    const exercises = [
      { id: '1', name: 'Elevación de rodilla', sets: 3, reps: 15, duration: '1 min' },
      { id: '2', name: 'Estiramiento isquiotibial', sets: 2, reps: 10, duration: '30 seg' },
      { id: '3', name: 'Rotación de hombro con banda', sets: 3, reps: 12, duration: '45 seg' }
    ];

    // Mock response basado en el diagnostico
    const plan = {
      notes: diagnosis ? `Plan sugerido por IA para tratamiento de: ${diagnosis}. Se recomienda iniciar con intensidad leve.` : "Plan general de estabilización.",
      exercises: exercises, // En un caso real, buscaríamos en la DB por nombre
      restrictions: "Evitar cargar pesos mayores a 5kg. No realizar movimientos bruscos de torsión.",
      nutrition: "Aumentar consumo de proteína magra para recuperación muscular y mantener hidratación abundante."
    };

    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json({ error: 'Error generating plan' }, { status: 500 });
  }
}
