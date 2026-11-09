
import { apiService } from '@/services/api';
import AppointmentGrid from '@/components/AppointmentGrid';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AppointmentSlot, Business } from '@/types';

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
    <section className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center pb-12 select-none" aria-labelledby="business-page-title">
      <div className="w-full max-w-4xl px-4 pt-8">
        <header className="border-b border-zinc-800 pb-6 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest font-semibold text-emerald-500">
              Establecimiento Verificado
            </span>
            <h1 id="business-page-title" className="text-3xl font-extrabold tracking-tight mt-1 text-zinc-100 sm:text-4xl">
              {business.name}
            </h1>
          </div>
        </header>
        <section className="mt-8" aria-labelledby="available-slots-title">
          <h2 id="available-slots-title" className="text-xl font-bold text-zinc-200">Horarios Disponibles para Hoy</h2>
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
