import type * as React from "react";
import type { ButtonProps } from "react-aria-components";

export interface BaseButtonProps extends ButtonProps {
  variant?: "filled" | "outlined" | "text";
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}