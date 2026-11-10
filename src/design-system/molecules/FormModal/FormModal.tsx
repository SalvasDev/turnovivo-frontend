'use client';

import type { ReactNode } from 'react';
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';
import { Button } from '../../atoms/Button';
import { Icon } from '../../atoms/Icon';
import styles from './FormModal.module.css';

export interface FormModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  isPending?: boolean;
  closeLabel?: string;
}

export function FormModal({ isOpen, title, children, onClose, isPending = false, closeLabel = 'Close dialog' }: FormModalProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      isDismissable={!isPending}
      isKeyboardDismissDisabled={isPending}
      onOpenChange={open => { if (!open && !isPending) onClose(); }}
      className={styles.overlay}
    >
      <Modal className={styles.modal}>
        <Dialog className={styles.dialog}>
          <div className={styles.header}>
            <Heading slot="title" className={styles.title}>{title}</Heading>
            <Button variant="text" className={styles.close} aria-label={closeLabel} isDisabled={isPending} onPress={onClose}>
              <span title={closeLabel}><Icon name="close" /></span>
            </Button>
          </div>
          {children}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}