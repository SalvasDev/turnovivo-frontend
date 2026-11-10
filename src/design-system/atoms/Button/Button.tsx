"use client";

import { Button as AriaButton } from "react-aria-components";
import type { BaseButtonProps } from "./Button.types";
import styles from "./Button.module.css";

export function Button({
  variant = "filled",
  startIcon,
  endIcon,
  children,
  className,
  ...props
}: BaseButtonProps) {
  return (
    <AriaButton
      {...props}
      className={(state) =>
        [
          styles.button,
          styles[variant],
          typeof className === "function" ? className(state) : className,
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      {(state) => (
        <>
          {startIcon != null && (
            <span className={styles.icon} aria-hidden="true">
              {startIcon}
            </span>
          )}
          <span className={styles.label}>
            {typeof children === "function" ? children(state) : children}
          </span>
          {endIcon != null && (
            <span className={styles.icon} aria-hidden="true">
              {endIcon}
            </span>
          )}
        </>
      )}
    </AriaButton>
  );
}