import type { DividerProps } from './Divider.types';
import styles from './Divider.module.css';

export function Divider({ className, ...props }: DividerProps) {
  return <hr {...props} className={[styles.divider, className].filter(Boolean).join(' ')} />;
}
