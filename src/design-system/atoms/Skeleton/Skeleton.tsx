import styles from './Skeleton.module.css';
import type { SkeletonProps } from './Skeleton.types';

export function Skeleton({
  variant = 'text',
  width,
  height,
  isAnimated = true,
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <span
      {...props}
      aria-hidden="true"
      data-variant={variant}
      data-animated={isAnimated || undefined}
      className={[styles.skeleton, className].filter(Boolean).join(' ')}
      style={{ ...style, width: width ?? style?.width, height: height ?? style?.height }}
    />
  );
}

export type { SkeletonProps, SkeletonVariant } from './Skeleton.types';