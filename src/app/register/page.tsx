'use client';

import Link from 'next/link';
import { useState } from 'react';
import { apiService } from '@/services/api';

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const emailInputId = 'register-email';
  const passwordInputId = 'register-password';
  const errorId = 'register-error-message';
  const successId = 'register-success-message';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await apiService.registerCustomer(email, password);

      setSuccess(true);
      setTimeout(() => {
        window.location.assign('/login');
      }, 2000);

    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error al procesar el registro.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-6" aria-live="polite">
          <span className="text-amber-500 font-extrabold text-2xl tracking-tighter">TurnoVivo</span>
          <h1 className="text-xl font-bold text-zinc-100 mt-2">Crea tu Cuenta de Cliente</h1>
          <p className="text-xs text-zinc-400 mt-1">Regístrate para agendar tus turnos en tiempo real</p>
        </div>

        {error && (
          <div id={errorId} role="alert" className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center font-medium">
            🛑 {error}
          </div>
        )}

        {success && (
          <div id={successId} role="status" aria-live="polite" className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl text-center font-medium animate-pulse">
            🎉 ¡Cuenta creada con éxito! Redireccionando al login...
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
          aria-describedby={error ? errorId : success ? successId : undefined}
        >
          <div>
            <label htmlFor={emailInputId} className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
            <input
              id={emailInputId}
              type="email"
              required
              disabled={success}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu-correo@gmail.com"
              autoComplete="email"
              aria-invalid={!!error}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor={passwordInputId} className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Contraseña</label>
            <input
              id={passwordInputId}
              type="password"
              required
              disabled={success}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              minLength={6}
              aria-invalid={!!error}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || success}
            aria-busy={submitting}
            className="w-full py-3 mt-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {submitting ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-zinc-800/60 text-center text-xs text-zinc-500">
          ¿Ya tienes cuenta? <Link href="/login" className="text-amber-500 hover:underline font-medium">Inicia sesión aquí</Link>
        </div>
      </div>
    </div>
  );
}