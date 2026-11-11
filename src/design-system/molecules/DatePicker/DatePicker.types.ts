import type { ReactNode } from 'react';
import type { DatePickerProps as AriaDatePickerProps, DateValue, ValidationResult } from 'react-aria-components';
import type { InputState } from '../../atoms/Input';

/** available: bookable · waitlist: full, waitlist only · blocked: not allowed for this user · none: no slots. */
export type DateAvailability = 'available' | 'waitlist' | 'blocked' | 'none';

export type DateAvailabilityStatus = DateAvailability | 'past';

export interface DatePickerProps<T extends DateValue = DateValue> extends Omit<AriaDatePickerProps<T>, 'children'> {
  label?: ReactNode;
  helperText?: ReactNode;
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  state?: InputState;
  showClearButton?: boolean;
  clearLabel?: string;
  calendarLabel?: string;
  requiredIndicator?: ReactNode;
  /** Marks each calendar day and shows a legend; 'blocked' and 'none' days cannot be selected. */
  getDateAvailability?: (date: DateValue) => DateAvailability | undefined;
  availabilityLabels?: Partial<Record<DateAvailabilityStatus, string>>;
}