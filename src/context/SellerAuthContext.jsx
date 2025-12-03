// src/context/SellerAuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axiosSeller from "../utils/axiosSeller";
import DOMPurify from "dompurify";

const SellerAuthContext = createContext(null);

export const SellerAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeStore, setActiveStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rehydrated, setRehydrated] = useState(false);

  // Debug: Log context creation
  console.log("[SellerAuthContext] Context created");

  // ----------------------------
  // Fetch user profile and store
  // ----------------------------
  const fetchUserProfile = useCallback(async () => {
    console.log("[SellerAuthContext] fetchUserProfile called");
    try {
      console.log("[SellerAuthContext] Making API call to /auth/seller/me");
      const res = await axiosSeller.get("/auth/seller/me", { withCredentials: true });
      console.log("[SellerAuthContext] User profile API response:", {
        status: res.status,
        data: res.data
      });

      const profile = res.data?.user ?? null;

      if (!profile) {
        console.error("[SellerAuthContext] No user returned from API");
        throw new Error("No user returned");
      }

      console.log("[SellerAuthContext] Raw profile data:", profile);

      // Sanitize profile data
      profile.full_name = DOMPurify.sanitize(profile.full_name || "");
      profile.bio = DOMPurify.sanitize(profile.bio || "");
      
      console.log("[SellerAuthContext] Sanitized profile:", {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name,
        bio_length: profile.bio?.length || 0
      });

      setUser(profile);
      console.log("[SellerAuthContext] User state updated");

      if (profile.role === "seller") {
        console.log("[SellerAuthContext] User is a seller, fetching store info");
        try {
          const storeRes = await axiosSeller.get("/seller/stores/my-store", { withCredentials: true });
          console.log("[SellerAuthContext] Store API response:", {
            status: storeRes.status,
            data: storeRes.data
          });

          const store = storeRes.data ?? null;

          if (store) {
            console.log("[SellerAuthContext] Store found:", {
              store_id: store.id,
              store_name: store.name
            });
            profile.has_store = true;
            setActiveStore(store.id);
            console.log("[SellerAuthContext] Active store set to:", store.id);
          } else {
            console.log("[SellerAuthContext] No store found for seller");
            profile.has_store = false;
            setActiveStore(null);
          }
        } catch (storeErr) {
          console.error("[SellerAuthContext] Store fetch error:", {
            message: storeErr.message,
            status: storeErr.response?.status,
            data: storeErr.response?.data
          });
          profile.has_store = false;
          setActiveStore(null);
        }
      } else {
        console.log("[SellerAuthContext] User is not a seller, role:", profile.role);
      }

      console.log("[SellerAuthContext] fetchUserProfile completed successfully");
      return profile;
    } catch (err) {
      console.error("[SellerAuthContext] fetchUserProfile error:", {
        message: err.message,
        status: err.response?.status,
        responseData: err.response?.data,
        stack: err.stack
      });

      if (err.response?.status === 401) {
        console.log("[SellerAuthContext] Unauthorized (401), clearing auth state");
        setUser(null);
        setActiveStore(null);
      } else {
        console.error("[SellerAuthContext] Other error, clearing auth state");
        setUser(null);
        setActiveStore(null);
      }
      return null;
    }
  }, []);

  // Debug: Log state changes
  useEffect(() => {
    console.log("[SellerAuthContext] State updated:", {
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role,
        has_store: user.has_store
      } : null,
      activeStore,
      loading,
      rehydrated
    });
  }, [user, activeStore, loading, rehydrated]);

  // ----------------------------
  // Rehydrate session on mount
  // ----------------------------
  useEffect(() => {
    console.log("[SellerAuthContext] useEffect: Rehydrating session");
    
    const init = async () => {
      console.log("[SellerAuthContext] Initializing auth context");
      try {
        console.log("[SellerAuthContext] Starting fetchUserProfile for rehydration");
        await fetchUserProfile();
        console.log("[SellerAuthContext] Rehydration successful");
      } catch (error) {
        console.error("[SellerAuthContext] Rehydration failed:", error);
      } finally {
        console.log("[SellerAuthContext] Setting loading to false");
        setLoading(false);
        console.log("[SellerAuthContext] Setting rehydrated to true");
        setRehydrated(true);
        console.log("[SellerAuthContext] Auth context initialized");
      }
    };
    
    init();
  }, [fetchUserProfile]);

  // ----------------------------
  // Login
  // ----------------------------
  const login = useCallback(async (email, password) => {
    console.log("[SellerAuthContext] login called with:", {
      email: email ? `${email.substring(0, 3)}...` : "empty",
      password_length: password?.length || 0
    });
    
    try {
      console.log("[SellerAuthContext] Making login API call to /auth/seller/login");
      await axiosSeller.post("/auth/seller/login", { email, password }, { withCredentials: true });
      console.log("[SellerAuthContext] Login API call successful");
      
      console.log("[SellerAuthContext] Fetching updated user profile");
      const userProfile = await fetchUserProfile();
      console.log("[SellerAuthContext] Login completed, returning user:", {
        id: userProfile?.id,
        email: userProfile?.email,
        role: userProfile?.role
      });
      
      return userProfile;
    } catch (error) {
      console.error("[SellerAuthContext] Login failed:", {
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data
      });
      throw error;
    }
  }, [fetchUserProfile]);

  // ----------------------------
  // Signup
  // ----------------------------
  const signup = useCallback(async (payload) => {
    console.log("[SellerAuthContext] signup called with payload:", {
      ...payload,
      password: payload.password ? "***" : "missing",
      confirmPassword: payload.confirmPassword ? "***" : "missing"
    });
    
    try {
      console.log("[SellerAuthContext] Making signup API call to /auth/seller/register");
      await axiosSeller.post("/auth/seller/register", payload, { withCredentials: true });
      console.log("[SellerAuthContext] Signup API call successful");
      
      console.log("[SellerAuthContext] Fetching user profile after signup");
      const userProfile = await fetchUserProfile();
      console.log("[SellerAuthContext] Signup completed, returning user:", {
        id: userProfile?.id,
        email: userProfile?.email
      });
      
      return userProfile;
    } catch (error) {
      console.error("[SellerAuthContext] Signup failed:", {
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data
      });
      throw error;
    }
  }, [fetchUserProfile]);

  // ----------------------------
  // Logout
  // ----------------------------
  const logout = useCallback(async () => {
    console.log("[SellerAuthContext] logout called");
    
    try {
      console.log("[SellerAuthContext] Making logout API call to /auth/seller/logout");
      await axiosSeller.post("/auth/seller/logout", {}, { withCredentials: true });
      console.log("[SellerAuthContext] Logout API call successful");
    } catch (error) {
      console.warn("[SellerAuthContext] Logout API call failed (may be offline):", error.message);
    } finally {
      console.log("[SellerAuthContext] Clearing local auth state");
      setUser(null);
      setActiveStore(null);
      console.log("[SellerAuthContext] User logged out successfully");
    }
  }, []);

  // ----------------------------
  // Refresh session (used for sockets)
  // ----------------------------
  const refreshSession = useCallback(async () => {
    console.log("[SellerAuthContext] refreshSession called");
    
    try {
      console.log("[SellerAuthContext] Making refresh API call to /auth/seller/refresh");
      await axiosSeller.post("/auth/seller/refresh", {}, { withCredentials: true });
      console.log("[SellerAuthContext] Refresh successful");
      return true;
    } catch (err) {
      console.error("[SellerAuthContext] refreshSession error:", {
        message: err.message,
        status: err.response?.status,
        responseData: err.response?.data
      });
      
      console.log("[SellerAuthContext] Clearing auth state due to refresh failure");
      setUser(null);
      setActiveStore(null);
      return false;
    }
  }, []);

  // ----------------------------
  // Provide dummy token for socket.io (HttpOnly cookie based)
  // ----------------------------
  const getValidToken = useCallback(async () => {
    console.log("[SellerAuthContext] getValidToken called");
    
    const ok = await refreshSession();
    if (ok) {
      console.log("[SellerAuthContext] Token refresh successful, returning cookie-based-auth");
      return "cookie-based-auth";
    } else {
      console.log("[SellerAuthContext] Token refresh failed, returning null");
      return null;
    }
  }, [refreshSession]);

  // Debug: Log provider render
  console.log("[SellerAuthContext] Provider rendering with values:", {
    user: user ? "authenticated" : "null",
    activeStore,
    loading,
    rehydrated
  });

  return (
    <SellerAuthContext.Provider
      value={{
        user,
        activeStore,
        setActiveStore,
        loading,
        rehydrated,
        login,
        signup,
        logout,
        fetchUserProfile,
        refreshSession,
        getValidToken, // ✅ make available for sockets
      }}
    >
      {children}
    </SellerAuthContext.Provider>
  );
};

export const useSellerAuth = () => {
  const context = useContext(SellerAuthContext);
  if (!context) {
    console.error("[SellerAuthContext] useSellerAuth used outside SellerAuthProvider");
    throw new Error("useSellerAuth must be used within a SellerAuthProvider");
  }
  
  console.log("[SellerAuthContext] useSellerAuth hook called, returning context");
  return context;
};
