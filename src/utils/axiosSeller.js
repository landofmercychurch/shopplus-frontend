// src/utils/axiosSeller.js - UPDATED FOR NOTIFICATIONS
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

console.log("[axiosSeller] Initializing for SELLER endpoints with baseURL:", API_BASE_URL);

const axiosSeller = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ✅ This sends ALL cookies including sellerAccessToken
});

// List of SELLER-specific endpoints
const SELLER_ENDPOINTS = [
  '/notifications/seller',
  '/notifications/seller/',
  '/notifications/seller/unread-count',
  '/notifications/seller/read/',
  '/notifications/seller/read-all',
  // Add other seller endpoints as needed
  '/auth/seller/', // if you have seller auth endpoints
  '/products/seller/', // if you have seller product endpoints
  '/orders/seller/', // if you have seller order endpoints
  '/dashboard/seller/', // etc.
];

// Function to check if endpoint is for sellers
const isSellerEndpoint = (url) => {
  return SELLER_ENDPOINTS.some(endpoint => 
    url.includes(endpoint) || 
    (endpoint.endsWith('/') && url.startsWith(endpoint))
  );
};

// Add request interceptor
axiosSeller.interceptors.request.use(
  (config) => {
    console.log("[axiosSeller] SELLER Request to:", config.url);
    
    // Check if this is a seller endpoint
    if (config.url && !isSellerEndpoint(config.url) && !config.url.includes('/seller')) {
      console.warn("[axiosSeller] Warning: Non-seller endpoint called with axiosSeller:", config.url);
      console.warn("[axiosSeller] Consider using regular axios for buyer endpoints");
    }
    
    return config;
  },
  (error) => {
    console.error("[axiosSeller] Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor with seller-specific logic
axiosSeller.interceptors.response.use(
  (response) => {
    console.log("[axiosSeller] SELLER Response success:", {
      url: response.config.url,
      status: response.status,
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error("[axiosSeller] SELLER Response error:", {
      url: originalRequest?.url,
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
    });

    // Handle 401 Unauthorized for SELLER endpoints
    if (error.response?.status === 401) {
      console.log("[axiosSeller] Seller 401 detected, attempting refresh...");
      
      // Don't retry refresh if we're already trying to refresh
      if (originalRequest.url?.includes('/auth/seller/refresh')) {
        console.error("[axiosSeller] Refresh token failed, redirecting to login");
        if (typeof window !== 'undefined') {
          window.location.href = '/seller/login';
        }
        return Promise.reject(new Error("Seller session expired. Please login again."));
      }
      
      try {
        // Try to refresh the SELLER token
        console.log("[axiosSeller] Calling seller refresh endpoint...");
        // IMPORTANT: You need to have this endpoint in your backend
        await axiosSeller.post("/auth/seller/refresh", {}, { withCredentials: true });
        console.log("[axiosSeller] Seller refresh successful");
        
        // Retry the original seller request
        return axiosSeller(originalRequest);
      } catch (refreshError) {
        console.error("[axiosSeller] Seller refresh failed:", refreshError.message);
        
        // Redirect to SELLER login page
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/seller/login')) {
            console.log("[axiosSeller] Redirecting to SELLER login");
            window.location.href = '/seller/login';
          }
        }
        
        return Promise.reject(new Error("Seller session expired. Please login again."));
      }
    }

    return Promise.reject(error);
  }
);

export default axiosSeller;
