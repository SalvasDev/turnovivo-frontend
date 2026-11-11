'use client';

import { useCallback, useState } from 'react';
import type { AdminUser, BusinessAdmin } from '@/types';
import { apiService, type BusinessInput } from '@/services/api';

const session = { auth: true } as const;

export function useSuperAdminDirectory(initialBusinesses: BusinessAdmin[], initialAdmins: AdminUser[]) {
  const [businesses, setBusinesses] = useState<BusinessAdmin[]>(initialBusinesses);
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);

  const refresh = useCallback(async () => {
    const [freshBusinesses, freshAdmins] = await Promise.all([
      apiService.listBusinesses(session),
      apiService.listAdmins(session),
    ]);
    setBusinesses(freshBusinesses);
    setAdmins(freshAdmins);
  }, []);

  const createAdmin = useCallback(async (email: string, password: string) => {
    const admin = await apiService.createAdmin(email, password);
    setAdmins(previous => [...previous.filter(item => item.id !== admin.id), admin]
      .sort((first, second) => first.email.localeCompare(second.email)));
    return admin;
  }, []);

  const saveBusiness = useCallback((input: BusinessInput) => apiService.saveBusiness(input), []);

  const setBusinessActive = useCallback((business: BusinessAdmin, active: boolean) => (
    active ? apiService.reactivateBusiness(business) : apiService.deactivateBusiness(business.id)
  ), []);

  return { businesses, admins, refresh, createAdmin, saveBusiness, setBusinessActive };
}
