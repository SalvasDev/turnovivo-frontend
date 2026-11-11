import type { SpinnerProps } from './Spinner.types';
import styles from './Spinner.module.css';

export function Spinner({ size = 'medium', label, className, ...props }: SpinnerProps) {
  return (
    <span
      {...props}
      role={label ? 'status' : undefined}
      aria-hidden={label ? undefined : true}
      data-size={size}
      className={[styles.spinner, className].filter(Boolean).join(' ')}
    >
      <svg className={styles.ring} viewBox="0 0 24 24" fill="none" focusable="false" aria-hidden="true">
        <circle className={styles.track} cx="12" cy="12" r="9" />
        <circle className={styles.arc} cx="12" cy="12" r="9" pathLength="100" />
      </svg>
      {label && <span className={styles.label}>{label}</span>}
    </span>
  );
}
