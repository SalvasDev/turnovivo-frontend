'use client';

import { useId } from 'react';
import {
  Calendar, CalendarCell, CalendarGrid, CalendarGridBody, CalendarGridHeader,
  CalendarHeaderCell, DateInput, DatePicker as AriaDatePicker, DateSegment,
  Dialog, FieldError, Group, Heading, Label, Popover, Text,
  type DateValue,
} from 'react-aria-components';
import { Button } from '../../atoms/Button';
import { Icon } from '../../atoms/Icon';
import type { DateAvailabilityStatus, DatePickerProps } from './DatePicker.types';
import styles from './DatePicker.module.css';

const LEGEND_ORDER: DateAvailabilityStatus[] = ['available', 'waitlist', 'blocked', 'none', 'past'];

const DEFAULT_AVAILABILITY_LABELS: Record<DateAvailabilityStatus, string> = {
  available: 'Available',
  waitlist: 'Full, waitlist only',
  blocked: 'Blocked for you',
  none: 'No appointments',
  past: 'Past date',
};

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
  getDateAvailability,
  availabilityLabels,
  isDateUnavailable,
  ...props
}: DatePickerProps<T>) {
  const legendId = useId();
  const labels = { ...DEFAULT_AVAILABILITY_LABELS, ...availabilityLabels };
  const statusId = (status: DateAvailabilityStatus) => `${legendId}-${status}`;

  const getStatus = (date: DateValue): DateAvailabilityStatus | undefined => {
    if (props.minValue && date.compare(props.minValue) < 0) return 'past';
    return getDateAvailability?.(date);
  };

  const isUnavailable = (date: DateValue) => {
    const status = getDateAvailability?.(date);
    return status === 'blocked' || status === 'none' || !!isDateUnavailable?.(date);
  };

  return (
    <AriaDatePicker
      {...props}
      isDateUnavailable={getDateAvailability || isDateUnavailable ? isUnavailable : undefined}
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
              iconOnly
              variant="text"
              size="small"
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
                  <Button slot="previous" iconOnly aria-label="Previous" variant="text" size="small" className={styles.navigationButton}>
                    <Icon name="chevronLeft" />
                  </Button>
                  <Heading className={styles.heading} />
                  <Button slot="next" iconOnly aria-label="Next" variant="text" size="small" className={styles.navigationButton}>
                    <Icon name="chevronRight" />
                  </Button>
                </header>
                <CalendarGrid className={styles.grid}>
                  <CalendarGridHeader>
                    {(day) => <CalendarHeaderCell className={styles.weekday}>{day}</CalendarHeaderCell>}
                  </CalendarGridHeader>
                  <CalendarGridBody>
                    {(date) => {
                      const status = getStatus(date);
                      return (
                        <CalendarCell
                          date={date}
                          className={styles.day}
                          data-availability={status}
                          // RAC owns the cell's aria-label, so the status is linked to its legend entry instead.
                          ref={status ? (cell) => cell?.firstElementChild?.setAttribute('aria-describedby', statusId(status)) : undefined}
                        />
                      );
                    }}
                  </CalendarGridBody>
                </CalendarGrid>
                {getDateAvailability && (
                  <ul className={styles.legend} aria-label="Legend">
                    {LEGEND_ORDER.map((status) => (
                      <li key={status} className={styles.legendItem}>
                        <span className={styles.legendMarker} data-availability={status} aria-hidden="true">15</span>
                        <span id={statusId(status)}>{labels[status]}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Calendar>
            </Dialog>
          </Popover>
        </>
      )}
    </AriaDatePicker>
  );
}