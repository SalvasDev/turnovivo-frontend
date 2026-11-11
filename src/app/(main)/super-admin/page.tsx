import { redirect } from 'next/navigation';
import SuperAdminBusinessesClient from '@/components/super-admin/super-admin-business-client';
import { isSuperAdmin, SUPER_ADMIN_PATH } from '@/domain/access';
import { ApiError, apiService, createSessionExpiredLoginUrl } from '@/services/api';
import { requireSession } from '@/services/server-session';
import type { AdminUser, BusinessAdmin } from '@/types';

export default async function SuperAdminPage() {
  const { token } = await requireSession(SUPER_ADMIN_PATH, isSuperAdmin);

  // Failures reach the route error boundary instead of looking like an empty directory.
  let initialBusinesses: BusinessAdmin[];
  let initialAdmins: AdminUser[];
  try {
    [initialBusinesses, initialAdmins] = await Promise.all([
      apiService.listBusinesses({ token }),
      apiService.listAdmins({ token }),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect(createSessionExpiredLoginUrl(SUPER_ADMIN_PATH));
    }
    throw error;
  }

  return (
    <SuperAdminBusinessesClient
      initialBusinesses={initialBusinesses}
      initialAdmins={initialAdmins}
    />
  );
}
