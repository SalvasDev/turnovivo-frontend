'use client';

import { useRouter } from 'next/navigation';
import { DEFAULT_DEMO_PATH } from '@/config/app';
import { Button, Icon } from '@/design-system';
import styles from './HomeActions.module.css';

export function HomeActions() {
  const router = useRouter();

  return (
    <div className={styles.actions}>
      <Button
        variant="filled"
        lockOnPress
        pendingLabel="Opening demo"
        onPress={() => router.push(DEFAULT_DEMO_PATH)}
      >
        Start demo
      </Button>
      <Button
        variant="outlined"
        startIcon={<Icon name="add" />}
        lockOnPress
        pendingLabel="Opening registration"
        onPress={() => router.push('/register')}
      >
        Create test account
      </Button>
    </div>
  );
}