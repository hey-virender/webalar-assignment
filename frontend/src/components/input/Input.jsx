import { useState } from 'react';
import styles from './input.module.css';

export default function Input({ label, type = "text", name, value, onChange, error }) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className={styles.inputWrapper}>
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
      <input
        type={type === "password" && showPassword ? "text" : type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        required
      />
      {type === "password" && (
        <button className={styles.showPasswordButton} type="button" onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? "Hide" : "Show"}
        </button>
      )}
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}
