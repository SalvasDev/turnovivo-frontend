'use client';

import { Badge } from '../../atoms/Badge';
import { Button } from '../../atoms/Button';
import type { CardProps } from './Card.types';
import styles from './Card.module.css';

export function Card({ title, badges = [], action, className, ...props }: CardProps) {
  return (
    <article
      {...props}
      aria-label={props['aria-label'] ?? title}
      aria-busy={props['aria-busy'] ?? (action?.isPending || undefined)}
      className={[styles.card, className].filter(Boolean).join(' ')}
    >
      {badges.length > 0 && (
        <div className={styles.badges}>
          {badges.map((badge, index) => (
            <Badge key={badge.id ?? `${badge.color ?? 'success'}-${badge.children}-${index}`} {...badge} />
          ))}
        </div>
      )}
      <h3 className={styles.title}>{title}</h3>
      {action && (
        <Button
          type="button"
          {...action}
          variant={action.variant ?? 'outlined'}
          data-variant={action.variant ?? 'outlined'}
          className={(state) => [
            styles.action,
            typeof action.className === 'function' ? action.className(state) : action.className,
          ].filter(Boolean).join(' ')}
        />
      )}
    </article>
  );
}