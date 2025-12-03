import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Tracking from '../components/Tracking';
import axios from "../utils/axiosPublic";
import { useBuyerAuth } from '../context/BuyerAuthContext.jsx';

export default function Orders() {
  const { user, loading: authLoading } = useBuyerAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openOrderId, setOpenOrderId] = useState(null);
  const navigate = useNavigate();

  // Format price
  const formatPrice = (price) => '₦' + Number(price).toLocaleString();

  // Format JSON address neatly
  const formatAddress = (jsonString) => {
    try {
      const data = typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
      return (
        <div className="space-y-1">
          {data.full_name && <p><strong>Name:</strong> {data.full_name}</p>}
          {data.phone_number && <p><strong>Phone:</strong> {data.phone_number}</p>}
          {data.address1 && <p><strong>Address:</strong> {data.address1}</p>}
          {data.city && <p><strong>City:</strong> {data.city}</p>}
          {data.state && <p><strong>State:</strong> {data.state}</p>}
        </div>
      );
    } catch (err) {
      console.error("Address parse failed:", err);
      return <p className="text-red-500 break-words">{jsonString}</p>;
    }
  };

  // Fetch orders using axios + cookies (AUTH CONTEXT, NOT fetchWithAuth)
  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const res = await axios.get(`/orders/buyer/${user.id}`, {
        withCredentials: true,
      });

      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cancel order
  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      const res = await axios.patch(
        `/orders/${orderId}/cancel`,
        {},
        { withCredentials: true }
      );

      alert(res.data?.message || 'Order cancelled');
      fetchOrders();
    } catch (err) {
      console.error("❌ Cancel error:", err);
      alert("Failed to cancel order");
    }
  };

  // Tracking API
  const trackOrder = async (trackingNumber) => {
    try {
      const res = await axios.get(`/orders/track/${trackingNumber}`, {
        withCredentials: true,
      });
      return res.data.order;
    } catch (err) {
      console.error("❌ Track error:", err);
      return null;
    }
  };

  useEffect(() => {
    if (!user && !authLoading) navigate('/login');
    else if (user) fetchOrders();
  }, [user, authLoading, navigate, fetchOrders]);

  if (authLoading) return <div className="p-4">Checking authentication...</div>;
  if (!user) return null;

  // Loading Skeleton
  if (loading) {
    return (
      <div className="p-4 max-w-3xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded shadow animate-pulse space-y-2">
            <div className="h-4 bg-gray-300 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  // Main UI
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-indigo-600 text-center">
        Your Orders
      </h2>

      {orders.length === 0 ? (
        <p className="text-center text-gray-600">No orders yet.</p>
      ) : (
        orders.map((order) => (
          <div
            key={order.id}
            className="bg-white p-4 rounded shadow mb-4 border border-gray-100"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
              <p className="font-semibold text-gray-800 break-all">
                Order ID: {order.id}
              </p>

              <span
                className={`px-2 py-1 text-sm font-medium rounded ${
                  order.status === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : order.status === "cancelled"
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {order.status}
              </span>
            </div>

            <p className="text-gray-700">
              Total: <span className="font-medium">{formatPrice(order.total_amount)}</span>
            </p>

            {/* Formatted Address */}
            <div className="mt-3">
              <p className="font-semibold mb-1 text-gray-800">Shipping Address:</p>

              <div className="bg-gray-50 p-3 rounded border whitespace-normal break-words">
                {formatAddress(order.shipping_address)}
              </div>
            </div>

            <p className="mt-2 text-gray-600">
              Date: {new Date(order.created_at).toLocaleString()}
            </p>

            {/* Items */}
            {order.order_items?.length > 0 && (
              <div className="mt-3">
                <p className="font-semibold mb-1 text-gray-800">Items:</p>
                <div className="space-y-1">
                  {order.order_items.map((item, idx) => (
                    <p key={idx} className="text-gray-700">
                      • {item.quantity} × {item.products?.name || `Product ${item.product_id}`} —{" "}
                      {formatPrice(item.price)}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  setOpenOrderId(openOrderId === order.id ? null : order.id)
                }
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
              >
                {openOrderId === order.id ? "Hide Tracking" : "View Tracking"}
              </button>

              {order.status === "pending" && (
                <button
                  onClick={() => cancelOrder(order.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                >
                  Cancel Order
                </button>
              )}
            </div>

            {/* Tracking */}
            {openOrderId === order.id && (
              <div className="mt-3 border-t pt-3">
                <Tracking orderId={order.id} />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

