import { Spinner } from '@/design-system';
import styles from '../route-state.module.css';

export default function Loading() {
  return (
    <div className={styles.state}>
      <Spinner size="large" label="Loading page" />
    </div>
  );
}
