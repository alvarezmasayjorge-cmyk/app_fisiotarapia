import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const { prompt } = body;

    // Simular retraso de red para dar realismo a la demo
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Lógica simulada basada en palabras clave
    let aiResponse = "Soy el Asistente Virtual de la Dra. Giovanna. He registrado tu consulta y se la he notificado para que la revise en cuanto pueda. Si es una urgencia, por favor contacta por teléfono.";

    const lowercasePrompt = prompt.toLowerCase();
    if (lowercasePrompt.includes("duele") || lowercasePrompt.includes("dolor")) {
      aiResponse = "Hola. Si sientes un dolor agudo o punzante, por favor detén el ejercicio inmediatamente y aplica hielo si hay inflamación. He marcado este mensaje como prioritario para que la Dra. Giovanna lo revise a la brevedad.";
    } else if (lowercasePrompt.includes("cuantas") || lowercasePrompt.includes("series") || lowercasePrompt.includes("repeticiones")) {
      aiResponse = "Recuerda que puedes ver las series y repeticiones exactas en tu panel de 'Mi Plan'. Si sientes fatiga muscular excesiva, puedes reducir una serie hoy.";
    }

    return NextResponse.json({
      role: 'assistant',
      content: aiResponse
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error processing AI request' }, { status: 500 });
  }
}
