import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SuperAdminBusinessesClient, {
  type AdminUser,
  type BusinessAdmin,
} from '@/components/super-admin/super-admin-business-client';
import { DEFAULT_DEMO_PATH } from '@/config/app';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function fetchJson<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export default async function SuperAdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('turnovivo_token')?.value;

  if (!token) {
    redirect('/login?next=%2Fsuper-admin');
  }

  let role = '';
  let userEmail = '';

  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    userEmail = payload.email;
    role = payload.role;
  } catch {
    redirect('/login?next=%2Fsuper-admin');
  }

  if (role !== 'SUPER_ADMIN') {
    redirect(DEFAULT_DEMO_PATH);
  }

  let initialBusinesses: BusinessAdmin[] = [];
  let initialAdmins: AdminUser[] = [];

  try {
    [initialBusinesses, initialAdmins] = await Promise.all([
      fetchJson<BusinessAdmin[]>('/businesses', token),
      fetchJson<AdminUser[]>('/admin/users?role=ADMIN', token),
    ]);
  } catch {
    initialBusinesses = [];
    initialAdmins = [];
  }

  return (
    <SuperAdminBusinessesClient
      token={token}
      userEmail={userEmail}
      initialBusinesses={initialBusinesses}
      initialAdmins={initialAdmins}
    />
  );
}
