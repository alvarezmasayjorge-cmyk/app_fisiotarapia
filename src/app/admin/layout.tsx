'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Users, Activity, Calendar, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const sidebarContent = (
    <>
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
              onClick={() => setSidebarOpen(false)}
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
    </>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-teal-800 text-white p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6" />
          <span className="font-bold">FisioApp</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-teal-700 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative left-0 top-0 h-full w-64 bg-teal-800 text-white flex flex-col transition-transform duration-300 z-40 lg:z-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Close Button */}
        <div className="lg:hidden flex justify-end p-4">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-teal-700 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="hidden lg:flex lg:flex-col lg:flex-1">
          {sidebarContent}
        </div>
        <div className="lg:hidden flex flex-col flex-1">
          {sidebarContent}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
}
