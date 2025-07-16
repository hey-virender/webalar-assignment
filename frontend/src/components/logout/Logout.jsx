import React from "react";
import { LogOut } from "lucide-react";
import styles from "./logout.module.css";
import useAxios from "../../hooks/useAxios";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/auth.store";
const Logout = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const axios = useAxios();
  const handleLogout = async () => {
    try {
      const response = await axios.post("/auth/logout");
      if (response.status === 200) {
        logout();
        navigate("/login");
      }
    } catch (error) {
      alert(error.response.data.message);
    }
  };
  return (
    <button className={styles.logoutButton} onClick={handleLogout}>
      <LogOut className={styles.logoutIcon} />
    </button>
  );
};

export default Logout;
