import Link from 'next/link';
import styles from './GlobalFooter.module.css';

export default function GlobalFooter() {
  return (
    <footer className={styles.footer}>
      <p>
        App to manage appointments <span aria-hidden="true">&bull;</span>{' '}
        <Link href="/design-system" className={styles.link}>Design system implementation</Link>{' '}
        <span aria-hidden="true">&bull;</span>{' '}
        Salvador S&aacute;nchez M. <span aria-hidden="true">&bull;</span> ©2026
      </p>
    </footer>
  );
}