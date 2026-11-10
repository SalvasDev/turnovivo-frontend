import type { CSSProperties } from 'react';
import { icons, type IconConfig } from '../../icons';
import styles from './Icon.module.css';

type IconProps = IconConfig & {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  'aria-label'?: string | undefined;
};

export function Icon({
  name,
  width,
  height,
  className,
  style,
  'aria-label': ariaLabel,
}: IconProps) {
  const SvgIcon = icons[name];

  return (
    <SvgIcon
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      focusable="false"
      width={width}
      height={height}
      className={[styles.icon, className].filter(Boolean).join(' ')}
      style={{ width, height, ...style }}
      data-icon="true"
    />
  );
}

export type { IconName } from '../../icons';
