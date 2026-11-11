'use client';

import { useId } from 'react';
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';
import { Button } from '../../atoms/Button';
import type { ConfirmDialogProps } from './ConfirmDialog.types';
import styles from './ConfirmDialog.module.css';

export function ConfirmDialog({
  isOpen,
  title,
  description,
  variant = 'confirm',
  confirmText = variant === 'info' ? 'OK' : 'Confirm',
  cancelText = 'Cancel',
  isPending = false,
  onConfirm,
  onCancel,
  className,
}: ConfirmDialogProps) {
  const descriptionId = useId();

  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open && !isPending) onCancel(); }}
      isDismissable={false}
      isKeyboardDismissDisabled={isPending}
      className={styles.overlay}
    >
      <Modal className={styles.modal}>
        <Dialog
          role="alertdialog"
          aria-describedby={descriptionId}
          data-variant={variant}
          className={[styles.dialog, className].filter(Boolean).join(' ')}
        >
          <div className={styles.content}>
            <Heading slot="title" className={styles.title}>{title}</Heading>
            <p id={descriptionId} className={styles.description}>{description}</p>
          </div>
          <div className={styles.actions} aria-busy={isPending || undefined}>
            {variant !== 'info' && (
              <Button
                type="button"
                variant="outlined"
                color="neutral"
                autoFocus
                isDisabled={isPending}
                onPress={onCancel}
                className={styles.cancel}
              >
                {cancelText}
              </Button>
            )}
            <Button
              type="button"
              variant="filled"
              color={variant === 'destructive' ? 'red' : 'brand'}
              autoFocus={variant === 'info'}
              isPending={isPending}
              isDisabled={isPending}
              onPress={onConfirm}
              className={styles.confirm}
            >
              {confirmText}
            </Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}