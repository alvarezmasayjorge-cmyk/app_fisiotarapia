export type UserRole = 'ADMIN' | 'PATIENT';

export type RestrictionSeverity = 'WARNING' | 'IMPORTANT' | 'CRITICAL';

export type NutritionType = 'DIET_RECOMMENDED' | 'DIET_AVOID' | 'SUPPLEMENT';

export type AppointmentMode = 'PRESENTIAL' | 'VIDEO';

export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface PatientProfile {
  id: string;
  userId: string;
  diagnosis: string;
  startDate: string;
  notes: string | null;
  isActive: boolean;
  currentStreak: number;
  longestStreak: number;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  sets: number | null;
  reps: number | null;
  duration: string | null;
  frequency: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  tags: string | null;
  isHomeOnly: boolean;
}

export interface PlanExercise {
  id: string;
  planId: string;
  exerciseId: string;
  exercise?: Exercise;
}

export interface Restriction {
  id: string;
  planId: string;
  description: string;
  severity: RestrictionSeverity;
}

export interface NutritionSupplement {
  id: string;
  planId: string;
  type: NutritionType;
  description: string;
  time: string | null;
  dose: string | null;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  physioId: string;
  isActive: boolean;
  createdAt: string;
  exercises?: PlanExercise[];
  restrictions?: Restriction[];
  nutrition?: NutritionSupplement[];
}

export interface Appointment {
  id: string;
  physioId: string;
  patientId: string;
  date: string;
  mode: AppointmentMode;
  status: AppointmentStatus;
}

export interface ProgressLog {
  id: string;
  patientId: string;
  date: string;
  percentage: number;
  painLevel: number | null;
  patientNotes: string | null;
  physioNotes: string | null;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface ApiError {
  error: string;
  field?: string;
  details?: unknown;
}

export interface ApiSuccess<T = unknown> {
  data: T;
}
