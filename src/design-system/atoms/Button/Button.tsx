"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button as AriaButton, ProgressBar, type PressEvent } from "react-aria-components";
import { Spinner } from "../Spinner";
import type { BaseButtonProps } from "./Button.types";
import styles from "./Button.module.css";

export function Button({
  variant = "filled",
  color = "brand",
  size = "large",
  iconOnly = false,
  startIcon,
  endIcon,
  children,
  className,
  onPress,
  isPending: isPendingProp = false,
  lockOnPress = false,
  pendingLabel = "Loading",
  ...props
}: BaseButtonProps) {
  const [isLocked, setIsLocked] = useState(false);
  // The ref blocks re-entry synchronously, before React re-renders the pending state.
  const lockRef = useRef(false);
  const mountedRef = useRef(true);
  const isPending = isPendingProp || isLocked;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handlePress = useCallback((event: PressEvent) => {
    if (!onPress || lockRef.current || isPendingProp) return;
    const result = onPress(event);
    const isAsync = result instanceof Promise;
    if (!isAsync && !lockOnPress) return;

    lockRef.current = true;
    setIsLocked(true);
    if (!isAsync) return;
    result.finally(() => {
      if (!mountedRef.current) return;
      lockRef.current = false;
      setIsLocked(false);
    });
  }, [onPress, lockOnPress, isPendingProp]);

  return (
    <AriaButton
      {...props}
      onPress={handlePress}
      isPending={isPending}
      data-variant={variant}
      data-color={color}
      data-size={size}
      data-icon-only={iconOnly || undefined}
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
          <span className={styles.content}>
            {startIcon != null && (
              <span className={styles.icon} aria-hidden="true">
                {startIcon}
              </span>
            )}
            <span className={iconOnly ? styles.icon : styles.label}>
              {typeof children === "function" ? children(state) : children}
            </span>
            {endIcon != null && (
              <span className={styles.icon} aria-hidden="true">
                {endIcon}
              </span>
            )}
          </span>
          {isPending && (
            <ProgressBar aria-label={pendingLabel} isIndeterminate className={styles.progress}>
              <Spinner size={size === "small" ? "small" : "medium"} />
            </ProgressBar>
          )}
        </>
      )}
    </AriaButton>
  );
}
