import type { ComponentPropsWithoutRef } from 'react';
import type { BadgeProps } from '../../atoms/Badge';
import type { BaseButtonProps } from '../../atoms/Button';

export interface CardProps extends Omit<ComponentPropsWithoutRef<'article'>, 'title' | 'children'> {
  title: string;
  badges?: readonly BadgeProps[];
  action?: BaseButtonProps;
}