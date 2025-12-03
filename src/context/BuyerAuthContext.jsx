import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "../utils/axiosPublic";
import DOMPurify from "dompurify";

const BuyerAuthContext = createContext(null);

export const BuyerAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeStore, setActiveStore] = useState(null); // <-- NEW
  const [loading, setLoading] = useState(true);
  const [rehydrated, setRehydrated] = useState(false);

  //-----------------------------------
  // Utility: log token presence (debug only)
  //-----------------------------------
  const logTokenStatus = (label) => {
    const cookies = document.cookie;
    const hasAccessToken = cookies.includes("accessToken");
    const hasRefreshToken = cookies.includes("refreshToken");
    console.log(`[BuyerAuth][${label}] Cookies present? accessToken: ${hasAccessToken}, refreshToken: ${hasRefreshToken}`);
  };

  //-----------------------------------
  // Fetch user profile, auto-refresh on 401
  //-----------------------------------
  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await axios.get("/auth/buyer/me", { withCredentials: true });
      let profile = res.data?.profile ?? null;

      if (profile) {
        profile.full_name = DOMPurify.sanitize(profile.full_name || "");
        profile.bio = DOMPurify.sanitize(profile.bio || "");
      }

      setUser(profile);
      return profile;
    } catch (err) {
      const status = err.response?.status;

      if (status === 401) {
        try {
          await axios.post("/auth/buyer/refresh", {}, { withCredentials: true });
          return await fetchUserProfile();
        } catch {
          setUser(null);
          return null;
        }
      }

      setUser(null);
      return null;
    }
  }, []);

  //-----------------------------------
  // On mount: rehydrate session
  //-----------------------------------
  useEffect(() => {
    const init = async () => {
      try {
        await fetchUserProfile();
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
        setRehydrated(true);
      }
    };
    init();
  }, [fetchUserProfile]);

  //-----------------------------------
  // Login
  //-----------------------------------
  const login = useCallback(async (email, password) => {
    try {
      await axios.post("/auth/buyer/login", { email, password }, { withCredentials: true });
      return await fetchUserProfile();
    } catch (err) {
      throw err;
    }
  }, [fetchUserProfile]);

  //-----------------------------------
  // Signup
  //-----------------------------------
  const signup = useCallback(async (payload) => {
    try {
      await axios.post("/auth/buyer/register", payload, { withCredentials: true });
      return await fetchUserProfile();
    } catch (err) {
      throw err;
    }
  }, [fetchUserProfile]);

  //-----------------------------------
  // Logout
  //-----------------------------------
  const logout = useCallback(async () => {
    try {
      await axios.post("/auth/buyer/logout", {}, { withCredentials: true });
    } catch {}
    setUser(null);
    setActiveStore(null); // <-- clear activeStore on logout
  }, []);

  //-----------------------------------
  // Context value
  //-----------------------------------
  return (
    <BuyerAuthContext.Provider
      value={{
        user,
        activeStore,       // <-- NEW
        setActiveStore,    // <-- NEW
        loading,
        rehydrated,
        login,
        signup,
        logout,
        fetchUserProfile,
      }}
    >
      {children}
    </BuyerAuthContext.Provider>
  );
};

// Hook
export const useBuyerAuth = () => {
  const context = useContext(BuyerAuthContext);
  if (!context) throw new Error("useBuyerAuth must be used within a BuyerAuthProvider");
  return context;
};

