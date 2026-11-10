'use client';

import { Button } from '../../atoms/Button';
import { Icon, type IconName } from '../../atoms/Icon';
import type { ToastProps, ToastVariant } from './Toast.types';
import styles from './Toast.module.css';

const icons: Record<ToastVariant, IconName> = {
  success: 'check',
  info: 'info',
  warning: 'info',
  error: 'close',
  loading: 'autorenew',
};

export function Toast({
  children,
  variant = 'success',
  showIcon = true,
  isDismissible = true,
  onDismiss,
  dismissLabel = 'Cerrar notificacion',
  className,
  ...props
}: ToastProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      {...props}
      data-variant={variant}
      className={[styles.toast, className].filter(Boolean).join(' ')}
    >
      {showIcon && (
        <span className={styles.icon} aria-hidden="true">
          <Icon name={icons[variant]} />
        </span>
      )}
      <span className={styles.message}>{children}</span>
      {isDismissible && onDismiss && (
        <Button
          variant="text"
          className={styles.dismiss}
          aria-label={dismissLabel}
          onPress={onDismiss}
        >
          <span className={styles.closeIcon} title={dismissLabel}>
            <Icon name="close" />
          </span>
        </Button>
      )}
    </div>
  );
}