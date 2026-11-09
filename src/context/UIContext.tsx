'use client';

import {
  createContext,
  KeyboardEvent,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

interface ToastOptions {
  duration?: number;
  persistent?: boolean;
}

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ConfirmOptions {
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'default' | 'danger';
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
}

interface UIContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
  loading: (message: string) => () => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

function toastClassesByType(type: ToastType) {
  if (type === 'success') {
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
  }
  if (type === 'error') {
    return 'border-red-500/40 bg-red-500/10 text-red-300';
  }
  if (type === 'warning') {
    return 'border-amber-500/40 bg-amber-500/10 text-amber-200';
  }
  if (type === 'loading') {
    return 'border-sky-500/40 bg-sky-500/10 text-sky-200';
  }
  return 'border-amber-500/40 bg-amber-500/10 text-amber-200';
}

function defaultDurationByType(type: ToastType) {
  if (type === 'success') return 2400;
  if (type === 'error') return 4200;
  if (type === 'warning') return 3600;
  if (type === 'info') return 3000;
  return 0;
}

function normalizeLoadingMessage(message: string) {
  const trimmed = message.trim();
  if (!trimmed) return 'Procesando...';

  const lower = trimmed.toLowerCase();
  if (lower.startsWith('procesando')) {
    return trimmed;
  }

  return `Procesando: ${trimmed}`;
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    title: '',
    description: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    tone: 'default',
  });

  const resolveConfirmRef = useRef<((value: boolean) => void) | null>(null);
  const confirmDialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((type: ToastType, message: string, options?: ToastOptions) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    const persistent = options?.persistent ?? false;
    const duration = options?.duration ?? defaultDurationByType(type);

    if (!persistent && duration > 0) {
      window.setTimeout(() => {
        dismissToast(id);
      }, duration);
    }

    return id;
  }, [dismissToast]);

  const success = useCallback((message: string) => pushToast('success', message), [pushToast]);
  const error = useCallback((message: string) => pushToast('error', message), [pushToast]);
  const info = useCallback((message: string) => pushToast('info', message), [pushToast]);
  const warning = useCallback((message: string) => pushToast('warning', message), [pushToast]);
  const loading = useCallback((message: string) => {
    const id = pushToast('loading', normalizeLoadingMessage(message), { persistent: true });
    return () => dismissToast(id);
  }, [pushToast, dismissToast]);

  const closeConfirm = useCallback((value: boolean) => {
    setConfirmState((prev) => ({ ...prev, open: false }));
    if (resolveConfirmRef.current) {
      resolveConfirmRef.current(value);
      resolveConfirmRef.current = null;
    }
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    lastFocusedElementRef.current = document.activeElement as HTMLElement;
    setConfirmState({
      open: true,
      title: options.title || 'Confirmar accion',
      description: options.description,
      confirmText: options.confirmText || 'Confirmar',
      cancelText: options.cancelText || 'Cancelar',
      tone: options.tone || 'default',
    });

    return new Promise<boolean>((resolve) => {
      resolveConfirmRef.current = resolve;
    });
  }, []);

  const value = useMemo(
    () => ({
      success,
      error,
      info,
      warning,
      loading,
      confirm,
    }),
    [success, error, info, warning, loading, confirm],
  );

  useEffect(() => {
    if (!confirmState.open) {
      lastFocusedElementRef.current?.focus();
      return;
    }

    cancelButtonRef.current?.focus();
  }, [confirmState.open]);

  const handleConfirmKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      closeConfirm(false);
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableEls = confirmDialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (!focusableEls || focusableEls.length === 0) {
      return;
    }

    const first = focusableEls[0];
    const last = focusableEls[focusableEls.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <UIContext.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed right-4 top-20 z-70 flex w-[min(24rem,92vw)] flex-col gap-2"
        role="status"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
            className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm font-semibold shadow-xl ${toastClassesByType(
              toast.type,
            )}`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'loading' && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sky-200 border-t-transparent" />
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        ))}
      </div>

      {confirmState.open && (
        <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            ref={confirmDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ui-confirm-title"
            aria-describedby="ui-confirm-description"
            onKeyDown={handleConfirmKeyDown}
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
          >
            <h3 id="ui-confirm-title" className="text-lg font-black text-zinc-100">{confirmState.title}</h3>
            <p id="ui-confirm-description" className="mt-2 text-sm leading-relaxed text-zinc-300">{confirmState.description}</p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={() => closeConfirm(false)}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-700"
              >
                {confirmState.cancelText}
              </button>
              <button
                type="button"
                onClick={() => closeConfirm(true)}
                className={`rounded-lg px-4 py-2 text-sm font-black ${
                  confirmState.tone === 'danger'
                    ? 'bg-red-500 text-zinc-950 hover:bg-red-600'
                    : 'bg-emerald-500 text-zinc-950 hover:bg-emerald-600'
                }`}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI debe usarse dentro de UIProvider');
  }
  return context;
}