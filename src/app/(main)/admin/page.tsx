import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiService } from '@/services/api';

import { AppointmentSlot } from '@/types';
import { DEFAULT_DEMO_PATH, DEFAULT_DEMO_SLUG } from '@/config/app';
import styles from './page.module.css';
import { AdminDashboardClient } from '@/components/admin-dashboard-client';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('turnovivo_token')?.value;

  if (!token) {
    redirect('/login?next=%2Fadmin');
  }

  let role = '';

  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    role = payload.role;
  } catch {
    redirect('/login?next=%2Fadmin');
  }

  if (role !== 'ADMIN' && role !== 'STAFF') {
    redirect(DEFAULT_DEMO_PATH);
  }

  let slots: AppointmentSlot[] = [];
  let businessId = '';
  
  try {
    const business = await apiService.getBusinessBySlug(DEFAULT_DEMO_SLUG);
    businessId = business.id;
    slots = await apiService.getAvailableSlots(businessId);
  } catch {
    slots = [];
  }

  return (
    <section className={styles.page} aria-labelledby="admin-page-title">
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 id="admin-page-title" className={styles.title} lang="en">Operations console</h1>
          <p className={styles.description}>Cancela citas en tiempo real para observar el comportamiento de la cascada de Redis.</p>
        </header>
        <AdminDashboardClient initialSlots={slots} businessId={businessId} token={token} />
      </div>
    </section>
  );
}
