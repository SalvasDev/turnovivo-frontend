'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Icon } from '../Icon';
import type { AvatarProps } from './Avatar.types';
import styles from './Avatar.module.css';

export function Avatar({
  variant = 'default', name, src, label, decorative = false, className,
}: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const initials = [words[0], words.length > 1 ? words.at(-1) : undefined]
    .map((word) => Array.from(word ?? '')[0] ?? '')
    .join('')
    .toUpperCase();
  const showPhoto = variant === 'photo' && !!src && failedSrc !== src;

  return (
    <span
      className={[styles.avatar, className].filter(Boolean).join(' ')}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label?.trim() || words.join(' ') || 'User avatar'}
      aria-hidden={decorative ? true : undefined}
      data-variant={variant}
    >
      {showPhoto ? (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          unoptimized
          className={styles.photo}
          onError={() => setFailedSrc(src)}
        />
      ) : variant !== 'default' && initials ? (
        <span aria-hidden="true">{initials}</span>
      ) : (
        <Icon name="person" className={styles.icon} />
      )}
    </span>
  );
}