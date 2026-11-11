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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const passwordError = validateAdminPassword(values.password);
    if (passwordError) { setError(passwordError); return; }
    setPending(true);
    setError(null);
    try {
      await onSubmit({ email: values.email.trim(), password: values.password });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not create the administrator.');
    } finally {
      setPending(false);
    }
  };

  return (
    <FormModal isOpen={isOpen} title="New admin" onClose={onClose} isPending={pending}>
      <form className={styles.form} aria-label="New admin" aria-busy={pending} onSubmit={handleSubmit} lang="en">
        {error && <Toast variant="error" isDismissible={false}>{error}</Toast>}
        <Input autoFocus label="Email" name="email" type="email" isRequired value={values.email} onChange={email => setValues(previous => ({ ...previous, email }))} placeholder="admin@company.com" autoComplete="email" isReadOnly={pending} />
        <Input label="Password" name="password" type="password" isRequired value={values.password} onChange={password => setValues(previous => ({ ...previous, password }))} placeholder="your password" autoComplete="new-password" minLength={8} validate={validateAdminPassword} helperText="At least 8 characters, including one number" isReadOnly={pending} />
        <Button type="submit" className={styles.submit} isDisabled={pending} isPending={pending}>
          {pending ? 'Creating admin...' : 'Create admin'}
        </Button>
      </form>
    </FormModal>
  );
}