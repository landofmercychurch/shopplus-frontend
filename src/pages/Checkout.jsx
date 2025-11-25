import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function Checkout({ onCartUpdateRef }) {
  const { user, loading: authLoading } = useAuth(); // ✅ use context
  const [address, setAddress] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState('cod');
  const [processingPayment, setProcessingPayment] = useState(false);

  const navigate = useNavigate();

  const formatPrice = (price) => '₦' + price.toLocaleString();

  // Fetch cart when user is available
  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/login');
      return;
    }
    if (!user) return;

    const fetchCart = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth('/cart'); // auth handled by cookies
        setCartItems(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error('❌ Error fetching cart:', err);
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [user, authLoading]);

  const total = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * (item.quantity || 0),
    0
  );

  // Checkout handler
  const handleCheckout = async () => {
    if (!user) return alert('Please login first.');
    if (!address.trim()) return alert('Please enter shipping address.');
    if (cartItems.length === 0) return alert('Your cart is empty.');

    setProcessingPayment(true);
    try {
      const orderRes = await fetchWithAuth('/orders', 'POST', {
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        })),
        total_amount: total,
        shipping_address: address,
        payment_method: selectedPayment,
      });

      const orderData = orderRes?.order;
      if (!orderData) throw new Error('Failed to place order');

      if (selectedPayment !== 'cod') {
        await fetchWithAuth('/payments', 'POST', {
          order_id: orderData.id,
          amount: total,
          method: selectedPayment,
          transaction_ref: 'txn_' + Date.now(),
        });
        navigate(`/payment/${orderData.id}`);
      } else {
        alert('✅ Order placed successfully! Cash on Delivery selected.');
        navigate('/orders');
      }

      if (onCartUpdateRef?.current) onCartUpdateRef.current();
    } catch (err) {
      console.error('❌ Checkout failed:', err);
      alert(err.message || 'Checkout failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (authLoading) return <div className="p-4">Checking authentication...</div>;
  if (!user) return null; // already redirecting
  if (loading) return <div className="p-4">Loading checkout...</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Checkout</h2>

      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="bg-white p-4 rounded shadow mb-4 space-y-3">
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between items-center border-b pb-2">
              <p>{item.name}</p>
              <span>{formatPrice(Number(item.price) * item.quantity)}</span>
            </div>
          ))}

          <div className="text-right font-bold">Total: {formatPrice(total)}</div>

          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter shipping address..."
            className="w-full p-2 border rounded mb-4"
          />

          {/* Payment Method */}
          <div className="mb-4">
            <h3 className="font-semibold mb-1">Payment Method</h3>
            <p className="text-xs text-yellow-600 mb-2">
              ⚠️ More payment options coming soon — only Cash on Delivery is currently available.
            </p>

            <label
              className={`border rounded p-2 cursor-pointer ${
                selectedPayment === 'cod' ? 'border-blue-600 bg-blue-50' : ''
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={selectedPayment === 'cod'}
                onChange={() => setSelectedPayment('cod')}
                className="mr-2"
              />
              <span className="font-semibold">Cash on Delivery</span>
              <span className="ml-2 text-gray-500 text-sm">
                Pay when you receive your order
              </span>
            </label>
          </div>

          <button
            onClick={handleCheckout}
            disabled={processingPayment}
            className={`w-full py-2 px-4 rounded text-white ${
              processingPayment ? 'bg-gray-400' : 'bg-blue-600'
            }`}
          >
            {processingPayment ? 'Processing...' : 'Place Order'}
          </button>
        </div>
      )}
    </div>
  );
}

