
import { apiService } from '@/services/api';
import { AppointmentGrid } from '@/components/appointment-grid';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AppointmentSlot, Business } from '@/types';
import styles from './page.module.css';

export const dynamic = 'force-dynamic'; 

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BusinessPage({ params }: PageProps) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('turnovivo_token')?.value;

  if (!token) {
    redirect(`/login?next=${encodeURIComponent(`/${slug}`)}`);
  }

  let currentUserId = '';
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    currentUserId = payload.sub;
  } catch {
    redirect(`/login?next=${encodeURIComponent(`/${slug}`)}`);
  }

  let business: Business;
  let availableSlots: AppointmentSlot[] = [];

  try {
    business = await apiService.getBusinessBySlug(slug);
    availableSlots = await apiService.getAvailableSlots(business.id);
  } catch {
    return notFound();
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
          />
        </section>
      </div>
    </section>
  );
}
