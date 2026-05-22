import { apiClient } from '@/lib/api-client';
import type { Message } from '@/types/models';

export const chatService = {
  list(userId: string, limit?: number): Promise<Message[]> {
    const query = new URLSearchParams({ userId });
    if (limit) query.set('limit', String(limit));
    return apiClient.get<Message[]>(`/api/messages?${query.toString()}`);
  },

  send(receiverId: string, content: string): Promise<Message> {
    return apiClient.post<Message>('/api/messages', { receiverId, content });
  },
};
