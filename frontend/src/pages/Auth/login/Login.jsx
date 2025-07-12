import React from "react";
import Input from "../../../components/input/Input";
import { useState } from "react";
import Button from "../../../components/button/Button";
import styles from "../auth.module.css";
import { Link, Navigate, useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import useAuthStore from "../../../store/auth.store";
const Login = () => {
  const { login, isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email === "") {
      setError((prev) => ({ ...prev, email: "Email is required" }));
    }
    if (password === "") {
      setError((prev) => ({ ...prev, password: "Password is required" }));
    }
    if (email && password) {
      try {
        setIsLoading(true);
        const response = await axiosInstance.post("/auth/login", {
          email,
          password,
        });
        if (response.status === 200) {
         
          login(response.data.user);
          navigate("/");
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  return (
    <div className={styles.authContainer}>
      <div className={styles.authForm}>
        <h1 className={styles.authHeading}>Login</h1>
        <Input
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error.email}
        />
        <Input
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error.password}
        />
        <Button onClick={handleSubmit}>Login</Button>
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
