
import { ApiError, apiService } from '@/services/api';
import { requireSession } from '@/services/server-session';
import { AppointmentGrid } from '@/components/appointment-grid';
import { notFound } from 'next/navigation';
import { AppointmentSlot, Business } from '@/types';
import styles from './page.module.css';

export const dynamic = 'force-dynamic'; 

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BusinessPage({ params }: PageProps) {
  const { slug } = await params;
  const { claims } = await requireSession(`/${slug}`);
  const currentUserId = claims.sub;

  let business: Business;
  let availableSlots: AppointmentSlot[] = [];

  try {
    business = await apiService.getBusinessBySlug(slug);
    availableSlots = await apiService.getAvailableSlots(business.id);
  } catch (error) {
    // Only a missing business is a 404; outages bubble up to the route error boundary.
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <section className={styles.page} aria-labelledby="business-page-title">
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 id="business-page-title" className={styles.title}>
            {business.name}
          </h1>
        </header>
        <section aria-label="Appointment availability">
          <AppointmentGrid 
            initialSlots={availableSlots} 
            businessId={business.id} 
            serverUserId={currentUserId} 
            initialLoadComplete
          />
        </section>
      </div>
    </section>
  );
}
