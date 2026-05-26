'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import PhoneInputBO from '@/components/ui/PhoneInputBO';

export default function RegistroPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al registrarse');
        return;
      }

      // Auto-login after registration
      const signInRes = await signIn('credentials', {
        redirect: false,
        identifier: phone,
        password,
      });

      if (signInRes?.error) {
        setError(signInRes.error);
      } else {
        router.push('/patient');
        router.refresh();
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Image src="/logo.png" alt="Sentirse Única" width={180} height={80} className="object-contain" priority />
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Crear cuenta</h1>
          <p className="text-sm text-slate-600 mb-6">Regístrate como paciente para empezar tu tratamiento</p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: María García López"
                className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Número de WhatsApp *</label>
              <PhoneInputBO
                value={phone}
                onChange={setPhone}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-slate-900 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">Usarás esto junto con tu WhatsApp para iniciar sesión</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Registrando...' : 'Crear cuenta'}
            </button>

            <div className="text-center">
              <p className="text-sm text-slate-600">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="font-medium text-amber-500 hover:text-amber-600">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
