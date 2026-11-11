import type { Metadata } from 'next';
import TokensShowcase from '@/components/design-system-showcase/TokensShowcase';
import ComponentsShowcase from '@/components/design-system-showcase/ComponentsShowcase';
import styles from '@/components/design-system-showcase/Showcase.module.css';

export const metadata: Metadata = {
  title: 'Ocean Design System · TurnoVivo',
  description: 'Tokens and components of the Ocean Design System used by TurnoVivo.',
};

export default function DesignSystemPage() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.title}>Ocean Design System</h1>
          <p className={styles.lead}>
            The tokens and components behind TurnoVivo, designed in Figma and implemented with CSS Modules,
            cascade layers and React Aria.
          </p>
        </header>
        <TokensShowcase />
        <ComponentsShowcase />
      </div>
    </div>
  );
}
