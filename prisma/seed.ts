import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Physio (Admin)
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'doc@giovannadaza.app' },
    update: { name: 'Giovanna Daza' },
    create: {
      name: 'Giovanna Daza',
      email: 'doc@giovannadaza.app',
      password: hashedAdminPassword,
      role: 'ADMIN',
    },
  });

  // 2. Create Patients
  const hashedPatientPassword = await bcrypt.hash('paciente123', 10);
  
  const p1 = await prisma.user.upsert({
    where: { email: 'rodilla@paciente.app' },
    update: {},
    create: {
      name: 'Ana García',
      email: 'rodilla@paciente.app',
      password: hashedPatientPassword,
      role: 'PATIENT',
      patientProfile: {
        create: {
          diagnosis: 'Lesión de ligamento cruzado anterior - Rodilla derecha',
          notes: 'Paciente deportista, objetivo: volver a correr en 6 meses.',
        }
      }
    },
    include: { patientProfile: true }
  });

  const p2 = await prisma.user.upsert({
    where: { email: 'lumbar@paciente.app' },
    update: {},
    create: {
      name: 'Roberto Torres',
      email: 'lumbar@paciente.app',
      password: hashedPatientPassword,
      role: 'PATIENT',
      patientProfile: {
        create: {
          diagnosis: 'Hernia discal L4-L5',
          notes: 'Dolor crónico, trabaja sentado 8 horas.',
        }
      }
    },
    include: { patientProfile: true }
  });

  const p3 = await prisma.user.upsert({
    where: { email: 'hombro@paciente.app' },
    update: {},
    create: {
      name: 'Luisa Sánchez',
      email: 'hombro@paciente.app',
      password: hashedPatientPassword,
      role: 'PATIENT',
      patientProfile: {
        create: {
          diagnosis: 'Post-operatorio Manguito Rotador - Hombro izquierdo',
          notes: 'Fase inicial de recuperación, poca movilidad activa.',
        }
      }
    },
    include: { patientProfile: true }
  });

  // 3. Create Exercises Library
  const ex1 = await prisma.exercise.create({
    data: {
      name: 'Elevación de pierna extendida',
      description: 'Acuéstate boca arriba, dobla una rodilla y mantén la otra pierna recta. Levanta la pierna recta a la altura de la rodilla opuesta.',
      sets: 3,
      reps: 15,
      frequency: 'Todos los días',
      tags: 'rodilla,pierna,fuerza',
      isHomeOnly: true,
      imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600&auto=format&fit=crop'
    }
  });

  const ex2 = await prisma.exercise.create({
    data: {
      name: 'Deslizamiento de talón',
      description: 'Acuéstate boca arriba, desliza el talón hacia los glúteos doblando la rodilla, luego estira lentamente.',
      sets: 3,
      reps: 10,
      tags: 'rodilla,movilidad',
    }
  });

  const ex3 = await prisma.exercise.create({
    data: {
      name: 'Puente de glúteos',
      description: 'Acuéstate boca arriba con rodillas dobladas. Levanta la pelvis apretando glúteos y abdomen.',
      sets: 4,
      reps: 12,
      tags: 'lumbar,core',
    }
  });

  const ex4 = await prisma.exercise.create({
    data: {
      name: 'Péndulo de Codman',
      description: 'Apoya el brazo sano en una mesa. Deja colgar el brazo afectado y haz círculos pequeños usando el peso del cuerpo.',
      sets: 3,
      duration: '60s',
      tags: 'hombro,post-operatorio',
    }
  });

  // 4. Create Treatment Plans
  if (p1.patientProfile) {
    const plan1 = await prisma.treatmentPlan.create({
      data: {
        patientId: p1.patientProfile.id,
        physioId: admin.id,
        exercises: {
          create: [
            { exerciseId: ex1.id },
            { exerciseId: ex2.id }
          ]
        },
        restrictions: {
          create: [
            { description: 'No saltar ni correr', severity: 'CRITICAL' },
            { description: 'Evitar cruzar las piernas', severity: 'WARNING' }
          ]
        },
        nutrition: {
          create: [
            { type: 'SUPPLEMENT', description: 'Colágeno Hidrolizado', dose: '1 cacito', time: 'En el desayuno' },
            { type: 'DIET_RECOMMENDED', description: 'Alta en proteína para recuperación muscular' }
          ]
        }
      }
    });
  }

  if (p2.patientProfile) {
    await prisma.treatmentPlan.create({
      data: {
        patientId: p2.patientProfile.id,
        physioId: admin.id,
        exercises: {
          create: [ { exerciseId: ex3.id } ]
        },
        restrictions: {
          create: [ { description: 'No levantar objetos pesados flexionando la espalda', severity: 'CRITICAL' } ]
        }
      }
    });
  }

  if (p3.patientProfile) {
    await prisma.treatmentPlan.create({
      data: {
        patientId: p3.patientProfile.id,
        physioId: admin.id,
        exercises: {
          create: [ { exerciseId: ex4.id } ]
        },
        restrictions: {
          create: [ { description: 'No levantar el brazo por encima del hombro', severity: 'CRITICAL' } ]
        },
        nutrition: {
          create: [
            { type: 'SUPPLEMENT', description: 'Ibuprofeno 400mg', dose: '1 pastilla', time: 'Cada 8 horas si hay dolor' }
          ]
        }
      }
    });
  }

  // 5. Create Appointments
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(16, 30, 0, 0);

  await prisma.appointment.create({
    data: {
      physioId: admin.id,
      patientId: p1.id,
      date: tomorrow,
      mode: 'PRESENTIAL',
      status: 'SCHEDULED'
    }
  });

  await prisma.appointment.create({
    data: {
      physioId: admin.id,
      patientId: p2.id,
      date: nextWeek,
      mode: 'VIDEO',
      status: 'SCHEDULED'
    }
  });

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
