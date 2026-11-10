import styles from './GlobalFooter.module.css';

export default function GlobalFooter() {
  return (
    <footer className={styles.footer} lang="en">
      <p>
        App to make appointments <span aria-hidden="true">&bull;</span>{' '}
        Design system implementation <span aria-hidden="true">&bull;</span>{' '}
        Salvador S&aacute;nchez M. <span aria-hidden="true">&bull;</span> 2026
      </p>
    </footer>
  );
}