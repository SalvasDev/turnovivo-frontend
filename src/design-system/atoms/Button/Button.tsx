"use client";

import { Button as AriaButton } from "react-aria-components";
import type { BaseButtonProps } from "./Button.types";
import styles from "./Button.module.css";

export function Button({
  variant = "filled",
  color = "brand",
  size = "large",
  startIcon,
  endIcon,
  children,
  className,
  ...props
}: BaseButtonProps) {
  return (
    <AriaButton
      {...props}
      data-variant={variant}
      data-color={color}
      data-size={size}
      className={(state) =>
        [
          styles.button,
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