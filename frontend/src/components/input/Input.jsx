import { useState } from "react";
import styles from "./input.module.css";

export default function Input({
  label,
  type = "text",
  name,
  value,
  onChange,
  error,
  placeholder,
  disabled = false,
  required = false,
  success = false,
  className = "",
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputClasses = [
    styles.input,
    error && styles.inputError,
    success && styles.inputSuccess,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className={styles.inputWrapper}>
      <input
        type={type === "password" && showPassword ? "text" : type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder || " "} // Space is needed for CSS :not(:placeholder-shown) to work
        className={inputClasses}
        disabled={disabled}
        required={required}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      <label htmlFor={name} className={styles.label}>
        {label} {required && <span aria-label="required">*</span>}
      </label>
      {type === "password" && (
        <button
          className={styles.showPasswordButton}
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={0}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      )}
      {error && (
        <span
          className={styles.errorText}
          id={`${name}-error`}
          role="alert"
          aria-live="polite"
        >
          {error}
        </span>
      )}
    </div>
  );
}
