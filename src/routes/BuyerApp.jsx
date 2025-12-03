// src/routes/BuyerAppRoutes.jsx
import React from "react";
import { Routes, Route, Outlet } from "react-router-dom";

// Layouts
import Header from "../components/shared/Header";
import Footer from "../components/shared/Footer";
import BottomNav from "../components/buyer/BottomNav";

// Buyer Pages
import Home from "../pages/Home";
import Category from "../pages/Category";
import ProductDetail from "../pages/ProductDetail";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Orders from "../pages/Orders";
import Profile from "../pages/Profile";
import Wishlist from "../pages/Wishlist";
import Notifications from "../components/Notifications";
import CampaignDetails from "../pages/CampaignDetails";
import StorePage from "../pages/buyer/StorePage";
import SearchResult from "../pages/buyer/searchResult";
import PaymentInstructions from "../components/buyer/PaymentInstructions";

// Auth Pages
import Login from "../pages/Login";
import Signup from "../pages/Signup";

// Route Guards
import ProtectedBuyerRoute from "./ProtectedBuyerRoute";

// -------------------------
// Buyer Layout with BottomNav
// -------------------------
function BuyerLayout() {
  return (
    <main className="bg-gray-100 min-h-screen pb-24">
      <Header />
      <div className="mx-auto max-w-screen-xl">
        <Outlet />
      </div>
      <BottomNav />
      <Footer />
    </main>
  );
}

// -------------------------
// Buyer Routes
// -------------------------
export default function BuyerApp() {
  return (
    <Routes>
      <Route path="/" element={<BuyerLayout />}>
        {/* Public Buyer Routes */}
        <Route index element={<Home />} />
        <Route path="category/:categoryName" element={<Category />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="campaign/:campaignId" element={<CampaignDetails />} />
        <Route path="store/:id" element={<StorePage />} />
        <Route path="search" element={<SearchResult />} />

        {/* Protected Buyer Routes */}
        <Route
          path="orders"
          element={
            <ProtectedBuyerRoute>
              <Orders />
            </ProtectedBuyerRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedBuyerRoute>
              <Profile />
            </ProtectedBuyerRoute>
          }
        />
        <Route
          path="payment/:orderId"
          element={
            <ProtectedBuyerRoute>
              <PaymentInstructions />
            </ProtectedBuyerRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <ProtectedBuyerRoute>
              <Notifications />
            </ProtectedBuyerRoute>
          }
        />
      </Route>

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  );
}

