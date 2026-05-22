'use client';

import { useEffect, useRef, useState } from 'react';
import type { Message } from '@/types/models';

type Status = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useChatStream(otherUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>('connecting');
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!otherUserId) return;

    const url = `/api/messages/stream?userId=${encodeURIComponent(otherUserId)}`;
    const source = new EventSource(url, { withCredentials: true });
    sourceRef.current = source;
    setStatus('connecting');

    const handleInitial = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as Message[];
        setMessages(data);
        setStatus('connected');
      } catch {
        setStatus('error');
      }
    };

    const handleNew = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as Message[];
        setMessages((prev) => {
          const known = new Set(prev.map((m) => m.id));
          const fresh = data.filter((m) => !known.has(m.id));
          return fresh.length > 0 ? [...prev, ...fresh] : prev;
        });
      } catch {
        // ignore
      }
    };

    const handleError = () => {
      setStatus((s) => (s === 'connected' ? 'disconnected' : 'error'));
    };

    source.addEventListener('initial', handleInitial);
    source.addEventListener('messages', handleNew);
    source.addEventListener('error', handleError);

    return () => {
      source.removeEventListener('initial', handleInitial);
      source.removeEventListener('messages', handleNew);
      source.removeEventListener('error', handleError);
      source.close();
      sourceRef.current = null;
    };
  }, [otherUserId]);

  /** Para optimistic update: agrega un mensaje temporalmente */
  const addOptimistic = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  /** Reemplaza optimistic temporal por el real del server */
  const replaceOptimistic = (tempId: string, real: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === real.id)) {
        return prev.filter((m) => m.id !== tempId);
      }
      return prev.map((m) => (m.id === tempId ? real : m));
    });
  };

  const removeOptimistic = (tempId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
  };

  return {
    messages,
    status,
    addOptimistic,
    replaceOptimistic,
    removeOptimistic,
  };
}
