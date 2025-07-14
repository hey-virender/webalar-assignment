import axios from "axios";

const axiosInstance = axios.create({
  baseURL:import.meta.env.VITE_API_URL,
  headers:{
    "Content-Type":"application/json",
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Credentials": "true",
  },
  withCredentials: true,
});



export default axiosInstance;