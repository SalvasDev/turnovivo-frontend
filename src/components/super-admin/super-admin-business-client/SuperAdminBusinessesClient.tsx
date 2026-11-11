'use client';

import { useState } from 'react';
import { Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';
import { useUI } from '@/context/UIContext';
import { useSuperAdminDirectory } from '@/hooks/useSuperAdminDirectory';
import { getErrorMessage } from '@/services/http-client';
import { Badge, Button, Icon, Table, type TableColumn } from '@/design-system';
import {
  CreateAdminModal,
  CreateBusinessModal,
  type AdminFormValues,
  type BusinessFormValues,
} from '../business-forms';
import styles from './SuperAdminBusinessesClient.module.css';
import type { AdminUser, BusinessAdmin } from '@/types';

export type { AdminUser, BusinessAdmin } from '@/types';

interface SuperAdminBusinessesClientProps {
  initialBusinesses: BusinessAdmin[];
  initialAdmins: AdminUser[];
}

export default function SuperAdminBusinessesClient({
  initialBusinesses,
  initialAdmins,
}: SuperAdminBusinessesClientProps) {
  const { success, error, loading, confirm } = useUI();
  const directory = useSuperAdminDirectory(initialBusinesses, initialAdmins);
  const { businesses, admins } = directory;
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState<'admin' | 'company' | null>(null);
  const [editingBusiness, setEditingBusiness] = useState<BusinessAdmin | undefined>();

  const refresh = async () => {
    try {
      await directory.refresh();
    } catch (err: unknown) {
      error(getErrorMessage(err, 'Unable to load the latest data.'));
    }
  };

  const registerAdmin = (values: AdminFormValues) => directory.createAdmin(values.email.trim(), values.password);

  const handleCreateAdmin = async (values: AdminFormValues) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await registerAdmin(values);
      success('Admin created.');
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
      await directory.saveBusiness({
        id: editingBusiness?.id,
        name: values.name.trim(),
        slug: values.slug.trim(),
        ownerId,
      });
      success(editingBusiness ? 'Company updated.' : 'Company created.');
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
    let stopLoadingToast: (() => void) | undefined;
    try {
      const confirmed = await confirm({
        title: activate ? 'Reactivate company' : 'Deactivate company',
        description: activate
          ? `Reactivate "${business.name}"? It will be visible and bookable again.`
          : `Deactivate "${business.name}"? It will no longer be visible or bookable to the public.`,
        confirmText: activate ? 'Yes, reactivate' : 'Yes, deactivate',
        cancelText: 'Go back',
        tone: activate ? 'default' : 'danger',
      });
      if (!confirmed) {
        return;
      }

      stopLoadingToast = loading(activate ? 'Reactivating company...' : 'Deactivating company...');
      await directory.setBusinessActive(business, activate);
      success(activate ? 'Company reactivated.' : 'Company deactivated.');
      await refresh();
    } catch (err: unknown) {
      error(getErrorMessage(err, 'Unable to update the company status.'));
    } finally {
      stopLoadingToast?.();
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
          <Button iconOnly variant="text" color="neutral" size="small" aria-label={`Actions for ${business.name}`} isDisabled={submitting}>
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
    <section className={styles.page} aria-labelledby="super-admin-title">
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 id="super-admin-title" className={styles.title}>Platform companies</h1>
          <p className={styles.description}>Create and manage registered businesses. Each company requires an admin user.</p>
        </header>
        <div className={styles.toolbar}>
          <Button variant="outlined" color="neutral" className={`${styles.action} ${styles.secondaryAction}`} startIcon={<Icon name="add" />} isDisabled={submitting} onPress={() => setModal('admin')}>Add admin</Button>
          <Button className={styles.action} startIcon={<Icon name="add" />} isDisabled={submitting} onPress={() => { setEditingBusiness(undefined); setModal('company'); }}>Add company</Button>
        </div>
        <Table caption="Platform companies" columns={columns} items={businesses} getRowId={business => business.id} emptyMessage="No companies registered yet." className={styles.table} aria-busy={submitting} />
      </div>
      {modal === 'admin' && <CreateAdminModal isOpen onClose={() => setModal(null)} onSubmit={handleCreateAdmin} />}
      {modal === 'company' && <CreateBusinessModal isOpen admins={admins} business={editingBusiness} onClose={() => { setModal(null); setEditingBusiness(undefined); }} onSubmit={handleSaveBusiness} />}
    </section>
  );
}
