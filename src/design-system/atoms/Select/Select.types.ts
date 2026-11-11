import type { ReactNode } from 'react';
import type { SelectProps as AriaSelectProps } from 'react-aria-components';

export interface SelectOption {
  id: string;
  label: string;
}

export interface SelectProps extends Omit<AriaSelectProps<SelectOption>, 'children'> {
  label: ReactNode;
  labelAction?: ReactNode;
  options: readonly SelectOption[];
  helperText?: ReactNode;
  errorMessage?: ReactNode;
}
