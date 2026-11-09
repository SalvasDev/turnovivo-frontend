'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import { DEFAULT_DEMO_PATH } from '@/config/app';

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const { login } = useAuth();
  const nextPath = searchParams.get('next') || DEFAULT_DEMO_PATH;
  const emailInputId = 'login-email';
  const passwordInputId = 'login-password';
  const errorId = 'login-error-message';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError(null);
    setSubmitting(true);

    try {
      const data = await apiService.login(email, password);
      login(data.accessToken);

      let target = nextPath;
      if (!searchParams.get('next')) {
        try {
          const base64 = data.accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          if (payload.role === 'SUPER_ADMIN') {
            target = '/super-admin';
          }
        } catch {
          // Si el token no es decodificable, usamos el destino por defecto.
        }
      }

      setTimeout(() => {
        window.location.href = target;
      }, 150);
      
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error al iniciar sesión.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-6" aria-live="polite">
          <span className="text-amber-500 font-extrabold text-2xl tracking-tighter">TurnoVivo</span>
          <h1 className="text-xl font-bold text-zinc-100 mt-2">Acceso a la experiencia demo</h1>
          <p className="text-xs text-zinc-400 mt-1">Ingresa tus credenciales para probar reservas y lista de espera en vivo</p>
        </div>

        {error && (
          <div id={errorId} role="alert" className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center font-medium">
            🛑 {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-describedby={error ? errorId : undefined}>
          <div>
            <label htmlFor={emailInputId} className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
            <input
              id={emailInputId}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente.real@turnovivo.com"
              autoComplete="email"
              aria-invalid={!!error}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor={passwordInputId} className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Contraseña</label>
            <input
              id={passwordInputId}
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              aria-invalid={!!error}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="w-full py-3 mt-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {submitting ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-zinc-400 mb-2">¿No tienes cuenta?</p>
          <Link
            href="/register"
            className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:border-amber-500 hover:text-amber-400 transition-colors"
          >
            Crear cuenta
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800/60 text-center text-xs text-zinc-500">
          Password demo: <span className="text-zinc-400 font-mono">password123</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <LoginForm />
    </Suspense>
  );
}
