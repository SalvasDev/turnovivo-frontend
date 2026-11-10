'use client';

import { useId } from 'react';
import {
  FieldError,
  Input as AriaInput,
  Label,
  TextField,
} from 'react-aria-components';
import { Icon } from '../Icon';
import type { InputProps } from './Input.types';
import styles from './Input.module.css';

export function Input({
  label,
  description,
  helperText,
  errorMessage,
  state = 'default',
  startIcon,
  endIcon,
  labelHelp,
  labelLink,
  requiredIndicator = '(required)',
  inputRef,
  className,
  isDisabled,
  isInvalid,
  placeholder,
  'aria-describedby': ariaDescribedBy,
  ...props
}: InputProps) {
  const descriptionId = useId();
  const helperId = useId();
  const describedBy = [
    ariaDescribedBy,
    description != null ? descriptionId : undefined,
    helperText != null ? helperId : undefined,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <TextField
      {...props}
      isDisabled={isDisabled || state === 'disabled'}
      isInvalid={isInvalid || state === 'error'}
      aria-describedby={describedBy}
      data-state={state}
      className={(renderProps) => [
        styles.field,
        typeof className === 'function' ? className(renderProps) : className,
      ].filter(Boolean).join(' ')}
    >
      {({ isRequired }) => (
        <>
          {(label != null || labelHelp || labelLink) && (
            <div className={styles.header}>
              <div className={styles.labelRow}>
                {label != null && (
                  <Label className={styles.label}>
                    {label}
                    {isRequired && (
                      <span className={styles.required} aria-hidden="true">
                        {requiredIndicator}
                      </span>
                    )}
                  </Label>
                )}
                {labelHelp && (
                  <span className={styles.help} title={labelHelp}>
                    <Icon name="info" aria-label={labelHelp} />
                  </span>
                )}
              </div>
              {labelLink && (
                <a
                  className={styles.link}
                  href={labelLink.href}
                  target={labelLink.target}
                  rel={labelLink.target === '_blank' ? 'noopener noreferrer' : undefined}
                >
                  {labelLink.children}
                </a>
              )}
            </div>
          )}
          {description != null && (
            <span id={descriptionId} className={styles.description}>{description}</span>
          )}
          <div className={styles.control}>
            {startIcon != null && (
              <span className={styles.icon} aria-hidden="true">{startIcon}</span>
            )}
            <AriaInput
              ref={inputRef}
              className={styles.input}
              placeholder={placeholder ?? ' '}
            />
            {endIcon != null && (
              <span className={styles.icon} aria-hidden="true">{endIcon}</span>
            )}
          </div>
          {helperText != null && (
            <span id={helperId} className={styles.helper}>{helperText}</span>
          )}
          <FieldError className={styles.error}>{errorMessage}</FieldError>
        </>
      )}
    </TextField>
  );
}