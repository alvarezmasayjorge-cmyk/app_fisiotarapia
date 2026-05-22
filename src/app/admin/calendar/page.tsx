import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import CalendarClient from './CalendarClient';

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return null;

  const appointments = await prisma.appointment.findMany({
    where: { physioId: session.user.id },
    include: { patient: true },
    orderBy: { date: 'asc' },
  });

  const patients = await prisma.user.findMany({
    where: { role: 'PATIENT' },
    select: { id: true, name: true },
  });

  const serialized = appointments.map(a => ({
    ...a,
    date: a.date.toISOString(),
  }));

  return <CalendarClient appointments={serialized} patients={patients} />;
}
