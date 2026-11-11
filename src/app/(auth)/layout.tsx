import type { ReactNode } from 'react';
import GlobalFooter from '@/components/global-footer';
import styles from '../layout.module.css';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <main id="main-content" tabIndex={-1} className={styles.main}>
        {children}
      </main>
    </div>
  );
}
