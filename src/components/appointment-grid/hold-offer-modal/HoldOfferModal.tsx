'use client';

import { useId, useState } from 'react';
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';
import { Badge, Button } from '@/design-system';
import styles from './HoldOfferModal.module.css';

interface HoldOfferModalProps {
  countdown: number;
  onDecline: () => void | Promise<unknown>;
  onConfirm: () => void | Promise<unknown>;
}

type PendingAction = 'confirm' | 'decline' | null;

export default function HoldOfferModal({ countdown, onDecline, onConfirm }: HoldOfferModalProps) {
  const descriptionId = useId();
  const [pending, setPending] = useState<PendingAction>(null);
  const remainingSeconds = Math.min(30, Math.max(0, Math.ceil(countdown)));

  // One action at a time: both buttons stay locked until the running request settles.
  const run = (action: Exclude<PendingAction, null>, callback: () => void | Promise<unknown>) => async () => {
    setPending(action);
    try {
      await callback();
    } finally {
      setPending(null);
    }
  };

  // Escape means "not now": it declines like the focused default button, then the modal unmounts.
  return (
    <ModalOverlay
      isOpen
      isDismissable={false}
      isKeyboardDismissDisabled={pending !== null}
      onOpenChange={(isOpen) => { if (!isOpen) void run('decline', onDecline)(); }}
      className={styles.overlay}
    >
      <Modal className={styles.modal}>
        <Dialog role="alertdialog" aria-describedby={descriptionId} className={styles.dialog}>
          <div className={styles.content}>
            <Badge color="success">Instant opportunity</Badge>
            <Heading slot="title" className={styles.title}>A spot just opened up</Heading>
            <p id={descriptionId} className={styles.description}>
              Claim or decline this appointment before the countdown ends.
            </p>
          </div>
          <div className={styles.countdown}>
            <div role="timer" aria-label="Time remaining" aria-live="off" className={styles.time}>
              00:{remainingSeconds.toString().padStart(2, '0')}
            </div>
            <progress
              className={styles.progress}
              max={30}
              value={remainingSeconds}
              aria-label="Time left to claim the appointment"
              aria-valuetext={`${remainingSeconds} seconds`}
            />
          </div>
          <div className={styles.actions}>
            <Button
              type="button"
              variant="outlined"
              color="neutral"
              autoFocus
              isDisabled={pending === 'confirm'}
              isPending={pending === 'decline'}
              pendingLabel="Declining"
              onPress={run('decline', onDecline)}
              className={styles.decline}
            >
              Decline
            </Button>
            <Button
              type="button"
              isDisabled={remainingSeconds === 0 || pending === 'decline'}
              isPending={pending === 'confirm'}
              pendingLabel="Claiming"
              onPress={run('confirm', onConfirm)}
              className={styles.confirm}
            >
              Claim
            </Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
