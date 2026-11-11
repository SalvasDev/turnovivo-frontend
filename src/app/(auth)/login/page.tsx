'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ApiError, apiService } from '@/services/api';
import { getErrorMessage } from '@/services/http-client';
import { Button, Input, Spinner } from '@/design-system';
import styles from '@/design-system/layouts/AuthLayout.module.css';
import { getEmailError } from '@/domain/validation';
import { getHomePathForRole, getSafeReturnPath } from '@/domain/access';
import { parseTokenClaims } from '@/services/api-parsers';

function LoginForm() {
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get('sessionExpired') === '1';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const { login, clearSession } = useAuth();
  const requestedPath = getSafeReturnPath(searchParams.get('next'));
  const emailInputId = 'login-email';
  const passwordInputId = 'login-password';
  const errorId = 'login-error-message';

  useEffect(() => {
    if (sessionExpired) clearSession();
  }, [clearSession, sessionExpired]);

  // A server error marks the fields invalid, which blocks native submit; editing clears it.
  const handleEmailChange = (value: string) => {
    setEmail(value);
    setError(null);
    setEmailError(null);
  };
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setError(null);
    setPasswordError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const nextEmailError = getEmailError(email);
    const nextPasswordError = password ? null : 'Enter your password.';
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) {
      setError(null);
      // Focus lands on the first invalid field so its linked error is announced.
      document.getElementById(nextEmailError ? emailInputId : passwordInputId)?.focus();
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const data = await apiService.login(email, password);
      login(data.accessToken);

      const target = requestedPath ?? getHomePathForRole(parseTokenClaims(data.accessToken)?.role);

      // Stays pending until navigation so the form cannot be submitted twice.
      setTimeout(() => {
        window.location.href = target;
      }, 150);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to sign in. Please try again.'));
      setPasswordError(err instanceof ApiError && err.status === 401
        ? 'Check your email and password, then try again.'
        : null);
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.card} aria-labelledby="login-title">
        <Link href="/" className={styles.brand} aria-label="TurnoVivo home">TURNOVIVO</Link>
        <header className={styles.header}>
          <h1 id="login-title" className={styles.title}>Sign in to your account</h1>
          <p className={styles.description}>Welcome back. Enter your details to continue.</p>
        </header>

        {sessionExpired && (
          <div role="status" className={styles.sessionExpired}>
            Your session expired. Sign in to continue.
          </div>
        )}

        {error && (
          <div id={errorId} role="alert" className={styles.error}>
            {error}
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className={styles.form}
          aria-labelledby="login-title" aria-describedby={error ? errorId : undefined}
          aria-busy={submitting}>
          <Input
            id={emailInputId}
            label="Email"
            name="email"
            type="email"
            isRequired
            value={email}
            onChange={handleEmailChange}
            placeholder="name@company.com"
            autoComplete="email"
            isReadOnly={submitting}
            isInvalid={!!emailError}
            errorMessage={emailError}
            onBlur={() => setEmailError(getEmailError(email))}
          />
          <Input
            id={passwordInputId}
            label="Password"
            name="password"
            type="password"
            isRequired
            value={password}
            onChange={handlePasswordChange}
            placeholder="your password"
            autoComplete="current-password"
            isReadOnly={submitting}
            isInvalid={!!passwordError}
            errorMessage={passwordError}
            onBlur={() => setPasswordError(password ? null : 'Enter your password.')}
          />
          <Button
            type="submit"
            variant="filled"
            isDisabled={submitting}
            isPending={submitting}
            pendingLabel="Signing in"
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
    <Suspense fallback={<div className={styles.page} role="status" aria-label="Loading sign in"><Spinner size="large" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
