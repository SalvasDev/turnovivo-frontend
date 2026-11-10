import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type BadgeColor = 'success' | 'error' | 'warning' | 'info';
export type BadgeAppearance = 'light' | 'solid';

export interface BadgeProps extends Omit<ComponentPropsWithoutRef<'span'>, 'color' | 'children'> {
  children: string;
  color?: BadgeColor;
  appearance?: BadgeAppearance;
  size?: 'small';
  icon?: ReactNode;
}