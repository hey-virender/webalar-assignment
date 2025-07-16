import React, { useState } from "react";
import { LogOut } from "lucide-react";
import styles from "./logout.module.css";
import useAxios from "../../hooks/useAxios";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/auth.store";
const Logout = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const axios = useAxios();
  const [loading, setLoading] = useState(false);
  const handleLogout = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/auth/logout");
      if (response.status === 200) {
        logout();
        navigate("/login");
      }
    } catch (error) {
      alert(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      className={styles.logoutButton}
      onClick={handleLogout}
      disabled={loading}
    >
      <LogOut className={styles.logoutIcon} />
    </button>
  );
};

export default Logout;
