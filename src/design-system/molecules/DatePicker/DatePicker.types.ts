import type { ReactNode } from 'react';
import type { DatePickerProps as AriaDatePickerProps, DateValue, ValidationResult } from 'react-aria-components';
import type { InputState } from '../../atoms/Input';

export interface DatePickerProps<T extends DateValue = DateValue> extends Omit<AriaDatePickerProps<T>, 'children'> {
  label?: ReactNode;
  helperText?: ReactNode;
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  state?: InputState;
  showClearButton?: boolean;
  clearLabel?: string;
  calendarLabel?: string;
  requiredIndicator?: ReactNode;
}