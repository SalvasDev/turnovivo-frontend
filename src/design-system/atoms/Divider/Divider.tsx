import type { HTMLAttributes } from 'react';
import styles from './Divider.module.css';

export type DividerProps = HTMLAttributes<HTMLHRElement>;

export function Divider({ className, ...props }: DividerProps) {
  return <hr {...props} className={[styles.divider, className].filter(Boolean).join(' ')} />;
}
