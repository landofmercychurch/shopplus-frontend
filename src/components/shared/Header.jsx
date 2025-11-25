// src/components/shared/Header.jsx
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { fetchWithAuth } from '../../services/authService';
import { Search, X, Heart, ShoppingCart } from 'lucide-react';
import Notifications from '../Notifications';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:5000';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  // ===== AUTH CONTEXT =====
  const { user, logout, rehydrated } = useAuth();

  // ===== SEARCH =====
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // ===== COUNTS =====
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const isSellerPage = location.pathname.startsWith('/seller');
  const isSellerSetupPage = location.pathname === '/seller/setup';

  // ----------------- Wishlist Count -----------------
  const fetchWishlistCount = async () => {
    if (!user) return;
    try {
      const res = await fetchWithAuth(`/favourites/${user.id}`);
      setWishlistCount(Array.isArray(res) ? res.length : 0);
    } catch (err) {
      console.error("Wishlist fetch error:", err);
    }
  };

  // React to global wishlist updates
  useEffect(() => {
    if (!user) return;

    fetchWishlistCount();

    const handleUpdate = () => fetchWishlistCount();
    window.addEventListener('wishlist-updated', handleUpdate);
    return () => window.removeEventListener('wishlist-updated', handleUpdate);
  }, [user]);

  // ----------------- Cart Count -----------------
  useEffect(() => {
    if (!user) return;

    const fetchCart = async () => {
      try {
        const res = await fetchWithAuth('/cart/count');
        setCartCount(res?.count || 0);
      } catch (err) {
        console.error("Cart fetch error:", err);
      }
    };

    fetchCart();
  }, [user]);

  // ----------------- Search Logic -----------------
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
          results.map(item => ({
            ...item,
            name: DOMPurify.sanitize(item.name || ''),
          }))
        );

        setDropdownVisible(results.length > 0);
      } catch (err) {
        console.error("Search error:", err);
        setDropdownVisible(false);
      }
    }, 350);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  // ----------------- WAIT FOR CONTEXT REHYDRATION -----------------
  if (!rehydrated) return null;

  return (
    <header className="bg-white shadow sticky top-0 z-50 p-4 flex flex-col md:flex-row justify-between items-center">
      {/* BRONZE GRADIENT DEFINITION */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="bronze-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b87333" />
            <stop offset="50%" stopColor="#cd7f32" />
            <stop offset="100%" stopColor="#8c4a0c" />
          </linearGradient>
        </defs>
      </svg>

      {/* LOGO */}
      <Link
        to={user?.role === 'seller' ? '/seller/dashboard' : '/'}
        className="flex items-center gap-2 mb-2 md:mb-0"
      >
        <img src="/shopplus_logo.png" alt="ShopPlus Logo" className="h-10" />
        <span className="text-xl font-bold text-indigo-600">ShopPlus</span>
      </Link>

      {/* SEARCH */}
      {!isSellerPage || isSellerSetupPage ? (
        <div className="flex-1 relative w-full md:mx-4">
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products, stores, campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            <ul className="absolute bg-white shadow-md rounded mt-1 w-full z-50 max-h-60 overflow-y-auto">
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
      ) : null}

      {/* ACTION ICONS */}
      <div className="flex items-center gap-4 mt-2 md:mt-0">
        {user ? (
          <>
            {/* Notifications */}
            <div className="relative cursor-pointer">
              <Notifications />
            </div>

            {/* Wishlist */}
            <div className="relative cursor-pointer" onClick={() => navigate('/wishlist')}>
              <Heart
                className="w-5 h-5"
                style={{
                  fill: 'url(#bronze-gradient)',
                  stroke: '#b87333',
                  filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))',
                }}
              />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </div>

            {/* Cart */}
            <div className="relative cursor-pointer" onClick={() => navigate('/cart')}>
              <ShoppingCart
                className="w-5 h-5"
                style={{
                  fill: 'url(#bronze-gradient)',
                  stroke: '#b87333',
                  filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))',
                }}
              />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">
                  {cartCount}
                </span>
              )}
            </div>

            <span className="font-medium">{user.full_name || user.email}</span>

            {user.role === 'seller' && (
              <Link
                to="/seller/dashboard"
                className="px-3 py-1 rounded text-gray-700 hover:text-indigo-600 font-medium"
              >
                Dashboard
              </Link>
            )}

            <button
              onClick={logout}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="bg-indigo-500 text-white px-3 py-1 rounded">
              Login
            </Link>
            <Link to="/signup" className="bg-green-500 text-white px-3 py-1 rounded">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

