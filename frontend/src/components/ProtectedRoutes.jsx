import React, { useEffect, useState } from "react";
import useAuthStore from "../store/auth.store";
import { Navigate } from "react-router-dom";

const ProtectedRoutes = ({ children }) => {
  const { isAuthenticated, isReady } = useAuthStore();
  const [isStoreReady, setIsStoreReady] = useState(false);

  
  useEffect(() => {
    const checkStoreReady = () => {
      if (isReady()) {
        setIsStoreReady(true);
      } else {
        
        const timeout = setTimeout(checkStoreReady, 100);
        return () => clearTimeout(timeout);
      }
    };

    checkStoreReady();
  }, [isReady]);

  // Show loading while store is hydrating
  if (!isStoreReady) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1.2rem",
          color: "#666",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <div>{children}</div>;
};

export default ProtectedRoutes;
