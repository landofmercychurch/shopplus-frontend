import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Tracking from '../components/Tracking';
import { fetchWithAuth, getValidToken } from '../services/authService';
import { useAuth } from '../context/AuthContext.jsx';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openOrder, setOpenOrder] = useState(null);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await getValidToken();
      const res = await fetchWithAuth(`/orders/buyer/${user.id}`);
      setOrders(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchOrders();
    }
  }, [user]);

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      const data = await fetchWithAuth(`/orders/${orderId}/cancel`, 'PATCH');
      alert(data.message || 'Order cancelled');
      fetchOrders();
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert(err.message || 'Failed to cancel order');
    }
  };

  if (!user) return <div className="p-4 text-center">Please login to view your orders.</div>;

  // ===== Shimmer Skeleton =====
  if (loading)
    return (
      <div className="p-4 max-w-3xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded shadow animate-pulse space-y-2">
            <div className="h-4 bg-gray-300 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            <div className="flex gap-2 mt-2">
              <div className="h-8 w-24 bg-gray-300 rounded"></div>
              <div className="h-8 w-24 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-indigo-600 text-center">Your Orders</h2>

      {orders.length === 0 ? (
        <p className="text-center text-gray-600">No orders yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="bg-white p-4 rounded shadow mb-4">
            <p className="font-semibold">Order ID: {order.id}</p>
            <p>
              Status:{' '}
              <span className={`font-medium ${order.status === 'pending' ? 'text-yellow-600' : 'text-green-600'}`}>
                {order.status}
              </span>
            </p>
            <p>Total: ₦{Number(order.total_amount).toLocaleString()}</p>
            <p>Address: {order.shipping_address}</p>
            <p>Date: {new Date(order.created_at).toLocaleString()}</p>

            {order.order_items?.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold mb-1">Items:</p>
                {order.order_items.map((item, idx) => (
                  <p key={idx}>
                    • {item.quantity} × {item.products?.name || `Product ${item.product_id}`} (₦
                    {Number(item.price).toLocaleString()})
                  </p>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setOpenOrder(openOrder === order.id ? null : order.id)}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
              >
                {openOrder === order.id ? 'Hide Tracking' : 'View Tracking'}
              </button>

              {order.status === 'pending' && (
                <button
                  onClick={() => cancelOrder(order.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                >
                  Cancel Order
                </button>
              )}
            </div>

            {openOrder === order.id && (
              <div className="mt-2 border-t pt-2">
                <Tracking orderId={order.id} />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

