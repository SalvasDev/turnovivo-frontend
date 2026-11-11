import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiService } from '@/services/api';
import { parseTokenClaims } from '@/services/api-parsers';

import { DEFAULT_DEMO_PATH, DEFAULT_DEMO_SLUG } from '@/config/app';
import styles from './page.module.css';
import { AdminDashboardClient } from '@/components/admin-dashboard-client';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('turnovivo_token')?.value;

  if (!token) {
    redirect('/login?next=%2Fadmin');
  }

  const claims = parseTokenClaims(token);
  if (!claims) {
    redirect('/login?next=%2Fadmin');
  }

  if (claims.role !== 'ADMIN' && claims.role !== 'STAFF') {
    redirect(DEFAULT_DEMO_PATH);
  }

  // Failures reach the route error boundary instead of looking like an empty agenda.
  const business = await apiService.getBusinessBySlug(DEFAULT_DEMO_SLUG);
  const businessId = business.id;
  const slots = await apiService.getAvailableSlots(businessId);

  return (
    <section className={styles.page} aria-labelledby="admin-page-title">
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 id="admin-page-title" className={styles.title}>Operations console</h1>
          <p className={styles.description}>Cancel appointments in real time to watch the Redis waitlist cascade.</p>
        </header>
        <AdminDashboardClient initialSlots={slots} businessId={businessId} token={token} />
      </div>
    </section>
  );
}
