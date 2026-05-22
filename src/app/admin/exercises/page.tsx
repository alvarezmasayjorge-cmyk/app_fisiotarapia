import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ExercisesClient from './ExercisesClient';

export default async function ExercisesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return null;

  const exercises = await prisma.exercise.findMany({
    orderBy: { name: 'asc' },
  });

  return <ExercisesClient initialExercises={exercises} />;
}
