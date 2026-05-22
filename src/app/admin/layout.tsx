'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Activity, Calendar, LogOut, LayoutDashboard } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === 'loading') return <div>Cargando...</div>;
  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    return <div>Acceso denegado</div>;
  }

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Pacientes', href: '/admin/patients', icon: Users },
    { name: 'Ejercicios', href: '/admin/exercises', icon: Activity },
    { name: 'Agenda', href: '/admin/calendar', icon: Calendar },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-teal-800 text-white flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6" /> FisioApp
          </h2>
          <p className="text-teal-200 text-sm mt-1">{session.user.name}</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-teal-700 text-white' : 'text-teal-100 hover:bg-teal-700/50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-teal-700">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-teal-100 hover:bg-teal-700 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        {children}
      </div>
    </div>
  );
}
