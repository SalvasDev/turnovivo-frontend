'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/design-system';
import styles from '../route-state.module.css';

interface RouteErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function RouteError({ unstable_retry }: RouteErrorProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Moves focus to the message so keyboard and screen reader users land on the new content.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className={styles.state} role="alert" aria-labelledby="route-error-title">
      <h1 id="route-error-title" ref={headingRef} tabIndex={-1} className={styles.title}>
        We couldn&apos;t load this page
      </h1>
      <p className={styles.description}>
        The service may be temporarily unavailable. Check your connection and try again.
      </p>
      <div className={styles.actions}>
        <Button variant="filled" onPress={() => unstable_retry()}>Try again</Button>
        <Link href="/">Back to home</Link>
      </div>
    </section>
  );
}
