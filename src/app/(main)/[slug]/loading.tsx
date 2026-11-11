import { Divider, Skeleton } from '@/design-system';
import styles from './loading.module.css';

export default function BusinessLoading() {
  return (
    <section className={styles.page} aria-label="Loading appointment availability" aria-busy="true">
      <div className={styles.content}>
        <header className={styles.header}>
          <Skeleton variant="text" width="40%" height="var(--line-height-36)" />
        </header>

        <div className={styles.toolbar}>
          <div className={styles.datePicker} role="group" aria-label="Appointment date">
            <span className={styles.dateLabel}>Appointment date</span>
            <Skeleton className={styles.dateInputSkeleton} variant="rectangular" height="var(--size-40)" />
            <Skeleton className={styles.clearSkeleton} variant="rectangular" width="calc(var(--size-64) + var(--space-8))" height="var(--size-40)" />
          </div>
        </div>

        <Divider />

        <div className={styles.dates} aria-hidden="true">
          {Array.from({ length: 2 }, (_, dateIndex) => (
            <div key={dateIndex} className={styles.dateGroup}>
              <Skeleton variant="text" width="35%" height="var(--line-height-32)" />
              <div className={styles.slots}>
                {Array.from({ length: 4 }, (_, slotIndex) => (
                  <Skeleton
                    key={slotIndex}
                    className={styles.slot}
                    variant="rectangular"
                    height="calc(var(--size-64) * 2 + var(--size-32))"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}