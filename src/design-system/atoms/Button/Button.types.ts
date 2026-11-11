import type * as React from "react";
import type { ButtonProps } from "react-aria-components";

export type ButtonVariant = "filled" | "outlined" | "text";
export type ButtonColor = "brand" | "red" | "green" | "gold" | "neutral";
export type ButtonSize = "large" | "medium" | "small";

export interface BaseButtonProps extends ButtonProps {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}