import React from "react";
import { Navigate } from "react-router-dom";
import { useSellerAuth } from "../context/SellerAuthContext.jsx";

export default function SellerRoute({ children }) {
  const { user, rehydrated, loading } = useSellerAuth();

  // Don't redirect while loading or before rehydration
  if (!rehydrated || loading) return null; // or a loader component

  // Redirect if not logged in
  if (!user) return <Navigate to="/seller/login" replace />;

  // Redirect if not a seller
  if (user.role !== "seller") return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="flex-1">{children}</main>
    </div>
  );
}                                                
