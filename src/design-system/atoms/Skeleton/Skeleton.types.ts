import type { CSSProperties, HTMLAttributes } from 'react';

export type SkeletonVariant = 'text' | 'rectangular' | 'circular';

export interface SkeletonProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  variant?: SkeletonVariant;
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  isAnimated?: boolean;
}