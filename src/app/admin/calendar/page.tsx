import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import CalendarClient from './CalendarClient';

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return null;

  const [appointments, patients] = await Promise.all([
    prisma.appointment.findMany({
      where: { physioId: session.user.id },
      include: { patient: true },
      orderBy: { date: 'asc' },
    }).catch(() => []),
    prisma.user.findMany({
      where: { role: 'PATIENT' },
      select: { id: true, name: true },
    }).catch(() => []),
  ]);

  // Filtra citas cuyo paciente fue eliminado directamente de la BD
  const validAppointments = appointments.filter(a => a.patient != null);

  const serialized = validAppointments.map(a => ({
    ...a,
    date: a.date.toISOString(),
  }));

  return <CalendarClient appointments={serialized} patients={patients} />;
}
