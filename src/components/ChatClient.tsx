'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, User as UserIcon, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { chatService } from '@/lib/services';
import { useChatStream } from '@/hooks/useChatStream';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { useToast } from '@/components/ui/ToastProvider';
import { formatTime } from '@/lib/date-utils';
import type { Message } from '@/types/models';

type Props = {
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
};

export default function ChatClient({ currentUserId, otherUserId, otherUserName }: Props) {
  const [content, setContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const { messages, status, addOptimistic, replaceOptimistic, removeOptimistic } =
    useChatStream(otherUserId);

  const sendOperation = useAsyncOperation(async (text: string) => {
    return chatService.send(otherUserId, text);
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || sendOperation.loading) return;

    setContent('');

    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      senderId: currentUserId,
      receiverId: otherUserId,
      content: text,
      createdAt: new Date().toISOString(),
      read: false,
    };
    addOptimistic(tempMsg);

    const result = await sendOperation.execute(text);
    if (result) {
      replaceOptimistic(tempId, result as Message);
    } else {
      removeOptimistic(tempId);
      toast.error(sendOperation.error || 'No se pudo enviar el mensaje');
      setContent(text);
    }
  };

  const isConnecting = status === 'connecting' && messages.length === 0;
  const isOnline = status === 'connected';

  if (isConnecting) {
    return (
      <div className="flex flex-col h-96 md:h-[500px] bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-500 animate-pulse">Conectando al chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 md:h-[500px] bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 text-amber-700 flex items-center justify-center rounded-full shrink-0">
          <UserIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800 truncate">{otherUserName}</h3>
          <p className="text-xs font-medium flex items-center gap-1">
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600">Tiempo real</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-slate-400" />
                <span className="text-slate-500">Reconectando...</span>
              </>
            )}
          </p>
        </div>
      </div>

      {status === 'error' && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>No se pudo conectar al chat en tiempo real.</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 text-sm mt-10">
            No hay mensajes aún. Envía el primer mensaje.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            const isPending = msg.id.startsWith('temp-');
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm break-words ${
                    isMe
                      ? 'bg-amber-500 text-white rounded-br-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                  } ${isPending ? 'opacity-60' : ''}`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {isPending ? 'Enviando...' : formatTime(msg.createdAt)}
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
          className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-800 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!content.trim() || sendOperation.loading}
          aria-label="Enviar mensaje"
          className="w-11 h-11 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white flex items-center justify-center rounded-full shrink-0 transition-colors"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </form>
    </div>
  );
}
