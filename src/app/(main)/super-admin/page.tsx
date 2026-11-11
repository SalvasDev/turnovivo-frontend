import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SuperAdminBusinessesClient, {
  type AdminUser,
  type BusinessAdmin,
} from '@/components/super-admin/super-admin-business-client';
import { DEFAULT_DEMO_PATH } from '@/config/app';
import { ApiError, createSessionExpiredLoginUrl, fetchApi, requireValid } from '@/services/api';
import { parseAdminUsers, parseBusinessAdmins } from '@/services/api-parsers';

const authInit = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
  cache: 'no-store' as const,
});

export default async function SuperAdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('turnovivo_token')?.value;

  if (!token) {
    redirect('/login?next=%2Fsuper-admin');
  }

  let role = '';

  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    role = payload.role;
  } catch {
    redirect('/login?next=%2Fsuper-admin');
  }

  if (role !== 'SUPER_ADMIN') {
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
