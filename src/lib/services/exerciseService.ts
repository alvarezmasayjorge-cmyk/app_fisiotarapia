import { apiClient } from '@/lib/api-client';
import type { Exercise } from '@/types/models';

export type ExerciseListItem = Pick<Exercise, 'id' | 'name' | 'sets' | 'reps' | 'duration'>;

export type ExerciseInput = {
  name: string;
  description: string;
  sets?: number | null;
  reps?: number | null;
  duration?: string | null;
  frequency?: string | null;
  tags?: string | null;
  isHomeOnly?: boolean;
  imageUrl?: string | null;
  videoUrl?: string | null;
};

export const exerciseService = {
  list(): Promise<ExerciseListItem[]> {
    return apiClient.get<ExerciseListItem[]>('/api/exercises-list');
  },

  create(input: ExerciseInput): Promise<Exercise> {
    return apiClient.post<Exercise>('/api/exercises', input);
  },

  remove(id: string): Promise<{ ok: boolean }> {
    return apiClient.delete<{ ok: boolean }>(`/api/exercises?id=${id}`);
  },

  toggleComplete(planExerciseId: string): Promise<{ completed: boolean }> {
    return apiClient.post<{ completed: boolean }>('/api/exercise-logs', { planExerciseId });
  },
};
