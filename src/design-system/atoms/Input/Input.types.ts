import type { ReactNode, Ref } from 'react';
import type { TextFieldProps, ValidationResult } from 'react-aria-components';

export type InputState = 'default' | 'resting' | 'active' | 'error' | 'success' | 'disabled';

export interface InputLabelLink {
  href: string;
  children: ReactNode;
  target?: '_self' | '_blank';
}

export interface InputProps extends Omit<TextFieldProps, 'children'> {
  placeholder?: string;
  label?: ReactNode;
  description?: ReactNode;
  helperText?: ReactNode;
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  state?: InputState;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  labelHelp?: string;
  labelLink?: InputLabelLink;
  requiredIndicator?: ReactNode;
  inputRef?: Ref<HTMLInputElement>;
}