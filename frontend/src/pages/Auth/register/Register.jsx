import React, { useState } from "react";
import Input from "../../../components/input/Input";
import useAxios from "../../../hooks/useAxios";
import Button from "../../../components/button/Button";
import { Link, Navigate, useNavigate } from "react-router-dom";
import styles from "../auth.module.css";
import useAuthStore from "../../../store/auth.store";

const Register = () => {
  const { isAuthenticated, isReady } = useAuthStore();
  const navigate = useNavigate();
  const axios = useAxios();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [error, setError] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    general: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isStoreReady, setIsStoreReady] = useState(false);
  const [success, setSuccess] = useState(false);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Wait for store hydration before checking authentication
  React.useEffect(() => {
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

  if (isStoreReady && isAuthenticated) {
    return <Navigate to="/" />;
  }

  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      general: "",
    };
    let hasErrors = false;

    // Name validation
    if (!name.trim()) {
      newErrors.name = "Name is required";
      hasErrors = true;
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
      hasErrors = true;
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
      hasErrors = true;
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
      hasErrors = true;
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
      hasErrors = true;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      hasErrors = true;
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      hasErrors = true;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      hasErrors = true;
    }

    setError(newErrors);
    return !hasErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setError({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      general: "",
    });
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await axios.post("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      if (response.status === 200 || response.status === 201) {
        setSuccess(true);

        // Clear form
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || "Registration failed";

        if (status === 409) {
          setError((prev) => ({
            ...prev,
            email: "An account with this email already exists",
          }));
        } else if (status === 400) {
          setError((prev) => ({
            ...prev,
            general: message,
          }));
        } else {
          setError((prev) => ({
            ...prev,
            general: "Registration failed. Please try again.",
          }));
        }
      } else if (error.request) {
        setError((prev) => ({
          ...prev,
          general:
            "Network error. Please check your internet connection and try again.",
        }));
      } else {
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
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authForm}>
        <h1 className={styles.authHeading}>Register</h1>

        {error.general && (
          <div className={styles.errorMessage}>{error.general}</div>
        )}

        {success && (
          <div
            style={{
              color: "#065f46",
              backgroundColor: "#ecfdf5",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              marginBottom: "1rem",
              border: "1px solid #a7f3d0",
              fontSize: "0.875rem",
              fontWeight: "500",
              backdropFilter: "blur(10px)",
              textAlign: "center",
            }}
          >
            Registration successful! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            type="text"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error.name}
            disabled={isLoading}
            required
            placeholder="Enter your full name"
          />

          <Input
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error.email}
            disabled={isLoading}
            required
            placeholder="Enter your email address"
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error.password}
            disabled={isLoading}
            required
            placeholder="Create a password"
          />

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={error.confirmPassword}
            disabled={isLoading}
            required
            placeholder="Confirm your password"
          />

          <Button
            type="submit"
            disabled={isLoading || success}
            loading={isLoading}
          >
            {isLoading ? "Creating Account..." : "Register"}
          </Button>
        </form>
      </div>

      <div className={styles.authFooter}>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
