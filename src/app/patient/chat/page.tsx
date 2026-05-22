import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ChatClient from '@/components/ChatClient';

export default async function PatientChatPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'PATIENT') return null;

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      treatmentPlans: {
        where: { isActive: true },
        include: { physio: true }
      }
    }
  });

  if (!profile || profile.treatmentPlans.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-700">Sin fisioterapeuta asignado</h2>
        <p className="text-slate-500 mt-2">No tienes un plan activo con un fisioterapeuta para iniciar el chat.</p>
      </div>
    );
  }

  const physio = profile.treatmentPlans[0].physio;

  return (
    <div className="max-w-2xl mx-auto pb-4">
      <h1 className="text-2xl font-bold text-slate-800 mb-2 px-1">Consultas</h1>
      <p className="text-slate-500 text-sm mb-6 px-1">Comunícate directamente con tu fisioterapeuta si tienes dudas sobre tus ejercicios o presentas dolor.</p>
      
      <ChatClient 
        currentUserId={session.user.id} 
        otherUserId={physio.id} 
        otherUserName={`Dr. ${physio.name}`} 
      />
    </div>
  );
}
