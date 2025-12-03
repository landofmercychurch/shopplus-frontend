// src/utils/axiosPublic.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const axiosPublic = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ✅ ensures cookies are sent
});

// ---------------------
// Auto-refresh interceptor for buyers only
// ---------------------
axiosPublic.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;

    // Only retry once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Buyer refresh via HttpOnly cookie
        await axiosPublic.post("/auth/buyer/refresh", {});
        // Retry the original request
        return axiosPublic(originalRequest);
      } catch (refreshError) {
        // Refresh failed, buyer must re-login
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosPublic;

