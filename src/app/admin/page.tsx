
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiService } from '@/services/api';
import AdminDashboardClient from '@/components/AdminDashboardClient';
import { AppointmentSlot } from '@/types';
import { DEFAULT_DEMO_PATH, DEFAULT_DEMO_SLUG } from '@/config/app';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('turnovivo_token')?.value;

  if (!token) {
    redirect('/login?next=%2Fadmin');
  }

  let role = '';
  let userEmail = '';

  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    userEmail = payload.email;
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
    <section className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center pb-12 select-none" aria-labelledby="admin-page-title">
      <nav aria-label="Navegacion del panel administrador" className="w-full bg-zinc-900/60 border-b border-zinc-800 py-4 px-6 flex justify-between items-center max-w-7xl mx-auto rounded-b-xl mb-8">
        <div className="flex items-center gap-3">
          <span className="text-amber-500 font-black text-xl tracking-tighter">TurnoVivo</span>
          <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md font-mono font-bold">PANEL CONTROL ADMIN</span>
        </div>
        <div className="text-xs text-zinc-400">
          Operador: <span className="text-zinc-200 font-medium">{userEmail}</span>
        </div>
      </nav>

      <div className="w-full max-w-5xl px-4">
        <header className="mb-8">
          <h1 id="admin-page-title" className="text-3xl font-black text-zinc-100 tracking-tight">Consola de Operaciones</h1>
          <p className="text-xs text-zinc-400 mt-1">Cancela citas en tiempo real para observar el comportamiento de la cascada de Redis.</p>
        </header>
        <AdminDashboardClient initialSlots={slots} businessId={businessId} token={token} />
      </div>
    </section>
  );
}
