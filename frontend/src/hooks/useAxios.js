import { useCallback } from "react";
import axios from "axios";
import useAuthStore from "../store/auth.store";

const useAxios = () => {
  const { logout } = useAuthStore();

  // Create axios instance
  const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": import.meta.env.VITE_FRONTEND_URL,
      "Access-Control-Allow-Credentials": "true",
    },
    withCredentials: true,
  });

  // Response interceptor to handle 401 errors
  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid, logout user (socket will be disconnected automatically)
        logout();
        // Optionally redirect to login page
        window.location.href = "/login";
      }
      return Promise.reject(error);
    },
  );

  // Wrapper functions for HTTP methods
  const get = useCallback(
    (url, config = {}) => {
      return axiosInstance.get(url, config);
    },
    [axiosInstance],
  );

  const post = useCallback(
    (url, data = {}, config = {}) => {
      return axiosInstance.post(url, data, config);
    },
    [axiosInstance],
  );

  const put = useCallback(
    (url, data = {}, config = {}) => {
      return axiosInstance.put(url, data, config);
    },
    [axiosInstance],
  );

  const patch = useCallback(
    (url, data = {}, config = {}) => {
      return axiosInstance.patch(url, data, config);
    },
    [axiosInstance],
  );

  const deleteRequest = useCallback(
    (url, config = {}) => {
      return axiosInstance.delete(url, config);
    },
    [axiosInstance],
  );

  return {
    get,
    post,
    put,
    patch,
    delete: deleteRequest,
    // Also expose the instance for cases where you need direct access
    instance: axiosInstance,
  };
};

export default useAxios;
