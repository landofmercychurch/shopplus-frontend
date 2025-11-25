// src/routes/SellerRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function SellerRoute({ children }) {
  const { user } = useAuth();

  // Redirect if not logged in
  if (!user) return <Navigate to="/login" replace />;

  // Redirect if not a seller
  if (user.role !== "seller") return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="flex-1">{children}</main>
    </div>
  );
}

