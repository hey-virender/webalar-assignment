import React from 'react'
import { LogOut } from "lucide-react"
import styles from "./header.module.css"
const Header = () => {
  return (
    <nav className={styles.header}>
      <div>
        <h1>Task Management</h1>
      </div>
      <div className={styles.avatarContainer}>
       <div className={styles.avatar}>Image</div>
      <LogOut className={styles.logoutButton} />
      </div>
    </nav>
  )
}

export default Header;