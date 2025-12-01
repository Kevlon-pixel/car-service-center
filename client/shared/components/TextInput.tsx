import { InputHTMLAttributes, forwardRef } from "react";
import styles from "./TextInput.module.scss";

export interface TextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, hint, error, className, ...rest }, ref) => {
    const classes = [styles.input, error ? styles.error : "", className]
      .filter(Boolean)
      .join(" ");

    return (
      <label className={styles.field}>
        {label && <span className={styles.label}>{label}</span>}
        <input ref={ref} className={classes} {...rest} />
        {hint && !error && <span className={styles.hint}>{hint}</span>}
        {error && <span className={styles.errorText}>{error}</span>}
      </label>
    );
  },
);

TextInput.displayName = "TextInput";
