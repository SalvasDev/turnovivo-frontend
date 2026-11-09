'use client';

import { useState, useEffect } from 'react';
import { AppointmentSlot } from '@/types';
import Cookies from 'js-cookie';
import { useUI } from '@/context/UIContext';
import SlotCard from './appointment-grid/SlotCard';
import HoldOfferModal from './appointment-grid/HoldOfferModal';
import { apiService, BookResponse } from '@/services/api';

interface AppointmentGridProps {
  initialSlots: AppointmentSlot[];
  businessId: string;
  serverUserId: string;
}

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export default function AppointmentGrid({ initialSlots, businessId, serverUserId }: AppointmentGridProps) {
  const { success, error, info, warning, loading, confirm } = useUI();
  const [slots, setSlots] = useState<AppointmentSlot[]>(initialSlots);
  const [isSyncing, setIsSyncing] = useState(initialSlots.length === 0);
  const [loadingSlotId, setLoadingSlotId] = useState<string | null>(null);
  const [activeHoldSlot, setActiveHoldSlot] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(30);
  const [rejectedSlotIds, setRejectedSlotIds] = useState<string[]>([]);
  const [localBlocks, setLocalBlocks] = useState<Record<string, 'CANCELLED' | 'DECLINED'>>({});
  const initialBookedSlot = initialSlots.find((s) => s.appointment?.customerId === serverUserId);

  const [myBookedSlotId, setMyBookedSlotId] = useState<string | null>(initialBookedSlot ? initialBookedSlot.id : null);
  const [myWaitlistSlotIds, setMyWaitlistSlotIds] = useState<string[]>([]);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDateHeader = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const getDateKey = (isoString: string) => {
    return new Date(isoString).toISOString().split('T')[0];
  };

  const groupedSlots = slots.reduce((acc, slot) => {
    const dateKey = getDateKey(slot.startTime);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, AppointmentSlot[]>);

  const sortedDates = Object.keys(groupedSlots).sort();
  useEffect(() => {
    const fetchFreshData = async () => {
      try {
        const freshSlots = await apiService.getAvailableSlots(businessId);
        setSlots(freshSlots);
        const freshMine = freshSlots.find((s) => s.appointment?.customerId === serverUserId);
        if (freshMine) {
          setMyBookedSlotId(freshMine.id);
        } else if (myBookedSlotId && !freshSlots.find((s) => s.id === myBookedSlotId && s.appointment?.customerId === serverUserId)) {
          setMyBookedSlotId(null);
        }
        const myHold = freshSlots.find(
          (s) => s.status === 'HOLD' && s.appointment?.customerId === serverUserId,
        );
        if (myHold) {
          if (!activeHoldSlot && !rejectedSlotIds.includes(myHold.id)) {
            setActiveHoldSlot(myHold.id);
            setCountdown(30);
          }
        } else {
          setActiveHoldSlot(null);
        }

      } catch (err) {
        console.error('Error de red en sondeo:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    void fetchFreshData();
    const interval = setInterval(fetchFreshData, 3000);
    return () => clearInterval(interval);
  }, [businessId, activeHoldSlot, serverUserId, myBookedSlotId, rejectedSlotIds]);
  useEffect(() => {
    if (!activeHoldSlot) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setRejectedSlotIds((prevList) => [...prevList, activeHoldSlot]);
          setLocalBlocks((prevB) => ({ ...prevB, [activeHoldSlot]: 'DECLINED' }));
          setMyWaitlistSlotIds((prevW) => prevW.filter((id) => id !== activeHoldSlot));
          setActiveHoldSlot(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeHoldSlot]);

  const handleSlotAction = async (slot: AppointmentSlot) => {
    const token = Cookies.get('turnovivo_token');
    if (!token) {
      info('Debes iniciar sesion para realizar esta accion.');
      window.location.assign('/login');
      return;
    }

    const isAvailable = slot.status === 'AVAILABLE';

    if (isAvailable && myBookedSlotId !== null) {
      warning('Politica de la empresa: solo puedes tener una reserva activa a la vez.');
      return;
    }

    setLoadingSlotId(slot.id);
    const stopLoadingToast = loading(
      isAvailable ? 'Reservando turno...' : 'Uniendote a la lista de espera...',
    );

    try {
      const data = isAvailable
        ? await apiService.bookAppointment(slot.id, token)
        : await apiService.joinWaitlist(slot.id, token);

      if (isAvailable) {
        const bookingData = data as BookResponse;
        success('Cita agendada con exito.');
        setMyBookedSlotId(slot.id);
        setSlots((prev) => 
          prev.map((s) => 
            s.id === slot.id 
              ? { ...s, status: 'RESERVED', appointment: { id: bookingData.id, customerId: bookingData.customerId } } 
              : s
          )
        );
      } else {
        success('Te has unido con exito a la lista de espera de este horario.');
        setMyWaitlistSlotIds((prev) => [...prev, slot.id]);
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Hubo un problema en la transaccion.');
      error(message);
    } finally {
      stopLoadingToast();
      setLoadingSlotId(null);
    }
  };
  const handleCancelAppointment = async (slot: AppointmentSlot) => {
    const token = Cookies.get('turnovivo_token');
    const appointmentId = slot.appointment?.id;

    if (!appointmentId) {
      error('No se detecto ninguna cita activa vinculada para cancelar.');
      return;
    }

    const shouldCancel = await confirm({
      title: 'Cancelar cita',
      description: 'Seguro que deseas cancelar tu cita? Tu espacio se liberara.',
      confirmText: 'Si, cancelar',
      cancelText: 'Volver',
      tone: 'danger',
    });

    if (!shouldCancel) {
      return;
    }

    setLoadingSlotId(slot.id);
    try {
      await apiService.cancelAppointment(appointmentId, token || '');

      success('Tu cita ha sido cancelada exitosamente.');
      setMyBookedSlotId(null);
      setLocalBlocks((prev) => ({ ...prev, [slot.id]: 'CANCELLED' }));
      setSlots((prev) => 
        prev.map((s) => 
          s.id === slot.id 
            ? { ...s, appointment: null } 
            : s
        )
      );
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error al cancelar.');
      error(message);
    } finally {
      setLoadingSlotId(null);
    }
  };
  const handleLeaveWaitlist = async (slotId: string) => {
    const token = Cookies.get('turnovivo_token');

    const shouldLeave = await confirm({
      title: 'Salir de la fila',
      description: 'Deseas salir de la lista de espera para este horario? Perderas tu lugar en la fila.',
      confirmText: 'Si, salir',
      cancelText: 'Continuar en fila',
      tone: 'danger',
    });

    if (!shouldLeave) {
      return;
    }

    setLoadingSlotId(slotId);
    try {
      await apiService.leaveWaitlist(slotId, token || '');

      success('Has salido de la fila de espera.');
      setMyWaitlistSlotIds((prev) => prev.filter((id) => id !== slotId));
      setLocalBlocks((prev) => ({ ...prev, [slotId]: 'DECLINED' }));
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error al salir de la lista.');
      error(message);
    } finally {
      setLoadingSlotId(null);
    }
  };

  const handleConfirmHold = async () => {
    const token = Cookies.get('turnovivo_token');
    const slotId = activeHoldSlot;
    if (!slotId) return;
    const stopLoadingToast = loading('Reclamando turno...');
    try {
      await apiService.confirmHold(slotId, token || '');
      success('Turno reclamado con exito.');
      setMyBookedSlotId(slotId);
      setMyWaitlistSlotIds((prev) => prev.filter((id) => id !== slotId));
      setActiveHoldSlot(null);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'No se pudo reclamar el turno.');
      error(message);
      setActiveHoldSlot(null);
    } finally {
      stopLoadingToast();
    }
  };
  const handleDeclineHold = async () => {
    const slotId = activeHoldSlot;
    if (!slotId) return;
    setRejectedSlotIds((prev) => [...prev, slotId]);
    setLocalBlocks((prev) => ({ ...prev, [slotId]: 'DECLINED' }));
    setMyWaitlistSlotIds((prev) => prev.filter((id) => id !== slotId));
    setActiveHoldSlot(null);

    const token = Cookies.get('turnovivo_token');
    try {
      await apiService.declineHold(slotId, token || '');
    } catch (error) {
      console.error('Error al rechazar el turno:', error);
    }
  };

  if (!slots || slots.length === 0) {
    return (
      <div role="status" aria-live="polite" className="text-center py-12 bg-zinc-900 rounded-xl border border-zinc-800 mt-8">
        <p className="text-zinc-400 font-medium">
          {isSyncing
            ? 'Sincronizando la agenda con el servidor...'
            : 'No hay horarios disponibles por ahora. Si es entorno local, ejecuta el seed para regenerar turnos demo.'}
        </p>
      </div>
    );
  }

  return (
    <section className="mt-8 relative" aria-label="Grilla de turnos disponibles">
      <div className="space-y-8">
        {sortedDates.map((dateKey) => (
          <div key={dateKey} className="space-y-3">
            <h3 className="text-lg font-semibold text-white capitalize border-b border-zinc-700 pb-2">
              {formatDateHeader(groupedSlots[dateKey][0].startTime)}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" role="list" aria-live="polite">
              {groupedSlots[dateKey].map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  serverUserId={serverUserId}
                  myBookedSlotId={myBookedSlotId}
                  myWaitlistSlotIds={myWaitlistSlotIds}
                  localBlocks={localBlocks}
                  loadingSlotId={loadingSlotId}
                  formatTime={formatTime}
                  onSlotAction={handleSlotAction}
                  onCancelAppointment={handleCancelAppointment}
                  onLeaveWaitlist={handleLeaveWaitlist}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {activeHoldSlot && (
        <HoldOfferModal
          countdown={countdown}
          onDecline={handleDeclineHold}
          onConfirm={handleConfirmHold}
        />
      )}
    </section>
  );
}
