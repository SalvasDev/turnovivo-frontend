'use client';

import { useState, type FormEvent } from 'react';
import { Button, FormModal, Input, Toast } from '@/design-system';
import styles from './BusinessForms.module.css';

export interface AdminFormValues {
  email: string;
  password: string;
}

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: AdminFormValues) => Promise<void>;
}

export function validateAdminPassword(value: string) {
  return value.length >= 8 && /[0-9]/.test(value)
    ? null : 'Use at least 8 characters, including one number.';
}

export function CreateAdminModal({ isOpen, onClose, onSubmit }: CreateAdminModalProps) {
  const [values, setValues] = useState<AdminFormValues>({ email: '', password: '' });
  const [pending, setPending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const passwordError = validateAdminPassword(values.password);
    if (passwordError) { setPasswordError(passwordError); return; }
    setPending(true);
    setEmailError(null);
    setPasswordError(null);
    setFormError(null);
    try {
      await onSubmit({ email: values.email.trim(), password: values.password });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create the administrator.';
      if (/e-?mail/i.test(message)) setEmailError(message);
      else if (/password/i.test(message)) setPasswordError(message);
      else setFormError(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <FormModal isOpen={isOpen} title="New admin" onClose={onClose} isPending={pending}>
      <form className={styles.form} aria-label="New admin" aria-busy={pending} onSubmit={handleSubmit}>
        {formError && <Toast variant="error" isDismissible={false}>{formError}</Toast>}
        <Input autoFocus label="Email" name="email" type="email" isRequired value={values.email} onChange={email => { setValues(previous => ({ ...previous, email })); setEmailError(null); setFormError(null); }} placeholder="admin@company.com" autoComplete="email" isReadOnly={pending} isInvalid={!!emailError} errorMessage={emailError} />
        <Input label="Password" name="password" type="password" isRequired value={values.password} onChange={password => { setValues(previous => ({ ...previous, password })); setPasswordError(null); setFormError(null); }} placeholder="your password" autoComplete="new-password" minLength={8} validate={validateAdminPassword} helperText="At least 8 characters, including one number" isReadOnly={pending} isInvalid={!!passwordError} errorMessage={passwordError} />
        <Button type="submit" className={styles.submit} isDisabled={pending} isPending={pending}>
          {pending ? 'Creating admin...' : 'Create admin'}
        </Button>
      </form>
    </FormModal>
  );
}