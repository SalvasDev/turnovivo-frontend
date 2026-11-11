import type { HTMLAttributes } from 'react';

export type SpinnerSize = 'small' | 'medium' | 'large';

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  size?: SpinnerSize;
  /** When provided, the spinner is announced as a status; otherwise it is decorative. */
  label?: string;
}
