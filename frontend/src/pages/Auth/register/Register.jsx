import React, { useState } from 'react'
import Input from '../../../components/input/Input'
import axiosInstance from '../../../api/axiosInstance';
import Button from '../../../components/button/Button';
import { Link } from 'react-router-dom';
import styles from '../auth.module.css';
import useAuthStore from '../../../store/auth.store';

const Register = () => {
  const {isAuthenticated} = useAuthStore()
  if(isAuthenticated){
    return <Navigate to="/" />
  }
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState({name:"",email:"",password:""});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(name === ""){
      setError(prev => ({...prev,name:"Name is required"}));
    }
    if(email === ""){
      setError(prev => ({...prev,email:"Email is required"}));
    }
    if(password === ""){
      setError(prev => ({...prev,password:"Password is required"}));
    }
    if(name && email && password){
      try {
        setIsLoading(true);
        const response = await axiosInstance.post("/auth/register",{name,email,password});
        console.log(response);
      } catch (error) {
        console.log(error);
      }finally{
        setIsLoading(false);
      }
    }
  }
  return (
    <div className={styles.authContainer}>
      <div className={styles.authForm}>
        <h1 className={styles.authHeading}>Register</h1>
        <Input
          label="Name"
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error.name}
        />
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
        <Button onClick={handleSubmit}>Register</Button>
      </div>
      <div className={styles.authFooter}>
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  )
}

export default Register