// AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  fetchWithAuth,
  setToken,
  getUser,
  setUser,
  clearSession,
  refreshAccessToken,
  getValidToken,
} from "../services/authService.js";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(() => getUser());
  const [loading, setLoading] = useState(true);
  const [rehydrated, setRehydrated] = useState(false);

  // Track active store (for buyer or seller)
  const [activeStore, setActiveStore] = useState(null);

  // Helper to fetch user profile
  const fetchUserProfile = async () => {
    const profileData = await fetchWithAuth("/auth/profile");
    const profile = profileData?.profile;

    if (profile?.role === "seller") {
      try {
        const storeData = await fetchWithAuth(`/seller/stores/user/${profile.id}`);
        profile.has_store = !!storeData?.id;
        if (profile.has_store && !activeStore) setActiveStore(storeData.id);
      } catch {
        profile.has_store = false;
      }
    }

    setUser(profile);
    setUserState(profile);
    return profile;
  };

  // Rehydration on page load
  useEffect(() => {
    const init = async () => {
      try {
        const token = await refreshAccessToken();
        setToken(token);
        await fetchUserProfile();
      } catch {
        clearSession();
        setUserState(null);
      } finally {
        setLoading(false);
        setRehydrated(true);
      }
    };
    init();
  }, []);

  // Login
  const login = useCallback(async (email, password) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.token || !data.user) throw new Error(data.message || "Login failed");

    setToken(data.token);
    setUser(data.user);
    setUserState(data.user);

    // If seller, fetch has_store
    if (data.user.role === "seller") {
      const profile = await fetchUserProfile();
      return profile;
    }

    return data.user;
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      clearSession();
      setUserState(null);
      setActiveStore(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        rehydrated,
        getValidToken,
        activeStore,
        setActiveStore, // expose setter to allow changing active store from other components
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

