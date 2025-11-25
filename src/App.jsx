// src/App.jsx
import React, { useEffect, useState } from 'react';
import AppRoutes from './routes/AppRoutes';
import { useAuth } from './context/AuthContext.jsx';
import './index.css';

function App() {
  console.log("✅ App.jsx rendering");

  const { loadUserProfile, logout } = useAuth();
  const [loadingProfile, setLoadingProfile] = useState(false);

  // ===== Fetch profile on app load (rehydration) =====
  useEffect(() => {
    const init = async () => {
      setLoadingProfile(true);
      try {
        await loadUserProfile();
      } catch (err) {
        console.warn("⚠️ Profile fetch failed:", err.message);
        logout();
      } finally {
        setLoadingProfile(false);
      }
    };
    init();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-20">
        {loadingProfile ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">Loading profile...</p>
          </div>
        ) : (
          <AppRoutes />
        )}
      </main>
    </div>
  );
}

export default App;

