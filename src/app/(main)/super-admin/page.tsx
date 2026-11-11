import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SuperAdminBusinessesClient from '@/components/super-admin/super-admin-business-client';
import { DEFAULT_DEMO_PATH } from '@/config/app';
import { ApiError, createSessionExpiredLoginUrl, fetchApi, requireValid } from '@/services/api';
import { parseAdminUsers, parseBusinessAdmins, parseTokenClaims } from '@/services/api-parsers';
import type { AdminUser, BusinessAdmin } from '@/types';

const authInit = (token: string): RequestInit => ({
  headers: { Authorization: `Bearer ${token}` },
  cache: 'no-store',
});

export default async function SuperAdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('turnovivo_token')?.value;

  if (!token) {
    redirect('/login?next=%2Fsuper-admin');
  }

  const claims = parseTokenClaims(token);
  if (!claims) {
    redirect('/login?next=%2Fsuper-admin');
  }

  if (claims.role !== 'SUPER_ADMIN') {
    redirect(DEFAULT_DEMO_PATH);
  }

  // Failures reach the route error boundary instead of looking like an empty directory.
  let initialBusinesses: BusinessAdmin[];
  let initialAdmins: AdminUser[];
  try {
    [initialBusinesses, initialAdmins] = await Promise.all([
      fetchApi('/businesses', authInit(token)).then(payload => requireValid(parseBusinessAdmins(payload))),
      fetchApi('/admin/users?role=ADMIN', authInit(token)).then(payload => requireValid(parseAdminUsers(payload))),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect(createSessionExpiredLoginUrl('/super-admin'));
    }
    throw error;
  }

  return (
    <SuperAdminBusinessesClient
      token={token}
      initialBusinesses={initialBusinesses}
      initialAdmins={initialAdmins}
    />
  );
}
