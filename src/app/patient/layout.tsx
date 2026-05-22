'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Calendar, FileText, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import NotificationStatus from '@/components/NotificationStatus';

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Inicio', href: '/patient', icon: Home },
    { name: 'Mensajes', href: '/patient/chat', icon: MessageCircle },
    { name: 'Agenda', href: '/patient/calendar', icon: Calendar },
    { name: 'Mi Plan', href: '/patient/plan', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Sentirse Única" width={140} height={50} className="object-contain" priority />
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                  isActive 
                    ? 'bg-amber-50 text-amber-600' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto md:max-w-4xl md:p-8 pt-6 px-4">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-4">
          <Image src="/logo.png" alt="Sentirse Única" width={110} height={36} className="object-contain h-9 w-auto" priority />
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Notification status banner */}
        <div className="mb-4">
          <NotificationStatus />
        </div>

        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 pb-safe shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-50">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className="flex flex-col items-center p-2 w-16"
            >
              <div className={`p-1.5 rounded-full transition-colors ${isActive ? 'bg-amber-100' : ''}`}>
                <item.icon className={`w-6 h-6 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
              </div>
              <span className={`text-[10px] font-medium mt-1 ${isActive ? 'text-amber-600' : 'text-slate-500'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
