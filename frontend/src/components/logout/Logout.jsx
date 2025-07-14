import React from "react";
import { LogOut } from "lucide-react";
import styles from "./logout.module.css";
import axiosInstance from "../../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/auth.store";
const Logout = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const handleLogout = async () => {
    try {
      const response = await axiosInstance.post("/auth/logout");
      if (response.status === 200) {
        logout();
        navigate("/login");
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <button className={styles.logoutButton} onClick={handleLogout}>
      <LogOut className={styles.logoutIcon} />
    </button>
  );
};

export default Logout;
