import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type ToastVariant = 'success' | 'info' | 'warning' | 'error' | 'loading';

export interface ToastProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  children: ReactNode;
  variant?: ToastVariant;
  showIcon?: boolean;
  isDismissible?: boolean;
  onDismiss?: () => void;
  dismissLabel?: string;
}