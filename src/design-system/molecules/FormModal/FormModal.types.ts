import type { ReactNode } from 'react';

export interface FormModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  isPending?: boolean;
  closeLabel?: string;
}
