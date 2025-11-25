// src/routes/AppRoutes.jsx
import React, { useRef } from "react";
import { Routes, Route, useLocation, Navigate, Outlet } from "react-router-dom";

// ---------------- Main Pages ----------------
import Home from "../pages/Home";
import CampaignDetails from "../pages/CampaignDetails";
import Category from "../pages/Category";
import ProductDetail from "../pages/ProductDetail";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Orders from "../pages/Orders";
import Profile from "../pages/Profile";
import Wishlist from "../pages/Wishlist";

// ---------------- Authentication ----------------
import Login from "../pages/Login";
import Signup from "../pages/Signup";

// ---------------- Seller Pages ----------------
import SellerSetup from "../pages/seller/SellerSetup";
import SellerDashboard from "../pages/seller/Dashboard";
import { SellerProducts } from "../pages/seller/SellerProducts";
import EditStore from "../pages/seller/EditStore";
import { AddProduct } from "../pages/seller/AddProduct";
import { EditProduct } from "../pages/seller/EditProduct";
import { DeleteProduct } from "../pages/seller/DeleteProduct";
import { SellerCampaigns } from "../pages/seller/SellerCampaigns";
import SellerChat from "../pages/seller/SellerChat";

// ---------------- Buyer Store Page ----------------
import StorePage from "../pages/buyer/StorePage";

// ---------------- Payment ----------------
import PaymentInstructions from "../components/buyer/PaymentInstructions";

// ---------------- Components ----------------
import BottomNav from "../components/buyer/BottomNav";
import Header from "../components/shared/Header";
import Notifications from "../components/Notifications";

// ---------------- Auth & Role-based Routes ----------------
import { useAuth } from "../context/AuthContext.jsx";
import SellerRoute from "./SellerRoute.jsx";

// ---------------- Protected Route for general users ----------------
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// ---------------- Layouts ----------------
const BuyerLayout = () => {
  const location = useLocation();
  const onCartUpdateRef = useRef(null);
  const { user } = useAuth();

  const hideBottomNavPaths = [
    "/login",
    "/signup",
    "/wishlist",
  ];
  const hideBottomNav = hideBottomNavPaths.some(path =>
    location.pathname.startsWith(path)
  );

  return (
    <>
      <Header />
      <main className="pt-4">
        <Outlet />
      </main>
      {!hideBottomNav && <BottomNav user={user} onCartUpdateRef={onCartUpdateRef} />}
    </>
  );
};

const SellerLayout = () => (
  <Outlet /> // No header or bottom nav for seller
);

// ---------------- Routes ----------------
export default function AppRoutes() {
  return (
    <Routes>
      {/* ---------- Buyer Routes ---------- */}
      <Route element={<BuyerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/category/:categoryName" element={<Category />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/payment/:orderId" element={<PaymentInstructions />} />
        <Route path="/campaign/:campaignId" element={<CampaignDetails />} />
        <Route path="/store/:id" element={<StorePage />} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      </Route>

      {/* ---------- Authentication Routes (no header/nav) ---------- */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* ---------- Seller Routes ---------- */}
      <Route element={<SellerLayout />}>
        <Route path="/seller/setup" element={<SellerRoute><SellerSetup /></SellerRoute>} />
        <Route path="/seller/dashboard" element={<SellerRoute><SellerDashboard /></SellerRoute>} />
        <Route path="/seller/store/:storeId/edit" element={<SellerRoute><EditStore /></SellerRoute>} />
        <Route path="/seller/products" element={<SellerRoute><SellerProducts /></SellerRoute>} />
        <Route path="/seller/products/add" element={<SellerRoute><AddProduct /></SellerRoute>} />
        <Route path="/seller/product/:productId/edit" element={<SellerRoute><EditProduct /></SellerRoute>} />
        <Route path="/seller/product/:productId/delete" element={<SellerRoute><DeleteProduct /></SellerRoute>} />
        <Route path="/seller/campaigns" element={<SellerRoute><SellerCampaigns /></SellerRoute>} />
        <Route path="/seller/chat" element={<SellerRoute><SellerChat /></SellerRoute>} />
      </Route>

      {/* ---------- 404 ---------- */}
      <Route
        path="*"
        element={
          <div className="p-4 text-center">
            <h2 className="text-2xl font-bold mb-2">404 - Page Not Found</h2>
            <p>The page you are looking for does not exist.</p>
          </div>
        }
      />
    </Routes>
  );
}

