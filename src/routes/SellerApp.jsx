// src/routes/SellerAppRoutes.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";

// Seller Pages
import SellerLogin from "../pages/seller/SellerLogin";
import SellerSignup from "../pages/seller/SellerSignup";
import Dashboard from "../pages/seller/Dashboard";
import { AddProduct } from "../pages/seller/AddProduct";
import { EditProduct } from "../pages/seller/EditProduct";
import { DeleteProduct } from "../pages/seller/DeleteProduct";
import { SellerProducts } from "../pages/seller/SellerProducts";
import SellerChat from "../pages/seller/SellerChat";
import { SellerCampaigns } from "../pages/seller/SellerCampaigns";
import EditStore from "../pages/seller/EditStore";
import SellerSetup from "../pages/seller/SellerSetup";

// Seller Notifications
import SellerNotifications from "../components/seller/SellerNotifications";

// Route Guard
import SellerRoute from "./SellerRoute";

// -------------------------
// Seller Routes
// -------------------------
export default function SellerApp() {
  return (
    <Routes>
      {/* Public Seller Auth */}
      <Route path="login" element={<SellerLogin />} />
      <Route path="signup" element={<SellerSignup />} />

      {/* Protected Seller Routes */}
      <Route
        path="/"
        element={
          <SellerRoute>
            <SellerSetup />
          </SellerRoute>
        }
      />
      <Route
        path="dashboard"
        element={
          <SellerRoute>
            <Dashboard />
          </SellerRoute>
        }
      />
      <Route
        path="products"
        element={
          <SellerRoute>
            <SellerProducts />
          </SellerRoute>
        }
      />
      <Route
        path="products/add"
        element={
          <SellerRoute>
            <AddProduct />
          </SellerRoute>
        }
      />
      <Route
        path="products/edit/:id"
        element={
          <SellerRoute>
            <EditProduct />
          </SellerRoute>
        }
      />
      <Route
        path="products/delete/:id"
        element={
          <SellerRoute>
            <DeleteProduct />
          </SellerRoute>
        }
      />
      <Route
        path="chat"
        element={
          <SellerRoute>
            <SellerChat />
          </SellerRoute>
        }
      />
      <Route
        path="campaigns"
        element={
          <SellerRoute>
            <SellerCampaigns />
          </SellerRoute>
        }
      />
      <Route
        path="edit-store"
        element={
          <SellerRoute>
            <EditStore />
          </SellerRoute>
        }
      />
    </Routes>
  );
}

