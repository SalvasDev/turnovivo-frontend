'use client';

import Link from 'next/link';
import { useState } from 'react';
import { apiService } from '@/services/api';
import { getErrorMessage } from '@/services/http-client';
import { Button, Input } from '@/design-system';
import styles from '@/design-system/layouts/AuthLayout.module.css';
import { getEmailError, getPasswordError, getServerErrorField } from '@/domain/validation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const emailInputId = 'register-email';
  const passwordInputId = 'register-password';
  const errorId = 'register-error-message';
  const successId = 'register-success-message';

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError(null);
    setFormError(null);
  };
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || success) return;
    const nextEmailError = getEmailError(email);
    const nextPasswordError = getPasswordError(password);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setFormError(null);
    if (nextEmailError || nextPasswordError) {
      // Focus lands on the first invalid field so its linked error is announced.
      document.getElementById(nextEmailError ? emailInputId : passwordInputId)?.focus();
      return;
    }
    setSubmitting(true);

    try {
      await apiService.registerCustomer(email, password);

      setSuccess(true);
      setTimeout(() => {
        window.location.assign('/login');
      }, 2000);

    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Unable to create your account. Please try again.');
      setFormError(message);
      const field = getServerErrorField(message, ['email', 'password'] as const);
      if (field === 'email') setEmailError(message);
      else if (field === 'password') setPasswordError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.card} aria-labelledby="register-title">
        <Link href="/" className={styles.brand} aria-label="TurnoVivo home">TURNOVIVO</Link>
        <header className={styles.header}>
          <h1 id="register-title" className={styles.title}>Create your account</h1>
          <p className={styles.description}>Register to book your appointments in real time</p>
        </header>

        {formError && (
          <div id={errorId} role="alert" className={styles.error}>
            {formError}
          </div>
        )}

        {success && (
          <div id={successId} role="status" aria-live="polite" className={styles.success}>
            Account created successfully! Redirecting to sign in...
          </div>
        )}

        <form
          noValidate
          onSubmit={handleSubmit}
          className={styles.form}
          aria-labelledby="register-title"
          aria-busy={submitting}
          aria-describedby={formError ? errorId : success ? successId : undefined}
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
            onChange={handleEmailChange}
            placeholder="name@company.com"
            autoComplete="email"
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
            isDisabled={success}
            isReadOnly={submitting}
            value={password}
            onChange={handlePasswordChange}
            placeholder="your password"
            autoComplete="new-password"
            minLength={8}
            helperText="At least 8 characters, including one number"
            isInvalid={!!passwordError}
            errorMessage={passwordError}
            onBlur={() => setPasswordError(getPasswordError(password))}
          />
          <Button
            type="submit"
            variant="filled"
            isDisabled={submitting || success}
            isPending={submitting}
            pendingLabel="Creating account"
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