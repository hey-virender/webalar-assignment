import React from "react";
import Input from "../../../components/input/Input";
import { useState, useEffect } from "react";
import Button from "../../../components/button/Button";
import styles from "../auth.module.css";
import { Link, Navigate, useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import useAuthStore from "../../../store/auth.store";

const Login = () => {
  const { login, isAuthenticated, isReady } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState({ email: "", password: "", general: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStoreReady, setIsStoreReady] = useState(false);

  // Wait for store hydration before checking authentication
  useEffect(() => {
    const checkStoreReady = () => {
      if (isReady()) {
        setIsStoreReady(true);
      } else {
        // Check again after a short delay if not ready
        const timeout = setTimeout(checkStoreReady, 100);
        return () => clearTimeout(timeout);
      }
    };

    checkStoreReady();
  }, [isReady]);

  // Only redirect after store is hydrated and user is authenticated
  if (isStoreReady && isAuthenticated) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setError({ email: "", password: "", general: "" });

    // Validation
    let hasErrors = false;
    if (!email.trim()) {
      setError((prev) => ({ ...prev, email: "Email is required" }));
      hasErrors = true;
    }
    if (!password.trim()) {
      setError((prev) => ({ ...prev, password: "Password is required" }));
      hasErrors = true;
    }

    if (hasErrors) return;

    try {
      setIsLoading(true);

      const response = await axiosInstance.post("/auth/login", {
        email: email.trim(),
        password,
      });

      if (response.status === 200) {
        const { user, token } = response.data;

        // Attempt to login with better error handling
        try {
          login(user, token);

          // Small delay to ensure state is updated before navigation
          setTimeout(() => {
            navigate("/");
          }, 100);
        } catch (storageError) {
          console.error("Storage error during login:", storageError);
          setError((prev) => ({
            ...prev,
            general:
              "Login successful but there was an issue saving your session. You may need to login again.",
          }));

          // Still navigate as the login was successful on the server
          setTimeout(() => {
            navigate("/");
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const message = error.response.data?.message || "Login failed";

        if (status === 401) {
          setError((prev) => ({
            ...prev,
            general: "Invalid email or password",
          }));
        } else if (status === 429) {
          setError((prev) => ({
            ...prev,
            general: "Too many login attempts. Please try again later.",
          }));
        } else {
          setError((prev) => ({ ...prev, general: message }));
        }
      } else if (error.request) {
        // Network error
        setError((prev) => ({
          ...prev,
          general:
            "Network error. Please check your internet connection and try again.",
        }));
      } else {
        // Other error
        setError((prev) => ({
          ...prev,
          general: "An unexpected error occurred. Please try again.",
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while store is hydrating
  if (!isStoreReady) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authForm}>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authForm}>
        <h1 className={styles.authHeading}>Login</h1>

        {error.general && (
          <div
            style={{
              color: "#dc2626",
              backgroundColor: "#fef2f2",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              marginBottom: "1rem",
              border: "1px solid #fecaca",
              fontSize: "0.875rem",
            }}
          >
            {error.general}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error.email}
          disabled={isLoading}
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error.password}
          disabled={isLoading}
        />

        <Button onClick={handleSubmit} type="submit" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </div>

      <div className={styles.authFooter}>
        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
