'use client';

import { Button } from '../../atoms/Button';
import { Icon, type IconName } from '../../atoms/Icon';
import { Spinner } from '../../atoms/Spinner';
import type { ToastProps, ToastVariant } from './Toast.types';
import styles from './Toast.module.css';

const icons: Record<Exclude<ToastVariant, 'loading'>, IconName> = {
  success: 'check',
  info: 'info',
  warning: 'warning',
  error: 'errorOutline',
};

export function Toast({
  children,
  variant = 'success',
  showIcon = true,
  isDismissible = true,
  onDismiss,
  dismissLabel = 'Dismiss notification',
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
          {variant === 'loading' ? <Spinner size="small" /> : <Icon name={icons[variant]} />}
        </span>
      )}
      <span className={styles.message}>{children}</span>
      {isDismissible && onDismiss && (
        <Button
          iconOnly
          variant="text"
          size="small"
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