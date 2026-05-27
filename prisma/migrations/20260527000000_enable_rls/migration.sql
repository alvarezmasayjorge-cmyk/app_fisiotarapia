-- Habilita Row-Level Security en todas las tablas para bloquear el acceso
-- desde la API pública (PostgREST) de Supabase con los roles `anon` y `authenticated`.
-- Prisma conecta como rol `postgres` (vía DATABASE_URL del pooler), que hace BYPASSRLS,
-- por lo que la app no se ve afectada. No definimos políticas a propósito:
-- sin políticas + RLS habilitado = deny all para roles no-superuser.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PatientProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Exercise" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TreatmentPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlanExercise" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Restriction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NutritionSupplement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProgressLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExerciseLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Medication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MedicationDoseLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DailyCheckIn" ENABLE ROW LEVEL SECURITY;
