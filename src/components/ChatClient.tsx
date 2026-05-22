'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, AlertTriangle } from 'lucide-react';
import { chatService } from '@/lib/services';
import { useChatStream } from '@/hooks/useChatStream';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { useToast } from '@/components/ui/ToastProvider';
import { formatTime, formatDayLabel, isSameDay } from '@/lib/date-utils';
import BrandedLoader from '@/components/BrandedLoader';
import type { Message } from '@/types/models';

type Props = {
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
};

/** Genera iniciales (máx 2) a partir del nombre */
function getInitials(name: string): string {
  const parts = name.replace(/^Dr\.?\s+/i, '').trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Color consistente por nombre, para el avatar */
function avatarColor(name: string): string {
  const palette = [
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-violet-100 text-violet-700',
    'bg-sky-100 text-sky-700',
    'bg-emerald-100 text-emerald-700',
    'bg-fuchsia-100 text-fuchsia-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
  return palette[Math.abs(hash) % palette.length];
}

/** Item visual: un mensaje o un separador de día */
type ChatItem =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'msg'; key: string; msg: Message; showAvatar: boolean; showTime: boolean };

/** Procesa los mensajes para agregar separadores de fecha y agrupar consecutivos */
function buildItems(messages: Message[], currentUserId: string): ChatItem[] {
  const items: ChatItem[] = [];
  let lastDate: Date | null = null;

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const date = new Date(m.createdAt);

    // Separador de día si cambió
    if (!lastDate || !isSameDay(lastDate, date)) {
      items.push({ kind: 'day', key: `day-${date.toDateString()}`, label: formatDayLabel(date) });
      lastDate = date;
    }

    // Agrupado: ¿el siguiente mensaje es del mismo sender y dentro de 2 min?
    const next = messages[i + 1];
    const nextSameSender =
      next &&
      next.senderId === m.senderId &&
      isSameDay(date, new Date(next.createdAt)) &&
      new Date(next.createdAt).getTime() - date.getTime() < 2 * 60 * 1000;

    items.push({
      kind: 'msg',
      key: m.id,
      msg: m,
      showAvatar: !nextSameSender, // avatar solo al final del grupo
      showTime: !nextSameSender,    // hora solo al final del grupo
    });
  }

  return items;
}

export default function ChatClient({ currentUserId, otherUserId, otherUserName }: Props) {
  const [content, setContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const { messages, status, addOptimistic, replaceOptimistic, removeOptimistic } =
    useChatStream(otherUserId);

  const sendOperation = useAsyncOperation(async (text: string) => {
    return chatService.send(otherUserId, text);
  });

  const items = useMemo(() => buildItems(messages, currentUserId), [messages, currentUserId]);

  // Auto-scroll solo si el usuario ya está cerca del fondo
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 120) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || sendOperation.loading) return;

    setContent('');
    inputRef.current?.focus();

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
  const avatarClass = avatarColor(otherUserName);
  const initials = getInitials(otherUserName);

  return (
    <div className="flex flex-col h-[28rem] md:h-[32rem] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <div className={`relative w-10 h-10 ${avatarClass} flex items-center justify-center rounded-full shrink-0 font-bold text-sm`}>
          {initials}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
              isOnline ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
            aria-label={isOnline ? 'En línea' : 'Reconectando'}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate leading-tight">{otherUserName}</h3>
          <p className={`text-xs font-medium ${isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
            {isOnline ? 'En línea' : 'Reconectando...'}
          </p>
        </div>
      </div>

      {status === 'error' && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>No se pudo conectar al chat en tiempo real.</span>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 bg-slate-50/40">
        {isConnecting ? (
          <div className="h-full flex items-center justify-center">
            <BrandedLoader size="sm" label="Conectando..." />
          </div>
        ) : items.length === 0 ? (
          <EmptyState name={otherUserName} />
        ) : (
          <AnimatePresence initial={false}>
            {items.map((item) => {
              if (item.kind === 'day') {
                return (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center my-3"
                  >
                    <span className="text-[11px] font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
                      {item.label}
                    </span>
                  </motion.div>
                );
              }

              const { msg, showAvatar, showTime } = item;
              const isMe = msg.senderId === currentUserId;
              const isPending = msg.id.startsWith('temp-');

              return (
                <motion.div
                  key={item.key}
                  layout
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-2' : 'mt-0.5'}`}
                >
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[82%]`}>
                    <div
                      className={`px-4 py-2 text-sm break-words shadow-sm leading-snug ${
                        isMe
                          ? `bg-amber-500 text-white ${showAvatar ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-r-md'}`
                          : `bg-white border border-slate-200 text-slate-800 ${showAvatar ? 'rounded-2xl rounded-bl-md' : 'rounded-2xl rounded-l-md'}`
                      } ${isPending ? 'opacity-70' : ''}`}
                    >
                      {msg.content}
                    </div>
                    {showTime && (
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {isPending ? 'Enviando...' : formatTime(msg.createdAt)}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe un mensaje..."
          disabled={sendOperation.loading}
          className="flex-1 bg-slate-100 border border-transparent rounded-full px-4 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white focus:border-amber-200 text-slate-800 disabled:opacity-50 transition-colors"
        />
        <motion.button
          type="submit"
          whileTap={{ scale: 0.92 }}
          disabled={!content.trim() || sendOperation.loading}
          aria-label="Enviar mensaje"
          className="w-11 h-11 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center rounded-full shrink-0 transition-colors shadow-sm"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </motion.button>
      </form>
    </div>
  );
}

function EmptyState({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col items-center justify-center text-center px-6"
    >
      <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-3">
        <Send className="w-7 h-7 text-amber-500 ml-1" />
      </div>
      <h4 className="text-sm font-semibold text-slate-700">Inicia la conversación</h4>
      <p className="text-xs text-slate-500 mt-1 max-w-xs">
        Escribe un mensaje a {name.split(' ')[0]} para resolver dudas o reportar cómo te sientes.
      </p>
    </motion.div>
  );
}
