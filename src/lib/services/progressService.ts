import { apiClient } from '@/lib/api-client';
import type { ProgressLog } from '@/types/models';

export type PainLogInput = {
  painLevel: number;
  patientNotes?: string | null;
};

export const progressService = {
  logPain(input: PainLogInput): Promise<{ log: ProgressLog; newStreak: number }> {
    return apiClient.patch('/api/progress-logs', input);
  },
};
