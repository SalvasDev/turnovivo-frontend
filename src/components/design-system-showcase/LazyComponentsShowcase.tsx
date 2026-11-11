'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/design-system';
import styles from './Showcase.module.css';

function ComponentsPlaceholder() {
  return (
    <section className={styles.section} aria-labelledby="components-title" aria-busy="true">
      <h2 id="components-title" className={styles.sectionTitle}>Components</h2>
      <Skeleton className={styles.lazyPlaceholder} variant="rectangular" />
    </section>
  );
}

// Its code (React Aria widgets and demo data) only downloads when the section approaches the viewport.
const ComponentsShowcase = dynamic(() => import('./ComponentsShowcase'), {
  ssr: false,
  loading: ComponentsPlaceholder,
});

export default function LazyComponentsShowcase() {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsNear(true);
        observer.disconnect();
      }
    }, { rootMargin: '600px 0px' });
    observer.observe(anchor);
    return () => observer.disconnect();
  }, []);

  return <div ref={anchorRef}>{isNear ? <ComponentsShowcase /> : <ComponentsPlaceholder />}</div>;
}
