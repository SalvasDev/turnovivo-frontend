'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import { DEFAULT_DEMO_PATH } from '@/config/app';
import { Button, Input } from '@/design-system';
import styles from '@/design-system/layouts/AuthLayout.module.css';

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
    if (submitting) return;
    
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
    <div className={styles.page} lang="en">
      <section className={styles.card} aria-labelledby="login-title">
        <Link href="/" className={styles.brand} aria-label="TurnoVivo home">TURNOVIVO</Link>
        <header className={styles.header}>
          <h1 id="login-title" className={styles.title}>Sign in to your account</h1>
          <p className={styles.description}>Welcome back. Enter your details to continue.</p>
        </header>

        {error && (
          <div id={errorId} role="alert" className={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}
          aria-labelledby="login-title" aria-describedby={error ? errorId : undefined}
          aria-busy={submitting}>
          <Input
            id={emailInputId}
            label="Email"
            name="email"
            type="email"
            isRequired
            value={email}
            onChange={setEmail}
            placeholder="name@company.com"
            autoComplete="email"
            isReadOnly={submitting}
            isInvalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
          <Input
            id={passwordInputId}
            label="Password"
            name="password"
            type="password"
            isRequired
            value={password}
            onChange={setPassword}
            placeholder="your password"
            autoComplete="current-password"
            isReadOnly={submitting}
            isInvalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
          <Button
            type="submit"
            variant="filled"
            isDisabled={submitting}
            className={styles.submit}
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className={styles.signUp}>
          <span>Don&apos;t have an account?</span>
          <Link href="/register" className={styles.signUpLink}>Sign up</Link>
        </div>

        <p className={styles.demoPassword}><strong>Password demo:</strong> password123</p>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className={styles.page} role="status" aria-label="Loading sign in" />}>
      <LoginForm />
    </Suspense>
  );
}
