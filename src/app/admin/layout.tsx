'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Users, Activity, Calendar, LogOut, LayoutDashboard } from 'lucide-react';
import NotificationStatus from '@/components/NotificationStatus';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500 animate-pulse">Cargando...</p>
      </div>
    );
  }
  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Acceso denegado</p>
      </div>
    );
  }

  const navItems = [
    { name: 'Inicio', href: '/admin', icon: LayoutDashboard },
    { name: 'Pacientes', href: '/admin/patients', icon: Users },
    { name: 'Ejercicios', href: '/admin/exercises', icon: Activity },
    { name: 'Agenda', href: '/admin/calendar', icon: Calendar },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row pb-20 lg:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-amber-700 text-white h-screen sticky top-0">
        <div className="p-6">
          <Image src="/logo.png" alt="Sentirse Única" width={160} height={60} className="object-contain brightness-0 invert" priority />
          <p className="text-amber-200 text-sm mt-2">{session.user.name}</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active ? 'bg-amber-600 text-white' : 'text-amber-100 hover:bg-amber-600/50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-amber-600">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-amber-100 hover:bg-amber-600 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Sentirse Única" width={120} height={40} className="object-contain" priority />
            <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{session.user.name}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 rounded-lg transition-colors"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-4">
          <NotificationStatus />
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 pb-safe shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-50"
        aria-label="Navegación principal"
      >
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center p-2 w-16"
              aria-current={active ? 'page' : undefined}
            >
              <div className={`p-1.5 rounded-full transition-colors ${active ? 'bg-amber-100' : ''}`}>
                <item.icon className={`w-6 h-6 ${active ? 'text-amber-600' : 'text-slate-400'}`} />
              </div>
              <span className={`text-[10px] font-medium mt-1 ${active ? 'text-amber-600' : 'text-slate-500'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
