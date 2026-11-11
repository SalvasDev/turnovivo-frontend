'use client';

import { useState, type FormEvent } from 'react';
import { Button, FormModal, Input, Select, Toast } from '@/design-system';
import { validateAdminPassword, type AdminFormValues } from './CreateAdminModal';
import styles from './BusinessForms.module.css';
import { AdminUser, BusinessAdmin } from '../super-admin-business-client/SuperAdminBusinessesClient';

export interface BusinessFormValues {
  name: string;
  slug: string;
  ownerId: string;
  newOwner?: AdminFormValues;
}

interface CreateBusinessModalProps {
  isOpen: boolean;
  admins: readonly AdminUser[];
  business?: BusinessAdmin;
  onClose: () => void;
  onSubmit: (values: BusinessFormValues) => Promise<void>;
}

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function CreateBusinessModal({ isOpen, admins, business, onClose, onSubmit }: CreateBusinessModalProps) {
  const [values, setValues] = useState<BusinessFormValues>({ name: business?.name ?? '', slug: business?.slug ?? '', ownerId: business?.ownerId ?? '' });
  const [slugTouched, setSlugTouched] = useState(!!business);
  const [newOwnerMode, setNewOwnerMode] = useState(false);
  const [newOwner, setNewOwner] = useState<AdminFormValues>({ email: '', password: '' });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const title = business ? 'Edit company' : 'New company';
  const ownerToggle = (
    <Button
      type="button"
      slot={null}
      variant="text"
      className={styles.toggle}
      aria-label={newOwnerMode ? 'Choose existing admin' : 'Create a new owner'}
      isDisabled={pending}
      onPress={() => setNewOwnerMode(previous => !previous)}
    >
      {newOwnerMode ? 'Choose existing admin' : 'New admin'}
    </Button>
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    if (values.name.trim().length < 3) { setError('Use at least 3 characters for the company name.'); return; }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) { setError('Use lowercase letters, numbers and hyphens for the slug.'); return; }
    if (!newOwnerMode && !values.ownerId) { setError('Select an administrator for the company.'); return; }
    if (newOwnerMode) {
      const passwordError = validateAdminPassword(newOwner.password);
      if (passwordError) { setError(passwordError); return; }
    }
    setPending(true);
    setError(null);
    try {
      await onSubmit({ ...values, name: values.name.trim(), slug: values.slug.trim(), newOwner: newOwnerMode ? { ...newOwner, email: newOwner.email.trim() } : undefined });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not save the company.');
    } finally {
      setPending(false);
    }
  };

  return (
    <FormModal isOpen={isOpen} title={title} onClose={onClose} isPending={pending}>
      <form className={styles.form} aria-label={title} aria-busy={pending} onSubmit={handleSubmit} lang="en">
        {error && <Toast variant="error" isDismissible={false}>{error}</Toast>}
        <Input autoFocus label="Name" name="name" isRequired minLength={3} value={values.name} onChange={name => setValues(previous => ({ ...previous, name, slug: slugTouched ? previous.slug : slugify(name) }))} placeholder="Premium barber" isReadOnly={pending} />
        <Input label="SLUG URL" name="slug" isRequired value={values.slug} onChange={slug => { setSlugTouched(true); setValues(previous => ({ ...previous, slug })); }} placeholder="barberia-premium" isReadOnly={pending} />
        <div className={styles.ownerFields}>
          {newOwnerMode && <div className={styles.ownerHeader}>{ownerToggle}</div>}
          {newOwnerMode ? (
            <>
              <Input label="Admin email" type="email" name="admin-email" isRequired value={newOwner.email} onChange={email => setNewOwner(previous => ({ ...previous, email }))} placeholder="admin@company.com" autoComplete="email" isReadOnly={pending} />
              <Input label="Admin password" type="password" name="admin-password" isRequired value={newOwner.password} onChange={password => setNewOwner(previous => ({ ...previous, password }))} placeholder="your password" autoComplete="new-password" minLength={8} validate={validateAdminPassword} helperText="At least 8 characters, including one number" isReadOnly={pending} />
            </>
          ) : (
            <Select
              label="OWNER ADMIN"
              labelAction={ownerToggle}
              name="ownerId"
              placeholder="Select an admin"
              isRequired
              selectedKey={values.ownerId || null}
              onSelectionChange={key => setValues(previous => ({ ...previous, ownerId: key == null ? '' : String(key) }))}
              options={admins.map(admin => ({ id: admin.id, label: admin.email }))}
              isDisabled={pending || admins.length === 0}
              helperText={admins.length === 0 ? 'No administrators available. Create one to assign an owner.' : undefined}
            />
          )}
        </div>
        <Button type="submit" className={styles.submit} isDisabled={pending} isPending={pending}>
          {pending ? 'Saving...' : business ? 'Save changes' : 'Create company'}
        </Button>
      </form>
    </FormModal>
  );
}