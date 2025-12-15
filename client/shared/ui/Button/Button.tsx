import { ButtonHTMLAttributes, forwardRef } from "react";
import styles from "./Button.module.scss";

type Variant = "primary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      className,
      ...rest
    },
    ref,
  ) => {
    const classes = [
      styles.button,
      styles[variant],
      styles[size],
      fullWidth ? styles.fullWidth : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return <button ref={ref} className={classes} {...rest} />;
  },
);

Button.displayName = "Button";
