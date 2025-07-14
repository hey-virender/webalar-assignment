import React from "react";
import styles from "./button.module.css";

const Button = ({ children, onClick, type }) => {
  return (
    <button className={styles.button} type={type} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
