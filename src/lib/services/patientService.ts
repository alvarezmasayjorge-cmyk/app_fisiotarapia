import { apiClient } from '@/lib/api-client';
import type { PatientProfile } from '@/types/models';

export type PatientCreateInput = {
  name: string;
  phone: string;
  password: string;
  diagnosis: string;
  notes?: string | null;
};

export const patientService = {
  create(input: PatientCreateInput): Promise<PatientProfile> {
    return apiClient.post<PatientProfile>('/api/patients', input);
  },
};
