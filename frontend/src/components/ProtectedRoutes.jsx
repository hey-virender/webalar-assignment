import React from "react";
import useAuthStore from "../store/auth.store";
import { Navigate } from "react-router-dom";

const ProtectedRoutes = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return <div>{children}</div>;
};

export default ProtectedRoutes;
