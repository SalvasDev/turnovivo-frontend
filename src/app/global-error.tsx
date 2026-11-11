'use client';

import './globals.css';
import '@/design-system/tokens/tokens.css';
import Link from 'next/link';
import { Button } from '@/design-system';
import styles from './route-state.module.css';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

/** Last-resort boundary for failures in the root layout, so the app never renders a blank page. */
export default function GlobalError({ unstable_retry }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <title>Something went wrong · TurnoVivo</title>
        <main id="main-content" className={styles.state} role="alert" aria-labelledby="global-error-title">
          <h1 id="global-error-title" className={styles.title}>Something went wrong</h1>
          <p className={styles.description}>
            The app couldn&apos;t start correctly. Check your connection and try again.
          </p>
          <div className={styles.actions}>
            <Button variant="filled" onPress={() => unstable_retry()}>Try again</Button>
            <Link href="/">Back to home</Link>
          </div>
        </main>
      </body>
    </html>
  );
}
