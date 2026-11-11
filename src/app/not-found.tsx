import Link from 'next/link';
import styles from './route-state.module.css';

export default function NotFound() {
  return (
    <main id="main-content" className={styles.state} aria-labelledby="not-found-title">
      <h1 id="not-found-title" className={styles.title}>We couldn&apos;t find this page</h1>
      <p className={styles.description}>
        The link may be outdated or the business may no longer be available.
      </p>
      <div className={styles.actions}>
        <Link href="/">Back to home</Link>
      </div>
    </main>
  );
}
