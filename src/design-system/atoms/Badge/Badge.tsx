import type { BadgeProps } from './Badge.types';
import styles from './Badge.module.css';

export function Badge({
  children,
  color = 'success',
  appearance = 'light',
  size = 'small',
  icon,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={[styles.badge, className].filter(Boolean).join(' ')}
      data-color={color}
      data-appearance={appearance}
      data-size={size}
    >
      {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      <span className={styles.label}>{children}</span>
    </span>
  );
}