import React from "react";
import styles from "./button.module.css";

const Button = ({
  children,
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  variant = "primary",
  size = "medium",
  className = "",
}) => {
  const handleClick = (e) => {
    if (disabled || loading) return;
    onClick?.(e);
  };

  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    loading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={buttonClasses}
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading && <span className={styles.spinner}></span>}
      <span className={loading ? styles.loadingText : ""}>{children}</span>
    </button>
  );
};

export default Button;
