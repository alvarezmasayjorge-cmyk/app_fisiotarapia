import { z } from 'zod';
import { NextResponse } from 'next/server';

export const messageSchema = z.object({
  receiverId: z.string().min(1, 'Destinatario requerido'),
  content: z.string().trim().min(1, 'El mensaje no puede estar vacío').max(2000, 'Mensaje demasiado largo'),
});

export const exerciseLogSchema = z.object({
  planExerciseId: z.string().min(1),
  completed: z.boolean(),
});

export const progressLogSchema = z.object({
  patientId: z.string().min(1),
  percentage: z.number().int().min(0).max(100),
  painLevel: z.number().int().min(1).max(10).nullable().optional(),
  patientNotes: z.string().max(1000).nullable().optional(),
});

export const appointmentSchema = z.object({
  patientId: z.string().min(1),
  date: z.string().datetime(),
  mode: z.enum(['PRESENTIAL', 'VIDEO']),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
});

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Teléfono inválido')
  .transform((v) => v.replace(/[\s\-()]/g, ''));

export const patientSelfRegisterSchema = z.object({
  name: z.string().trim().min(2, 'Nombre demasiado corto'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  phone: phoneSchema,
});

export const patientCreateSchema = z.object({
  name: z.string().trim().min(2, 'Nombre demasiado corto'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  phone: phoneSchema,
  diagnosis: z.string().trim().min(2, 'Diagnóstico requerido').optional().default(''),
  notes: z.string().max(2000).optional().nullable(),
});

export const patientUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Nombre demasiado corto').optional(),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
  phone: phoneSchema.optional().nullable().or(z.literal('').transform(() => null)),
  diagnosis: z.string().trim().min(2, 'Diagnóstico requerido').optional(),
  notes: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const exerciseCreateSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().min(1),
  sets: z.number().int().positive().nullable().optional(),
  reps: z.number().int().positive().nullable().optional(),
  duration: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional().or(z.literal('')),
  videoUrl: z.string().url().nullable().optional().or(z.literal('')),
  tags: z.string().nullable().optional(),
  isHomeOnly: z.boolean().optional(),
});

export const PILLAR_VALUES = ['PELVIC_FLOOR', 'PAIN', 'AESTHETIC'] as const;
export type Pillar = (typeof PILLAR_VALUES)[number];

export const PILLAR_LABELS: Record<Pillar, string> = {
  PELVIC_FLOOR: 'Piso Pélvico',
  PAIN: 'Dolor',
  AESTHETIC: 'Estética',
};

export const treatmentPlanSchema = z.object({
  patientId: z.string().min(1),
  pillar: z.enum(PILLAR_VALUES),
  diagnosis: z.string().trim().min(1, 'Diagnóstico requerido').max(2000),
  treatmentText: z.string().trim().min(1, 'Tratamiento requerido').max(5000),
  exerciseIds: z.array(z.string()).default([]),
  restrictions: z.array(z.object({
    description: z.string().trim().min(1),
    severity: z.enum(['WARNING', 'IMPORTANT', 'CRITICAL']),
  })).default([]),
  nutrition: z.array(z.object({
    type: z.enum(['DIET_RECOMMENDED', 'DIET_AVOID', 'SUPPLEMENT']),
    description: z.string().trim().min(1),
    time: z.string().nullable().optional(),
    dose: z.string().nullable().optional(),
  })).default([]),
});

export const medicationCreateSchema = z.object({
  patientId: z.string().min(1),
  name: z.string().trim().min(1, 'Nombre requerido').max(120),
  dose: z.string().trim().min(1, 'Dosis requerida').max(60),
  frequencyHours: z.number().int().min(1).max(72),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const medicationUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  dose: z.string().trim().min(1).max(60).optional(),
  frequencyHours: z.number().int().min(1).max(72).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const dailyCheckInSchema = z.object({
  improvement: z.number().int().min(1).max(10),
  painLevel: z.number().int().min(1).max(10).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const medicationDoseTakenSchema = z.object({
  doseId: z.string().min(1).optional(),
  medicationId: z.string().min(1).optional(),
}).refine((d) => d.doseId || d.medicationId, { message: 'doseId o medicationId requerido' });

export function validationErrorResponse(error: z.ZodError) {
  return NextResponse.json(
    {
      error: 'Datos inválidos',
      details: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    },
    { status: 400 },
  );
}

export async function parseBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<{ success: true; data: z.infer<T> } | { success: false; response: NextResponse }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return { success: false, response: validationErrorResponse(result.error) };
    }
    return { success: true, data: result.data };
  } catch {
    return {
      success: false,
      response: NextResponse.json({ error: 'JSON inválido' }, { status: 400 }),
    };
  }
}
