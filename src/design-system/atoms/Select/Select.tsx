'use client';

import {
  FieldError, Label, ListBox, ListBoxItem, Popover, Select as AriaSelect, SelectValue, Text,
} from 'react-aria-components';
import { Button } from '../Button';
import { Icon } from '../Icon';
import type { SelectProps } from './Select.types';
import styles from './Select.module.css';

export function Select({ label, labelAction, options, helperText, errorMessage, isRequired, className, ...props }: SelectProps) {
  return (
    <AriaSelect
      {...props}
      isRequired={isRequired}
      className={state => [styles.field, typeof className === 'function' ? className(state) : className].filter(Boolean).join(' ')}
    >
      <div className={styles.header}>
        <Label className={styles.label}>
          {label}{isRequired && <span className={styles.required} aria-hidden="true">(required)</span>}
        </Label>
        {labelAction}
      </div>
      <Button variant="outlined" className={styles.trigger} endIcon={<Icon name="caret" />}>
        <SelectValue className={styles.value} />
      </Button>
      {helperText && <Text slot="description" className={styles.helper}>{helperText}</Text>}
      <FieldError className={styles.error}>{errorMessage}</FieldError>
      <Popover className={styles.popover} placement="bottom start" offset={4}>
        <ListBox items={options} className={styles.list}>
          {option => <ListBoxItem id={option.id} textValue={option.label} className={styles.option}>{option.label}</ListBoxItem>}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}