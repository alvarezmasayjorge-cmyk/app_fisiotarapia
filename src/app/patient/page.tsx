import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PatientDashboardClient from './PatientDashboardClient';

export default async function PatientDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'PATIENT') return null;

  // Queries en paralelo para reducir latencia total
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const todayEnd = new Date(new Date().setHours(24, 0, 0, 0));

  const [profile, nextAppointment] = await Promise.all([
    prisma.patientProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        treatmentPlans: {
          where: { isActive: true },
          include: {
            exercises: {
              include: {
                exercise: true,
                completedLogs: {
                  where: { date: { gte: todayStart, lt: todayEnd } },
                },
              },
            },
            restrictions: { where: { severity: 'CRITICAL' } },
            nutrition: true,
          },
        },
        progressLogs: { orderBy: { date: 'desc' }, take: 7 },
      },
    }),
    prisma.appointment.findFirst({
      where: {
        patientId: session.user.id,
        date: { gte: new Date() },
        status: 'SCHEDULED',
      },
      orderBy: { date: 'asc' },
    }),
  ]);

  if (!profile || profile.treatmentPlans.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-700">Sin plan activo</h2>
        <p className="text-slate-500 mt-2">Tu fisioterapeuta aún no ha asignado un plan de tratamiento.</p>
      </div>
    );
  }

  // Mergear ejercicios, restricciones y nutrición de TODOS los pilares activos
  const allExercises = profile.treatmentPlans.flatMap(p => p.exercises);
  const allRestrictions = profile.treatmentPlans.flatMap(p => p.restrictions);
  const allNutrition = profile.treatmentPlans.flatMap(p => p.nutrition);

  const initialExercises = allExercises.map(pe => ({
    id: pe.id,
    isCompleted: pe.completedLogs.length > 0,
    exercise: {
      name: pe.exercise.name,
      sets: pe.exercise.sets,
      reps: pe.exercise.reps,
      imageUrl: pe.exercise.imageUrl,
      videoUrl: pe.exercise.videoUrl,
    }
  }));

  const todayCheckIn = await prisma.dailyCheckIn.findFirst({
    where: { patientId: profile.id, date: { gte: todayStart, lt: todayEnd } },
  });
  const painLevelRecorded = !!todayCheckIn;

  const chartData = profile.progressLogs.map(log => ({
    date: log.date.toISOString(),
    cumplimiento: log.percentage,
    dolor: log.painLevel
  }));

  return (
    <PatientDashboardClient
      initialExercises={initialExercises}
      restrictionsCount={allRestrictions.length}
      currentStreak={profile.currentStreak}
      painLevelRecorded={painLevelRecorded}
      nextAppointmentDate={nextAppointment?.date.toISOString() || null}
      chartData={chartData}
      nutritionItems={allNutrition}
    />
  );
}
