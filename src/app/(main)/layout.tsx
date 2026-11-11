import type { ReactNode } from 'react';
import GlobalFooter from '@/components/global-footer';
import GlobalHeader from '@/components/global-header';
import styles from '../layout.module.css';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <GlobalHeader />
      <main id="main-content" tabIndex={-1} className={styles.main}>
        {children}
      </main>
      <GlobalFooter />
    </div>
  );
}
