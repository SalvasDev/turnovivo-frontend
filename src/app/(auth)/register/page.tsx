'use client';

import Link from 'next/link';
import { useState } from 'react';
import { apiService } from '@/services/api';
import { Button, Input } from '@/design-system';
import styles from '@/design-system/layouts/AuthLayout.module.css';

function validatePassword(value: string) {
  return value.length >= 8 && /[0-9]/.test(value)
    ? null
    : 'Use at least 8 characters, including one number.';
}

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
    if (submitting || success) return;
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
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
    <div className={styles.page} lang="en">
      <section className={styles.card} aria-labelledby="register-title">
        <Link href="/" className={styles.brand} aria-label="TurnoVivo home">TURNOVIVO</Link>
        <header className={styles.header}>
          <h1 id="register-title" className={styles.title}>Create your account</h1>
          <p className={styles.description}>Register to book your appointments in real time</p>
        </header>

        {error && (
          <div id={errorId} role="alert" className={styles.error}>
            {error}
          </div>
        )}

        {success && (
          <div id={successId} role="status" aria-live="polite" className={styles.success}>
            Account created successfully! Redirecting to sign in...
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={styles.form}
          aria-labelledby="register-title"
          aria-busy={submitting}
          aria-describedby={error ? errorId : success ? successId : undefined}
        >
          <Input
            id={emailInputId}
            label="Email"
            name="email"
            type="email"
            isRequired
            isDisabled={success}
            isReadOnly={submitting}
            value={email}
            onChange={setEmail}
            placeholder="name@company.com"
            autoComplete="email"
            isInvalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
          <Input
            id={passwordInputId}
            label="Password"
            name="password"
            type="password"
            isRequired
            isDisabled={success}
            isReadOnly={submitting}
            value={password}
            onChange={setPassword}
            placeholder="your password"
            autoComplete="new-password"
            minLength={8}
            validate={validatePassword}
            helperText="At least 8 characters, including one number"
            isInvalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
          <Button
            type="submit"
            variant="filled"
            isDisabled={submitting || success}
            className={styles.submit}
          >
            {submitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <div className={styles.signUp}>
          <span>Already have an account?</span>
          <Link href="/login" className={styles.signUpLink}>Sign in</Link>
        </div>
        <p className={styles.demoPassword}><strong>Password demo:</strong> password123</p>
      </section>
    </div>
  );
}