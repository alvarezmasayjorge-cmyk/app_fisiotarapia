import { apiClient } from '@/lib/api-client';
import type { Appointment, AppointmentMode, AppointmentStatus } from '@/types/models';

export type AppointmentCreateInput = {
  patientUserId: string;
  date: string;
  mode?: AppointmentMode;
};

export const appointmentService = {
  create(input: AppointmentCreateInput): Promise<Appointment> {
    return apiClient.post<Appointment>('/api/appointments', input);
  },

  updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    return apiClient.patch<Appointment>('/api/appointments', { id, status });
  },
};
