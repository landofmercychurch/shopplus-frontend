// src/pages/Wishlist.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../services/authService';

export default function Wishlist() {
  const { user, loading: authLoading } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const navigate = useNavigate();

  // -------------------- Fetch wishlist --------------------
  const fetchWishlist = async () => {
    if (!user || user.role !== 'buyer') return;

    try {
      const data = await fetchWithAuth(`/favourites/${user.id}`, 'GET');
      setWishlist(
        Array.isArray(data)
          ? data.map((item) => ({
              id: item.product_id,
              name: DOMPurify.sanitize(item.products?.name || '', {
                ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
              }),
              price: item.products?.price,
              image_url: DOMPurify.sanitize(item.products?.image_url || ''),
            }))
          : []
      );
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch immediately on mount
  useEffect(() => {
    if (!user || authLoading) return;
    fetchWishlist();
  }, [user, authLoading]);

  // -------------------- Remove item --------------------
  const handleRemove = async (productId) => {
    if (!user?.id) return alert('You must be logged in.');

    try {
      await fetchWithAuth(`/favourites/${user.id}/${productId}`, 'DELETE');
      setWishlist((prev) => prev.filter((item) => item.id !== productId));
      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      alert(err.message || 'Failed to remove item from wishlist.');
    }
  };

  // -------------------- Buy / Add to Cart --------------------
  const handleBuyNow = async (product) => {
    if (!user?.id) return alert('Please login or sign up to purchase.');

    setActionLoading((prev) => ({ ...prev, [product.id]: true }));

    try {
      await fetchWithAuth('/cart', 'POST', { product_id: product.id, quantity: 1 });
      alert(`${DOMPurify.sanitize(product.name)} added to cart!`);
      navigate('/cart');
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add product to cart.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  // -------------------- UI --------------------
  if (authLoading) return <p className="p-4">Loading...</p>;
  if (!user) return <p className="p-4">Please login to view your wishlist.</p>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Wishlist</h2>

      {/* ----------------- Shimmer / Skeleton ----------------- */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded p-2 animate-pulse flex flex-col">
              <div className="w-full h-48 bg-gray-200 rounded mb-2" />
              <div className="h-5 bg-gray-200 rounded mb-1 w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="flex justify-between mt-2">
                <div className="w-1/2 h-6 bg-gray-300 rounded" />
                <div className="w-1/2 h-6 bg-gray-300 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : wishlist.length === 0 ? (
        <p>No items in your wishlist.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {wishlist.map((item) => (
            <div key={item.id} className="border rounded p-2 relative flex flex-col">
              <img
                src={item.image_url || '/product-placeholder.png'}
                alt={item.name}
                className="w-full h-48 object-cover rounded cursor-pointer"
                onClick={() => navigate(`/product/${item.id}`)}
              />
              <h3
                className="font-semibold mt-2"
                dangerouslySetInnerHTML={{ __html: item.name }}
              />
              <p>₦{item.price?.toLocaleString()}</p>

              <div className="flex justify-between mt-2">
                <button
                  onClick={() => handleRemove(item.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  Remove
                </button>

                <button
                  onClick={() => handleBuyNow(item)}
                  disabled={actionLoading[item.id]}
                  className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading[item.id] ? 'Adding...' : 'Buy Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

