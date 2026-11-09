'use client';

import { useState, useEffect } from 'react';
import { SlotStatus } from '@/types';
import { useUI } from '@/context/UIContext';
import { apiService, ApiMessage } from '@/services/api';

interface AdminSlot {
  id: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  appointment?: {
    id?: string;
    customerId?: string;
  } | null;
}

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

interface AdminDashboardClientProps {
  initialSlots: AdminSlot[];
  businessId: string;
  token: string;
}

export default function AdminDashboardClient({ initialSlots, businessId, token }: AdminDashboardClientProps) {
  const { success, error, loading, confirm } = useUI();
  const [slots, setSlots] = useState<AdminSlot[]>(initialSlots);
  const [loadingSlotId, setLoadingSlotId] = useState<string | null>(null);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const freshSlots = (await apiService.getAvailableSlots(businessId, token)) as AdminSlot[];
        setSlots(freshSlots);
      } catch (err: unknown) {
        console.error('Error de red en sondeo de administración:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [businessId, token]);
  const handleForceCancel = async (slot: AdminSlot) => {
    const appointmentId = slot.appointment?.id;

    if (!appointmentId) {
      error('Este bloque horario no tiene ninguna cita agendada activa.');
      return;
    }

    const shouldForceCancel = await confirm({
      title: 'Forzar cancelacion',
      description: `Estas seguro de forzar la cancelacion del turno de las ${formatTime(slot.startTime)}? Esto liberara el espacio o activara la cascada de Redis.`,
      confirmText: 'Si, cancelar',
      cancelText: 'No, volver',
      tone: 'danger',
    });

    if (!shouldForceCancel) {
      return;
    }

    setLoadingSlotId(slot.id);
    const stopLoadingToast = loading('Procesando cancelacion administrativa...');
    try {
      const data = (await apiService.cancelAppointment(appointmentId, token)) as ApiMessage;

      success(`Turno cancelado por administracion. ${data.message}`);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Hubo un problema al cancelar el turno.');
      error(message);
    } finally {
      stopLoadingToast();
      setLoadingSlotId(null);
    }
  };

  return (
    <section className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mt-6 shadow-xl" aria-label="Tabla de control de turnos">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <caption className="sr-only">Estado operativo de turnos y controles de cancelación administrativa</caption>
          <thead>
            <tr className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider">
              <th scope="col" className="py-4 px-6">Bloque de Trabajo</th>
              <th scope="col" className="py-4 px-6">Estado en Sistema</th>
              <th scope="col" className="py-4 px-6">ID del Cliente</th>
              <th scope="col" className="py-4 px-6 text-right">Controles Operativos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-sm text-zinc-300" aria-live="polite">
            {slots.map((slot) => {
              const hasActiveCita = !!slot.appointment;
              const isHold = slot.status === 'HOLD';

              return (
                <tr key={slot.id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-zinc-100">
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md
                      ${slot.status === 'AVAILABLE' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : isHold 
                          ? 'bg-amber-500/10 text-amber-400 animate-pulse border border-amber-500/20' 
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                      {slot.status === 'AVAILABLE' ? 'Libre' : isHold ? 'Hold Activo' : 'Reservado'}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-zinc-500">
                    {slot.appointment?.customerId || (isHold ? 'Asignando vacante...' : '—')}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      type="button"
                      disabled={loadingSlotId !== null || !hasActiveCita || isHold}
                      onClick={() => handleForceCancel(slot)}
                      aria-label={`Forzar cancelacion del turno ${formatTime(slot.startTime)}`}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200
                        ${hasActiveCita && !isHold
                          ? 'bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-400 hover:text-zinc-950 shadow-sm'
                          : 'bg-zinc-950 text-zinc-600 border border-zinc-800/40 cursor-not-allowed'
                        }`}
                    >
                      {loadingSlotId === slot.id ? (
                        <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin mx-auto" aria-hidden="true"></div>
                      ) : (
                        'Forzar Cancelación'
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

