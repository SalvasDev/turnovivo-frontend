import type { icons } from './icons';

export type IconName = keyof typeof icons;

export type IconConfig = {
  readonly name: IconName;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
};
