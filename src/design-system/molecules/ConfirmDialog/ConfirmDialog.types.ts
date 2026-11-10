import type { ReactNode } from 'react';

export type ConfirmDialogVariant = 'confirm' | 'info' | 'destructive';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  variant?: ConfirmDialogVariant;
  confirmText?: ReactNode;
  cancelText?: ReactNode;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}