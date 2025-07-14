import React from "react";
import styles from "./header.module.css";
import Logout from "../logout/Logout";
import useAuthStore from "../../store/auth.store";
import getInitials from "../../lib/getInitials";
import { Link } from "react-router-dom";
const Header = () => {
  const { user } = useAuthStore();
  return (
    <nav className={styles.header}>
      <div>
        <Link to="/" className={styles.link}>
          <h1>Task Management</h1>
        </Link>
      </div>
      <div className={styles.avatarContainer}>
        <div className={styles.avatar}>{getInitials(user?.name)}</div>
        <Logout />
      </div>
    </nav>
  );
};

export default Header;
