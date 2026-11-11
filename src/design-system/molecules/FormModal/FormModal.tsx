'use client';

import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';
import { Button } from '../../atoms/Button';
import { Icon } from '../../atoms/Icon';
import type { FormModalProps } from './FormModal.types';
import styles from './FormModal.module.css';

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
            <Button iconOnly variant="text" size="small" className={styles.close} aria-label={closeLabel} isDisabled={isPending} onPress={onClose}>
              <span title={closeLabel}><Icon name="close" /></span>
            </Button>
          </div>
          <div className={styles.body} aria-busy={isPending || undefined}>
            {children}
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}