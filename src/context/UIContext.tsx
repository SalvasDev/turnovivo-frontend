'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Toast, type ToastVariant } from '@/design-system/molecules/Toast';
import { ConfirmDialog, type ConfirmDialogVariant } from '@/design-system/molecules/ConfirmDialog';
import styles from './UIContext.module.css';

type ToastType = ToastVariant;

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
  variant?: ConfirmDialogVariant;
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

function defaultDurationByType(type: ToastType) {
  if (type === 'success') return 2400;
  if (type === 'error') return 4200;
  if (type === 'warning') return 3600;
  if (type === 'info') return 3000;
  return 0;
}

function normalizeLoadingMessage(message: string) {
  return message.trim() || 'Processing...';
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    tone: 'default',
  });

  const resolveConfirmRef = useRef<((value: boolean) => void) | null>(null);

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
    setConfirmState({
      open: true,
      title: options.title || 'Confirm action',
      description: options.description,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      tone: options.tone || 'default',
      variant: options.variant,
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

  return (
    <UIContext.Provider value={value}>
      {children}

      <div
        className={styles.toasts}
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.type}
            onDismiss={() => dismissToast(toast.id)}
          >
            {toast.message}
          </Toast>
        ))}
      </div>

      <ConfirmDialog
        isOpen={confirmState.open}
        title={confirmState.title || 'Confirm action'}
        description={confirmState.description}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant ?? (confirmState.tone === 'danger' ? 'destructive' : 'confirm')}
        onConfirm={() => closeConfirm(true)}
        onCancel={() => closeConfirm(false)}
      />
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}