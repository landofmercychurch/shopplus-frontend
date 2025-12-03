// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";



// Buyer Contexts
import { BuyerAuthProvider } from "./context/BuyerAuthContext.jsx";
import { BuyerSocketProvider } from "./context/BuyerSocketContext.jsx";

// Seller Contexts
import { SellerAuthProvider } from "./context/SellerAuthContext.jsx";
import { SellerSocketProvider } from "./context/SellerSocketContext.jsx";

// Layouts / Pages
import BuyerApp from "./routes/BuyerApp.jsx"; 
import SellerApp from "./routes/SellerApp.jsx";


import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* ======================= */}
        {/* Buyer Routes */}
        {/* ======================= */}
        <Route
          path="/*"
          element={
            <BuyerAuthProvider>
              <BuyerSocketProvider>
                <BuyerApp /> {/* Includes Header, Footer, BottomNav, buyer routes */}
              </BuyerSocketProvider>
            </BuyerAuthProvider>
          }
        />

        {/* ======================= */}
        {/* Seller Routes */}
        {/* ======================= */}
        <Route
          path="/seller/*"
          element={
            <SellerAuthProvider>
              <SellerSocketProvider>
                <SellerApp /> {/* Includes Seller Dashboard, SellerHeader */}
              </SellerSocketProvider>
            </SellerAuthProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);

