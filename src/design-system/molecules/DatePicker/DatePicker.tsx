'use client';

import {
  Calendar, CalendarCell, CalendarGrid, CalendarGridBody, CalendarGridHeader,
  CalendarHeaderCell, DateInput, DatePicker as AriaDatePicker, DateSegment,
  Dialog, FieldError, Group, Heading, Label, Popover, Text,
  type DateValue,
} from 'react-aria-components';
import { Button } from '../../atoms/Button';
import { Icon } from '../../atoms/Icon';
import type { DatePickerProps } from './DatePicker.types';
import styles from './DatePicker.module.css';

export function DatePicker<T extends DateValue>({
  label = 'Appointment date',
  helperText,
  errorMessage,
  state = 'default',
  showClearButton = true,
  clearLabel = 'Clear',
  calendarLabel = 'Choose date',
  requiredIndicator = '(required)',
  isRequired,
  isDisabled,
  isReadOnly,
  isInvalid,
  className,
  ...props
}: DatePickerProps<T>) {
  return (
    <AriaDatePicker
      {...props}
      isRequired={isRequired}
      isDisabled={isDisabled || state === 'disabled'}
      isReadOnly={isReadOnly}
      isInvalid={isInvalid || state === 'error'}
      data-state={state}
      className={(renderProps) => [
        styles.picker,
        typeof className === 'function' ? className(renderProps) : className,
      ].filter(Boolean).join(' ')}
    >
      {({ state: pickerState, isDisabled: disabled }) => (
        <>
          {label && (
            <Label className={styles.label}>
              {label}
              {isRequired && <span className={styles.required} aria-hidden="true">{requiredIndicator}</span>}
            </Label>
          )}
          <Group className={styles.control} data-filled={pickerState.value ? true : undefined}>
            <DateInput className={styles.input}>
              {(segment) => <DateSegment segment={segment} className={styles.segment} />}
            </DateInput>
            <Button
              variant="text"
              className={styles.calendarButton}
              aria-label={calendarLabel}
              isDisabled={disabled || isReadOnly}
            >
              <span title={calendarLabel}><Icon name="calendar" /></span>
            </Button>
          </Group>
          {showClearButton && (
            <Button
              slot={null}
              variant="outlined"
              className={styles.clearButton}
              aria-label={typeof label === 'string' ? `${clearLabel}: ${label}` : clearLabel}
              isDisabled={disabled || isReadOnly || !pickerState.value}
              onPress={() => pickerState.setValue(null)}
            >
              {clearLabel}
            </Button>
          )}
          {helperText && <Text slot="description" className={styles.helper}>{helperText}</Text>}
          <FieldError className={styles.error}>{errorMessage}</FieldError>
          <Popover className={styles.popover} placement="bottom start" offset={8}>
            <Dialog className={styles.dialog}>
              <Calendar className={styles.calendar}>
                <header className={styles.calendarHeader}>
                  <Button slot="previous" variant="text" className={styles.navigationButton}>
                    <Icon name="chevronLeft" />
                  </Button>
                  <Heading className={styles.heading} />
                  <Button slot="next" variant="text" className={styles.navigationButton}>
                    <Icon name="chevronRight" />
                  </Button>
                </header>
                <CalendarGrid className={styles.grid}>
                  <CalendarGridHeader>
                    {(day) => <CalendarHeaderCell className={styles.weekday}>{day}</CalendarHeaderCell>}
                  </CalendarGridHeader>
                  <CalendarGridBody>
                    {(date) => <CalendarCell date={date} className={styles.day} />}
                  </CalendarGridBody>
                </CalendarGrid>
              </Calendar>
            </Dialog>
          </Popover>
        </>
      )}
    </AriaDatePicker>
  );
}