'use client';

import { useCallback, useState } from 'react';
import { Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';
import { useUI } from '@/context/UIContext';
import { Badge, Button, Icon, Table, type TableColumn } from '@/design-system';
import { CreateAdminModal, type AdminFormValues } from './super-admin/CreateAdminModal';
import { CreateBusinessModal, type BusinessFormValues } from './super-admin/CreateBusinessModal';
import styles from './SuperAdminBusinessesClient.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface BusinessAdmin {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  ownerEmail: string;
  active: boolean;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = (payload as { message?: string | string[] } | null)?.message;
    throw new Error(
      Array.isArray(message) ? message.join(', ') : message || 'Error en la petición.',
    );
  }

  return payload as T;
}

interface SuperAdminBusinessesClientProps {
  token: string;
  userEmail: string;
  initialBusinesses: BusinessAdmin[];
  initialAdmins: AdminUser[];
}

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export default function SuperAdminBusinessesClient({
  token,
  initialBusinesses,
  initialAdmins,
}: SuperAdminBusinessesClientProps) {
  const { success, error, confirm } = useUI();

  const [businesses, setBusinesses] = useState<BusinessAdmin[]>(initialBusinesses);
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState<'admin' | 'company' | null>(null);
  const [editingBusiness, setEditingBusiness] = useState<BusinessAdmin | undefined>();

  const refresh = useCallback(async () => {
    try {
      const [biz, adm] = await Promise.all([
        apiFetch<BusinessAdmin[]>('/businesses', token, { cache: 'no-store' }),
        apiFetch<AdminUser[]>('/admin/users?role=ADMIN', token, { cache: 'no-store' }),
      ]);
      setBusinesses(biz);
      setAdmins(adm);
    } catch (err: unknown) {
      error(getErrorMessage(err, 'No se pudieron cargar los datos.'));
    }
  }, [token, error]);

  const registerAdmin = async (values: AdminFormValues) => {
    const admin = await apiFetch<AdminUser>('/admin/users', token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: values.email.trim(), password: values.password }),
    });
    setAdmins(previous => [...previous.filter(item => item.id !== admin.id), admin].sort((first, second) => first.email.localeCompare(second.email)));
    return admin;
  };

  const handleCreateAdmin = async (values: AdminFormValues) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await registerAdmin(values);
      success('Administrador creado correctamente.');
      setModal(null);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveBusiness = async (values: BusinessFormValues) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const ownerId = values.newOwner ? (await registerAdmin(values.newOwner)).id : values.ownerId;
      await apiFetch<BusinessAdmin>(editingBusiness ? `/businesses/${editingBusiness.id}` : '/businesses', token, {
        method: editingBusiness ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: values.name.trim(), slug: values.slug.trim(), ownerId }),
      });
      success(editingBusiness ? 'Empresa actualizada correctamente.' : 'Empresa creada correctamente.');
      setModal(null);
      setEditingBusiness(undefined);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (business: BusinessAdmin) => {
    if (submitting) return;
    setSubmitting(true);
    const activate = !business.active;
    try {
      const confirmed = await confirm({
      title: activate ? 'Reactivar empresa' : 'Desactivar empresa',
      description: activate
        ? `¿Reactivar "${business.name}"? Volverá a ser visible y reservable.`
        : `¿Desactivar "${business.name}"? Dejará de ser visible y reservable al público.`,
      confirmText: activate ? 'Sí, reactivar' : 'Sí, desactivar',
      cancelText: 'Volver',
      tone: activate ? 'default' : 'danger',
    });
    if (!confirmed) {
      return;
    }

      if (activate) {
        await apiFetch<BusinessAdmin>(`/businesses/${business.id}`, token, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: business.name,
            slug: business.slug,
            ownerId: business.ownerId,
            active: true,
          }),
        });
      } else {
        await apiFetch<void>(`/businesses/${business.id}`, token, { method: 'DELETE' });
      }
      success(activate ? 'Empresa reactivada.' : 'Empresa desactivada.');
      await refresh();
    } catch (err: unknown) {
      error(getErrorMessage(err, 'No se pudo actualizar el estado.'));
    } finally {
      setSubmitting(false);
    }
  };

  const columns: TableColumn<BusinessAdmin>[] = [
    {
      id: 'company', header: 'Company', isRowHeader: true, width: '33%',
      renderCell: business => (
        <div className={styles.company}>
          <span>{business.name}</span>
          <span className={styles.slug}>/{business.slug}</span>
        </div>
      ),
    },
    {
      id: 'status', header: 'Status', width: '16%',
      renderCell: business => <Badge className={styles.status} color={business.active ? 'success' : 'error'}>{business.active ? 'Active' : 'Inactive'}</Badge>,
    },
    { id: 'owner', header: 'Owner', width: '39%', renderCell: business => <span className={styles.owner}>{business.ownerEmail || '-'}</span> },
    {
      id: 'actions', header: 'Actions', width: '12%',
      renderCell: business => (
        <MenuTrigger>
          <Button variant="text" className={styles.menuTrigger} aria-label={`Actions for ${business.name}`} isDisabled={submitting}>
            <span title="Company actions"><Icon name="moreVertical" /></span>
          </Button>
          <Popover placement="bottom end" offset={8} className={styles.popover}>
            <Menu aria-label={`Actions for ${business.name}`} className={styles.menu}>
              <MenuItem className={styles.menuItem} onAction={() => { setEditingBusiness(business); setModal('company'); }}>Edit company</MenuItem>
              <MenuItem className={`${styles.menuItem} ${business.active ? styles.destructive : ''}`} onAction={() => { void handleToggleActive(business); }}>
                {business.active ? 'Deactivate company' : 'Reactivate company'}
              </MenuItem>
            </Menu>
          </Popover>
        </MenuTrigger>
      ),
    },
  ];

  return (
    <section className={styles.page} aria-labelledby="super-admin-title" lang="en">
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 id="super-admin-title" className={styles.title}>Platform companies</h1>
          <p className={styles.description}>Create and manage registered businesses. Each company requires an admin user.</p>
        </header>
        <div className={styles.toolbar}>
          <Button variant="outlined" className={`${styles.action} ${styles.secondaryAction}`} startIcon={<Icon name="add" />} isDisabled={submitting} onPress={() => setModal('admin')}>Add admin</Button>
          <Button className={styles.action} startIcon={<Icon name="add" />} isDisabled={submitting} onPress={() => { setEditingBusiness(undefined); setModal('company'); }}>Add company</Button>
        </div>
        <Table caption="Platform companies" columns={columns} items={businesses} getRowId={business => business.id} emptyMessage="No companies registered yet." className={styles.table} aria-busy={submitting} />
      </div>
      {modal === 'admin' && <CreateAdminModal isOpen onClose={() => setModal(null)} onSubmit={handleCreateAdmin} />}
      {modal === 'company' && <CreateBusinessModal isOpen admins={admins} business={editingBusiness} onClose={() => { setModal(null); setEditingBusiness(undefined); }} onSubmit={handleSaveBusiness} />}
    </section>
  );
}
