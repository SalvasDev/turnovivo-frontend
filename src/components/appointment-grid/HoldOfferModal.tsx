import { FC } from 'react';

interface HoldOfferModalProps {
  countdown: number;
  onDecline: () => void;
  onConfirm: () => void;
}

const HoldOfferModal: FC<HoldOfferModalProps> = ({ countdown, onDecline, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hold-offer-title"
        aria-describedby="hold-offer-description"
        className="w-full max-w-sm bg-zinc-900 border-2 border-emerald-500 rounded-2xl p-6 shadow-2xl"
      >
        <div className="text-center">
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
            ¡Oportunidad Relámpago!
          </span>
          <h3 id="hold-offer-title" className="text-xl font-black text-zinc-100 mt-4">Un espacio se liberó</h3>
          <p id="hold-offer-description" className="sr-only">Confirma o rechaza el turno antes de que expire la cuenta regresiva.</p>
          <div className="my-6 flex flex-col items-center justify-center">
            <div className="text-5xl font-black font-mono tracking-tighter text-emerald-500" aria-live="assertive">
              00:{countdown.toString().padStart(2, '0')}
            </div>
            <div className="w-full bg-zinc-950 h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-emerald-500 h-full transition-all duration-1000 ease-linear" style={{ width: `${(countdown / 30) * 100}%` }}></div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={onDecline} className="flex-1 py-2.5 bg-zinc-950 border border-zinc-800 text-zinc-500 font-bold rounded-xl text-xs">Rechazar</button>
            <button type="button" onClick={onConfirm} className="flex-1 py-2.5 bg-emerald-500 text-zinc-950 font-black rounded-xl text-xs">¡Reclamar!</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoldOfferModal;
