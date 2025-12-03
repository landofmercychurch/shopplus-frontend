// src/pages/Cart.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useBuyerAuth } from "../context/BuyerAuthContext";
import { fetchWithAuth } from "../services/buyerAuthService";

export default function Cart({ onCartUpdateRef }) {
  const { user, loading: authLoading, rehydrated } = useBuyerAuth();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  // ----------------------------
  // Helper
  // ----------------------------
  const formatPrice = (price) =>
    price != null
      ? price.toLocaleString("en-NG", { style: "currency", currency: "NGN" })
      : "₦0";

  const total = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * item.quantity,
    0
  );

  // ----------------------------
  // Fetch cart
  // ----------------------------
  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/cart");
      setCartItems(Array.isArray(res.data) ? res.data : []);
      if (onCartUpdateRef) onCartUpdateRef.current?.(); // update bottom nav
    } catch (err) {
      console.error("❌ Error fetching cart:", err);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [onCartUpdateRef]);

  // ----------------------------
  // Update quantity
  // ----------------------------
  const updateQuantity = async (id, qty) => {
    if (qty < 1) return;
    setUpdatingItemId(id);
    try {
      await fetchWithAuth(`/cart/${id}`, "PATCH", { quantity: qty });
      await fetchCart();
    } catch (err) {
      console.error("❌ Update quantity error:", err);
    } finally {
      setUpdatingItemId(null);
    }
  };

  // ----------------------------
  // Remove item
  // ----------------------------
  const removeItem = async (id) => {
    setUpdatingItemId(id);
    try {
      await fetchWithAuth(`/cart/${id}`, "DELETE");
      await fetchCart();
    } catch (err) {
      console.error("❌ Remove item error:", err);
    } finally {
      setUpdatingItemId(null);
    }
  };

  // ----------------------------
  // Add item (optional)
  // ----------------------------
  const addItem = async (product_id, quantity = 1) => {
    try {
      await fetchWithAuth("/cart", "POST", { product_id, quantity });
      await fetchCart();
    } catch (err) {
      console.error("❌ Add to cart error:", err);
    }
  };

  // ----------------------------
  // On mount, fetch cart
  // ----------------------------
  useEffect(() => {
    if (!user && !authLoading && rehydrated) {
      navigate("/login");
    } else if (user) {
      fetchCart();
    }
  }, [user, authLoading, rehydrated, fetchCart, navigate]);

  // ----------------------------
  // Render
  // ----------------------------
  if (authLoading || !rehydrated)
    return <div className="p-4">Checking authentication...</div>;

  if (!user) return null;

  if (loading)
    return (
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 bg-gray-200 animate-pulse rounded h-20 px-4"
          >
            <div className="w-16 h-16 bg-gray-300 rounded" />
            <div className="flex-1 space-y-2 py-2">
              <div className="h-4 bg-gray-300 rounded w-3/4" />
              <div className="h-4 bg-gray-300 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );

  if (!cartItems.length)
    return <div className="p-4 text-center text-gray-600">Your cart is empty.</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Your Cart</h2>

      <div className="space-y-4">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 bg-white p-4 rounded shadow hover:shadow-lg transition"
          >
            <img
              src={item.image_url || "/product-placeholder.png"}
              alt={item.name}
              className="w-20 h-20 object-cover rounded"
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{item.name}</p>
              <p className="text-gray-500 text-sm">{item.category || "Uncategorized"}</p>
              <p className="text-indigo-600 font-bold mt-1">{formatPrice(item.price)}</p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1 || updatingItemId === item.id}
                  className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={updatingItemId === item.id}
                  className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  +
                </button>
              </div>

              <span className="font-semibold">
                {formatPrice(Number(item.price) * item.quantity)}
              </span>

              <button
                onClick={() => removeItem(item.id)}
                disabled={updatingItemId === item.id}
                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-xl font-bold">Total: {formatPrice(total)}</div>
        <button
          onClick={() => navigate("/checkout")}
          className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 w-full md:w-auto"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

