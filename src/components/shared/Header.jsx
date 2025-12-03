// src/components/shared/Header.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { fetchWithAuth } from '../../services/buyerAuthService';
import { Search, X, Heart, ShoppingCart } from 'lucide-react';
import { useBuyerAuth } from '../../context/BuyerAuthContext';
import Notifications from '../Notifications';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:5000';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout, rehydrated } = useBuyerAuth();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Counts
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Fetch wishlist count
  const fetchWishlistCount = async () => {
    if (!user) return;
    try {
      const res = await fetchWithAuth(`/favourites/${user.id}`);
      setWishlistCount(Array.isArray(res) ? res.length : 0);
    } catch (err) {
      console.error('Wishlist fetch error:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchWishlistCount();
    const handleUpdate = () => fetchWishlistCount();
    window.addEventListener('wishlist-updated', handleUpdate);
    return () => window.removeEventListener('wishlist-updated', handleUpdate);
  }, [user]);

  // Fetch cart count
  useEffect(() => {
    if (!user) return;
    const fetchCart = async () => {
      try {
        const res = await fetchWithAuth('/cart/count');
        setCartCount(res?.count || 0);
      } catch (err) {
        console.error('Cart fetch error:', err);
      }
    };
    fetchCart();
  }, [user]);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setDropdownVisible(false);
      return;
    }
    const delay = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ query: searchQuery.trim(), limit: 5 });
        const res = await fetch(`${API_BASE}/search?${params.toString()}`);
        const data = await res.json();
        const results = [...(data.products || []), ...(data.stores || [])];

        setSearchResults(
          results.map(item => ({ ...item, name: DOMPurify.sanitize(item.name || '') }))
        );

        setDropdownVisible(results.length > 0);
      } catch (err) {
        console.error('Search error:', err);
        setDropdownVisible(false);
      }
    }, 350);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  return (
    <header className="sticky top-0 z-50 w-full shadow bg-white">
      {/* Top Promo Bar */}
      <div className="bg-indigo-600 text-white px-6 py-1 flex justify-between items-center text-sm font-medium">
        <span>SAVE MORE ON APP</span>
        <div className="flex gap-4">
          <span className="cursor-pointer hover:underline" onClick={() => navigate('/customer-care')}>Customer Care</span>
          <span className="cursor-pointer hover:underline" onClick={() => navigate('/track-order')}>Track my order</span>
          {!user && (
            <Link to="/seller/login" className="hover:underline">
  Seller Center
</Link>
          )}
        </div>
      </div>

      {/* Main Header */}
      <div className="px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/shopplus_logo.png" alt="ShopPlus Logo" className="h-10 md:h-12" />
          <span className="text-2xl font-bold text-indigo-600">ShopPlus</span>
        </Link>

        {/* Search */}
        <div className="flex-1 relative w-full md:mx-6">
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products, stores, campaigns..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
          {dropdownVisible && (
            <ul className="absolute bg-white shadow-lg rounded mt-1 w-full z-50 max-h-60 overflow-y-auto">
              {searchResults.map((item, idx) => (
                <li
                  key={idx}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() =>
                    navigate(item.type === 'store' ? `/store/${item.id}` : `/product/${item.id}`)
                  }
                >
                  {item.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {user && rehydrated ? (
            <>
              <Notifications />
              <div className="relative cursor-pointer" onClick={() => navigate('/wishlist')}>
                <Heart className="w-5 h-5 text-red-500" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">{wishlistCount}</span>
                )}
              </div>

              <div className="relative cursor-pointer" onClick={() => navigate('/cart')}>
                <ShoppingCart className="w-5 h-5 text-green-500" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">{cartCount}</span>
                )}
              </div>

              <span className="font-medium">{user.full_name || user.email}</span>

              <button
                onClick={logout}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600">
                Login
              </Link>
              <Link to="/signup" className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

