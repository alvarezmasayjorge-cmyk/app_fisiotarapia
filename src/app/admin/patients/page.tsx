import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { UserPlus, ChevronRight, Activity, AlertTriangle } from 'lucide-react';

export default async function PatientsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return null;

  let patients;
  try {
    patients = await prisma.patientProfile.findMany({
      include: {
        user: true,
        treatmentPlans: { where: { isActive: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  } catch (error) {
    console.error('[admin/patients] error cargando pacientes:', error);
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 rounded-full p-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error al cargar pacientes</h2>
          <p className="text-slate-500 text-sm">
            No se pudo conectar con la base de datos. Por favor recarga la página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Pacientes</h1>
          <p className="text-sm text-slate-500 mt-1">Gestiona todos tus pacientes</p>
        </div>
        <Link
          href="/admin/patients/new"
          className="inline-flex items-center justify-center gap-2 bg-amber-500 text-white px-4 h-11 rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm shadow-sm w-full sm:w-auto"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Paciente
        </Link>
      </div>

      {patients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No hay pacientes registrados aún.</p>
          <Link
            href="/admin/patients/new"
            className="mt-4 inline-flex items-center gap-2 text-amber-500 hover:text-amber-600 text-sm font-medium"
          >
            <UserPlus className="w-4 h-4" />
            Crear primero
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="lg:hidden space-y-3">
            {patients.map((p) => (
              <Link
                key={p.id}
                href={`/admin/patients/${p.id}`}
                className="block bg-white rounded-xl shadow-sm border border-slate-100 p-4 active:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{p.user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{p.user.phone ?? '—'}</p>
                    <p className="text-sm text-slate-700 mt-2 line-clamp-2">{p.diagnosis}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {p.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.treatmentPlans.length > 0 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.treatmentPlans.length > 0 ? 'Con plan' : 'Sin plan'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Paciente</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Diagnóstico</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan Activo</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">{p.user.name}</p>
                          <p className="text-sm text-slate-500">{p.user.phone ?? '—'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700 max-w-xs truncate">{p.diagnosis}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          p.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          p.treatmentPlans.length > 0 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.treatmentPlans.length > 0 ? 'Sí' : 'Sin plan'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/patients/${p.id}`}
                          className="text-amber-500 hover:text-amber-700 text-sm font-medium hover:underline"
                        >
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
