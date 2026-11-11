import { Button, Icon } from '@/design-system';
import styles from './ConnectionNotice.module.css';

interface ConnectionNoticeProps {
  isOffline: boolean;
  onRetry: () => Promise<unknown>;
}

/** Live region kept mounted so screen readers announce when polling loses or regains the server. */
export default function ConnectionNotice({ isOffline, onRetry }: ConnectionNoticeProps) {
  return (
    <div className={styles.container} data-offline={isOffline || undefined}>
      <div role="status" aria-live="polite" aria-atomic="true" className={styles.notice} data-offline={isOffline || undefined}>
        {isOffline && (
          <>
            <Icon name="warning" />
            <span>Connection lost. Showing the last known data while we retry.</span>
          </>
        )}
      </div>
      {isOffline && (
        <Button
          variant="outlined"
          color="neutral"
          size="small"
          startIcon={<Icon name="refresh" />}
          pendingLabel="Retrying"
          onPress={onRetry}
        >
          Retry
        </Button>
      )}
    </div>
  );
}
