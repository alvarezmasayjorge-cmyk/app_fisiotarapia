'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, User as UserIcon, AlertTriangle } from 'lucide-react';
import { chatService } from '@/lib/services';
import { usePolling } from '@/hooks/usePolling';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { formatTime } from '@/lib/date-utils';
import type { Message } from '@/types/models';

type Props = {
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
};

const POLL_INTERVAL = 5000;

export default function ChatClient({ currentUserId, otherUserId, otherUserName }: Props) {
  const [content, setContent] = useState('');
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data, loading, error, refetch } = usePolling<Message[]>(
    () => chatService.list(otherUserId),
    { interval: POLL_INTERVAL },
  );

  const sendOperation = useAsyncOperation(async (text: string) => {
    return chatService.send(otherUserId, text);
  });

  const messages = data ?? [];
  const allMessages = [...messages, ...optimisticMessages];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  useEffect(() => {
    if (data) {
      setOptimisticMessages((prev) =>
        prev.filter((m) => !data.some((real) => real.content === m.content && real.senderId === m.senderId)),
      );
    }
  }, [data]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || sendOperation.loading) return;

    setContent('');
    setLocalError(null);

    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId,
      receiverId: otherUserId,
      content: text,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setOptimisticMessages((prev) => [...prev, tempMsg]);

    const result = await sendOperation.execute(text);
    if (result) {
      await refetch();
    } else {
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setLocalError(sendOperation.error || 'No se pudo enviar el mensaje');
      setContent(text);
    }
  };

  const displayError = localError || (loading ? null : error);

  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-col h-96 md:h-[500px] bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-500 animate-pulse">Cargando mensajes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 md:h-[500px] bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-100 text-teal-700 flex items-center justify-center rounded-full shrink-0">
          <UserIcon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">{otherUserName}</h3>
          <p className="text-xs text-teal-600 font-medium">Chat Activo</p>
        </div>
      </div>

      {displayError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{displayError}</span>
          <button onClick={() => setLocalError(null)} className="font-medium hover:underline">
            Cerrar
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
        {allMessages.length === 0 ? (
          <div className="text-center text-slate-400 text-sm mt-10">
            No hay mensajes aún. Envía el primer mensaje.
          </div>
        ) : (
          allMessages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm break-words ${
                    isMe
                      ? 'bg-teal-600 text-white rounded-br-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe un mensaje..."
          disabled={sendOperation.loading}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!content.trim() || sendOperation.loading}
          aria-label="Enviar mensaje"
          className="w-11 h-11 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white flex items-center justify-center rounded-full shrink-0 transition-colors"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </form>
    </div>
  );
}
