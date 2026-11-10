'use client';

import { useId } from 'react';
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';
import { Badge, Button } from '@/design-system';
import styles from './HoldOfferModal.module.css';

interface HoldOfferModalProps {
  countdown: number;
  onDecline: () => void;
  onConfirm: () => void;
}

export default function HoldOfferModal({ countdown, onDecline, onConfirm }: HoldOfferModalProps) {
  const descriptionId = useId();
  const remainingSeconds = Math.min(30, Math.max(0, Math.ceil(countdown)));

  return (
    <ModalOverlay isOpen isDismissable={false} isKeyboardDismissDisabled className={styles.overlay}>
      <Modal className={styles.modal}>
        <Dialog role="alertdialog" aria-describedby={descriptionId} className={styles.dialog}>
          <div className={styles.content}>
            <Badge color="success">¡Oportunidad Relámpago!</Badge>
            <Heading slot="title" className={styles.title}>Un espacio se liberó</Heading>
            <p id={descriptionId} className={styles.description}>
              Confirma o rechaza el turno antes de que expire la cuenta regresiva.
            </p>
          </div>
          <div className={styles.countdown}>
            <div role="timer" aria-label="Tiempo restante" aria-live="off" className={styles.time}>
              00:{remainingSeconds.toString().padStart(2, '0')}
            </div>
            <progress
              className={styles.progress}
              max={30}
              value={remainingSeconds}
              aria-label="Tiempo restante para reclamar el turno"
              aria-valuetext={`${remainingSeconds} segundos`}
            />
          </div>
          <div className={styles.actions}>
            <Button type="button" variant="outlined" autoFocus onPress={onDecline} className={styles.decline}>
              Rechazar
            </Button>
            <Button type="button" onPress={onConfirm} isDisabled={remainingSeconds === 0} className={styles.confirm}>
              ¡Reclamar!
            </Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
