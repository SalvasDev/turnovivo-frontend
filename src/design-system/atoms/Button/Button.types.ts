import type * as React from "react";
import type { ButtonProps, PressEvent } from "react-aria-components";

export type ButtonVariant = "filled" | "outlined" | "text";
export type ButtonColor = "brand" | "red" | "green" | "gold" | "neutral";
export type ButtonSize = "large" | "medium" | "small";

interface ButtonOwnProps extends Omit<ButtonProps, "onPress"> {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  /** Returning a promise locks the button and shows a spinner until it settles. */
  onPress?: (event: PressEvent) => void | Promise<unknown>;
  /** Keeps the button locked after the first press, e.g. for navigation actions. */
  lockOnPress?: boolean;
  /** Accessible text announced while pending. */
  pendingLabel?: string;
}

interface IconOnlyButtonProps {
  /** Square button whose only content is an icon; an accessible name is required. */
  iconOnly: true;
  "aria-label": string;
}

interface LabelledButtonProps {
  iconOnly?: false;
}

export type BaseButtonProps = ButtonOwnProps & (IconOnlyButtonProps | LabelledButtonProps);