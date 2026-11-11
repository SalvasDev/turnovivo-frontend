import { apiService } from '@/services/api';
import { requireSession } from '@/services/server-session';
import { canAccessAdmin } from '@/domain/access';
import { DEFAULT_DEMO_SLUG } from '@/config/app';
import styles from './page.module.css';
import { AdminDashboardClient } from '@/components/admin-dashboard-client';

export default async function AdminPage() {
  await requireSession('/admin', canAccessAdmin);

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
        <AdminDashboardClient initialSlots={slots} businessId={businessId} />
      </div>
    </section>
  );
}
