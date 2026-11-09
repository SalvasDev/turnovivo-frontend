import { FC } from 'react';
import { AppointmentSlot } from '@/types';

interface SlotCardProps {
  slot: AppointmentSlot;
  serverUserId: string;
  myBookedSlotId: string | null;
  myWaitlistSlotIds: string[];
  localBlocks: Record<string, 'CANCELLED' | 'DECLINED'>;
  loadingSlotId: string | null;
  formatTime: (isoString: string) => string;
  onSlotAction: (slot: AppointmentSlot) => void;
  onCancelAppointment: (slot: AppointmentSlot) => void;
  onLeaveWaitlist: (slotId: string) => void;
}

const SlotCard: FC<SlotCardProps> = ({
  slot,
  serverUserId,
  myBookedSlotId,
  myWaitlistSlotIds,
  localBlocks,
  loadingSlotId,
  formatTime,
  onSlotAction,
  onCancelAppointment,
  onLeaveWaitlist,
}) => {
  const serverBlock = slot.slotBlocks?.find((b) => b.customerId === serverUserId);
  const blockReason: string | undefined = serverBlock?.reason || localBlocks[slot.id];
  const isBlocked = !!blockReason;
  const isCancelled = blockReason === 'CANCELLED';

  const isMine =
    !isBlocked &&
    ((slot.status === 'RESERVED' && slot.appointment?.customerId === serverUserId) ||
      myBookedSlotId === slot.id);

  const isHoldForMe =
    !isBlocked && slot.status === 'HOLD' && slot.appointment?.customerId === serverUserId;

  const amIWaiting =
    !isBlocked &&
    !isMine &&
    !isHoldForMe &&
    (slot.waitlistEntries?.some((w) => w.customerId === serverUserId) ||
      myWaitlistSlotIds.includes(slot.id));

  const isAvailable = slot.status === 'AVAILABLE' && !isMine && !isBlocked;

  return (
    <article
      role="listitem"
      aria-label={`Turno ${formatTime(slot.startTime)} con estado ${isBlocked
        ? isCancelled
          ? 'cancelado'
          : 'declinado'
        : isMine
          ? 'tu turno'
          : isAvailable
            ? 'disponible'
            : slot.status === 'HOLD'
              ? 'en oferta'
              : 'ocupado'}`}
      className={`flex flex-col justify-between p-5 border rounded-xl transition-all duration-200 relative select-none min-h-37.5
        ${isBlocked
          ? 'bg-zinc-950 border-zinc-900/60 opacity-60'
          : isMine
            ? 'bg-emerald-950/20 border-emerald-500 ring-1 ring-emerald-500/20 shadow-md shadow-emerald-500/5'
            : isAvailable
              ? 'bg-zinc-900 border-zinc-800 hover:border-emerald-500/40 shadow-sm'
              : 'bg-zinc-950 border-zinc-900/60 opacity-85'
        }`}
    >
      <div>
        <div className="flex justify-between items-start gap-2">
          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md
            ${isBlocked
              ? 'bg-red-500/10 text-red-400'
              : isMine
                ? 'bg-emerald-500/20 text-emerald-400 font-extrabold'
                : isAvailable
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : slot.status === 'HOLD'
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-red-500/10 text-red-400'
            }`}>
            {isBlocked
              ? (isCancelled ? 'Cancelado' : 'Declinado')
              : isMine ? 'Tu Turno' : isAvailable ? 'Disponible' : slot.status === 'HOLD' ? 'En Oferta' : 'Ocupado'}
          </span>

          {amIWaiting && (
            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded-md border border-amber-500/10">
              ✓ En Espera
            </span>
          )}
        </div>

        <div className={`text-xl font-black mt-4 ${isAvailable || isMine ? 'text-zinc-100' : 'text-zinc-500'}`}>
          {formatTime(slot.startTime)}
        </div>
      </div>

      {isBlocked ? (
        <button
          type="button"
          disabled
          className="w-full py-2.5 bg-zinc-900 text-zinc-600 border border-zinc-800/40 font-black rounded-lg text-xs mt-4 cursor-not-allowed"
        >
          {isCancelled ? 'Cancelado' : 'Declinado'}
        </button>
      ) : isMine ? (
        <button
          type="button"
          disabled={loadingSlotId !== null}
          onClick={() => onCancelAppointment(slot)}
          className="w-full py-2.5 bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-400 hover:text-zinc-950 font-black rounded-lg text-xs transition-all duration-200 mt-4 shadow-sm"
        >
          {loadingSlotId === slot.id ? 'Cerrando...' : 'Cancelar Cita'}
        </button>
      ) : isHoldForMe ? (
        <button
          type="button"
          disabled
          className="w-full py-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 font-black rounded-lg text-xs mt-4 cursor-not-allowed"
        >
          En Oferta para ti
        </button>
      ) : amIWaiting ? (
        <button
          type="button"
          disabled={loadingSlotId !== null}
          onClick={() => onLeaveWaitlist(slot.id)}
          className="w-full py-2.5 bg-zinc-950 hover:bg-amber-500/10 border border-zinc-850 hover:border-amber-500/30 text-zinc-400 hover:text-amber-400 font-bold rounded-lg text-xs transition-all duration-200 mt-4 shadow-inner"
        >
          {loadingSlotId === slot.id ? 'Saliendo...' : 'Salir de la Fila'}
        </button>
      ) : (
        <button
          type="button"
          disabled={loadingSlotId !== null || slot.status === 'HOLD' || (!isAvailable && myBookedSlotId !== null)}
          onClick={() => onSlotAction(slot)}
          className={`w-full py-2.5 rounded-lg text-xs font-bold transition-colors mt-4 relative overflow-hidden
            ${isAvailable
              ? 'bg-emerald-500 hover:bg-emerald-600 text-zinc-950 shadow-md'
              : myBookedSlotId !== null
                ? 'bg-zinc-900 text-zinc-600 border border-zinc-800/40 cursor-not-allowed'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
            }`}
        >
          {loadingSlotId === slot.id ? (
            <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin mx-auto" aria-hidden="true"></div>
          ) : isAvailable ? (
            'Reservar'
          ) : myBookedSlotId !== null ? (
            'Bloqueado'
          ) : (
            'Hacer Fila'
          )}
        </button>
      )}
    </article>
  );
};

export default SlotCard;
