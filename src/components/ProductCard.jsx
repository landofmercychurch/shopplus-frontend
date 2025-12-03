// src/components/ProductCard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { fetchWithAuth } from '../services/buyerAuthService.js';
import { useBuyerAuth } from '../context/BuyerAuthContext.jsx';

export default function ProductCard({ product }) {
  const { user } = useBuyerAuth();
  const [loading, setLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // -------------------- Wishlist service --------------------
  const wishlistService = {
    getAll: async (currentUser) => {
      if (!currentUser?.id) throw new Error('User not logged in');
      if (currentUser.role !== 'buyer') throw new Error('Only buyers can use the wishlist');
      return fetchWithAuth(`/favourites/${currentUser.id}`, 'GET');
    },
    add: async (productId, currentUser) => {
      if (!currentUser?.id) throw new Error('User not logged in');
      if (currentUser.role !== 'buyer') throw new Error('Only buyers can use the wishlist');
      return fetchWithAuth('/favourites', 'POST', { buyer_id: currentUser.id, product_id: productId });
    },
    remove: async (productId, currentUser) => {
      if (!currentUser?.id) throw new Error('User not logged in');
      if (currentUser.role !== 'buyer') throw new Error('Only buyers can use the wishlist');
      return fetchWithAuth('/favourites', 'DELETE', { buyer_id: currentUser.id, product_id: productId });
    },
  };

  // -------------------- Load wishlist status --------------------
  useEffect(() => {
    if (!user) return setIsWishlisted(false);

    const loadWishlist = async () => {
      try {
        const wishlist = await wishlistService.getAll(user);
        const productIds = wishlist.map((item) => item.product_id || item.id);
        setIsWishlisted(productIds.includes(product.id));
      } catch (err) {
        console.error('Wishlist load error:', err);
      }
    };

    loadWishlist();
    const handleWishlistUpdate = () => loadWishlist();
    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    return () => window.removeEventListener('wishlist-updated', handleWishlistUpdate);
  }, [product.id, user]);

  // -------------------- Toggle wishlist --------------------
  const toggleWishlist = async () => {
    if (!user) return alert('Please login to use wishlist.');

    const prevState = isWishlisted;
    setIsWishlisted(!prevState); // optimistic update

    try {
      if (prevState) await wishlistService.remove(product.id, user);
      else await wishlistService.add(product.id, user);

      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (err) {
      console.error('Wishlist error:', err);
      alert(err.message || 'Something went wrong updating wishlist.');
      setIsWishlisted(prevState);
    }
  };

  // -------------------- Buy now --------------------
  const handleBuyNow = async () => {
    if (!user) return alert('Please login or sign up to purchase this product.');
    setLoading(true);

    try {
      await fetchWithAuth('/cart', 'POST', { product_id: product.id, quantity: 1 });
      alert(`${product.name} added to cart successfully!`);
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Helper --------------------
  const formatPrice = (amount) =>
    amount != null
      ? Number(amount).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })
      : '';

  const hasDiscount = product.old_price && product.old_price > product.price;

  // -------------------- UI --------------------
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition flex flex-col w-full relative">
      {/* Wishlist Button */}
      <button
        onClick={toggleWishlist}
        aria-label="Toggle wishlist"
        className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow z-50"
      >
        <Heart size={20} className={isWishlisted ? 'fill-red-600 text-red-600' : 'text-gray-500'} />
      </button>

      {/* Campaign Badge */}
      {product.campaign_name && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded z-40">
          {product.campaign_name} - {product.discount_percent}%
        </div>
      )}

      {/* Product Link */}
      <Link to={`/product/${product.id}`} className="flex-1">
        <div className="relative w-full h-40 sm:h-44 md:h-48 bg-gray-100 overflow-hidden rounded-t-xl">
          {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-gray-200" />}
          <img
            src={product.image_url || '/product-placeholder.png'}
            alt={product.name || 'Product Image'}
            className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImgLoaded(true)}
          />
        </div>

        <div className="p-3 flex flex-col gap-1">
          <h2 className="text-gray-900 font-medium text-xs sm:text-sm truncate">{product.name}</h2>
          <div className="flex items-center gap-1">
            {hasDiscount && (
              <span className="line-through text-gray-400 text-xs sm:text-sm">{formatPrice(product.old_price)}</span>
            )}
            <span className={`font-bold ${hasDiscount ? 'text-red-600' : 'text-indigo-600'} text-xs sm:text-sm`}>
              {formatPrice(product.price)}
            </span>
          </div>
        </div>
      </Link>

      <button
        onClick={handleBuyNow}
        disabled={loading}
        className="bg-green-600 text-white font-medium text-xs sm:text-sm py-2 hover:bg-green-700 transition disabled:opacity-50 rounded-b-xl"
      >
        {loading ? 'Adding...' : 'Buy Now'}
      </button>
    </div>
  );
}

