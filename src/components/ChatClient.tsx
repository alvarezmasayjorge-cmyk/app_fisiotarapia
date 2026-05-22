'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon } from 'lucide-react';

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

export default function ChatClient({ 
  currentUserId, 
  otherUserId, 
  otherUserName 
}: { 
  currentUserId: string, 
  otherUserId: string,
  otherUserName: string 
}) {
  const [messages, setMessages] = setMessagesState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Type assertion for useState to avoid typing issues if using quick setup
  function setMessagesState(initial: Message[]) {
    return useState<Message[]>(initial);
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?userId=${otherUserId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Simple polling for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [otherUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const text = content.trim();
    setContent('');

    // Optimistic UI update
    const tempMsg: Message = {
      id: Math.random().toString(),
      senderId: currentUserId,
      receiverId: otherUserId,
      content: text,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: otherUserId, content: text })
      });
      if (res.ok) {
        fetchMessages();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-4 text-center text-slate-500 animate-pulse">Cargando mensajes...</div>;

  return (
    <div className="flex flex-col h-96 md:h-[500px] bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-100 text-teal-700 flex items-center justify-center rounded-full shrink-0">
          <UserIcon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">{otherUserName}</h3>
          <p className="text-xs text-teal-600 font-medium">Chat Activo</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 text-sm mt-10">
            No hay mensajes aún. Envía el primer mensaje.
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-teal-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(msg.createdAt))}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <input 
          type="text" 
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800"
        />
        <button 
          type="submit"
          disabled={!content.trim()}
          className="w-10 h-10 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white flex items-center justify-center rounded-full shrink-0 transition-colors"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </form>
    </div>
  );
}
