import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import ProductCard from '../components/ProductCard';
import StoreCard from '../components/buyer/StoreCard';
import CampaignCard from '../components/buyer/CampaignCard';
import CampaignHeroCard from '../components/buyer/CampaignHeroCard';
import CategoryCard from '../components/buyer/CategoryCard';
import Footer from '../components/shared/Footer';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchWithAuth } from '../services/authService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function Home() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [storeCampaigns, setStoreCampaigns] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const secondaryRef = useRef(null);
  const categoriesRef = useRef(null);
  const featuredRef = useRef(null);

  // -------------------- Fetch all public data --------------------
  useEffect(() => {
    const fetchAll = async () => {
      try {
        await Promise.all([
          fetchStores(),
          fetchCategories(),
          fetchProducts(),
        ]);
      } catch (err) {
        console.error('Home fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // -------------------- Auto-scroll --------------------
  useEffect(() => {
    if (!loading) startAutoScroll();
  }, [loading]);

  const startAutoScroll = () => {
    const scrollContainers = [secondaryRef.current, categoriesRef.current, featuredRef.current];
    scrollContainers.forEach((container) => {
      if (!container) return;
      let scrollAmount = 0;
      const scrollWidth = container.scrollWidth - container.clientWidth;
      const step = 1;
      const interval = setInterval(() => {
        scrollAmount += step;
        if (scrollAmount >= scrollWidth) scrollAmount = 0;
        container.scrollTo({ left: scrollAmount, behavior: 'smooth' });
      }, 20);
      return () => clearInterval(interval);
    });
  };

  // -------------------- Fetch Functions --------------------
  const fetchProducts = async () => {
    try {
      const res = user
        ? await fetchWithAuth('/products')
        : await fetch(`${API_BASE}/products`).then(r => r.json());
      setProducts(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts([]);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await fetch(`${API_BASE}/buyer/stores`).then(r => r.json());
      const topStores = Array.isArray(res) ? res.slice(0, 4) : [];
      setStores(topStores);
      await fetchCampaignsForStores(topStores);
    } catch (err) {
      console.error('Error fetching stores:', err);
      setStores([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`).then(r => r.json());
      setCategories(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  };

  const fetchCampaignsForStores = async (storesList) => {
    try {
      const campaignsByStore = {};
      await Promise.all(
        storesList.map(async (store) => {
          const res = await fetch(`${API_BASE}/campaigns/public/store/${store.id}`).then(r => r.json());
          campaignsByStore[store.id] = Array.isArray(res) ? res : [];
        })
      );
      setStoreCampaigns(campaignsByStore);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setStoreCampaigns({});
    }
  };

  // -------------------- Shimmer Skeletons --------------------
  const SkeletonCard = ({ width = 'w-36', height = 'h-44' }) => (
    <div className={`flex-shrink-0 ${width} ${height} bg-gray-200 rounded animate-pulse`}></div>
  );

  const SkeletonGrid = ({ count = 4 }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="p-4 space-y-8">
        <SkeletonCard width="w-full" height="h-64" /> {/* Hero */}
        <div>
          <h2 className="text-2xl font-bold mb-2 animate-pulse bg-gray-200 w-40 h-6 rounded"></h2>
          <div className="flex gap-4 overflow-x-auto">
            {Array.from({ length: 6 }).map((_, idx) => <SkeletonCard key={idx} />)}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2 animate-pulse bg-gray-200 w-40 h-6 rounded"></h2>
          <SkeletonGrid count={4} />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2 animate-pulse bg-gray-200 w-40 h-6 rounded"></h2>
          <div className="flex gap-4 overflow-x-auto">
            {Array.from({ length: 8 }).map((_, idx) => <SkeletonCard key={idx} />)}
          </div>
        </div>
      </div>
    );
  }

  const allCampaigns = stores.flatMap((store) => storeCampaigns[store.id] || []);
  const [heroCampaign, ...secondaryCampaigns] = allCampaigns;

  return (
    <>
      <div className="p-4 pb-20 space-y-8">
        {/* ===================== Hero Campaign ===================== */}
        {heroCampaign && (
          <CampaignHeroCard campaigns={allCampaigns.map(c => ({ ...c, title: DOMPurify.sanitize(c.title) }))} />
        )}

        {/* ===================== Secondary Campaigns ===================== */}
        {secondaryCampaigns.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">More Promotions</h2>
            <div ref={secondaryRef} className="flex overflow-x-auto space-x-4 py-2 scroll-smooth">
              {secondaryCampaigns.map((campaign) => (
                <Link key={campaign.id} to={`/campaign/${campaign.id}`} className="flex-shrink-0 w-44">
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <CampaignCard campaign={{ ...campaign, title: DOMPurify.sanitize(campaign.title) }} loading={false} />
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ===================== Categories ===================== */}
       {/* ===================== Categories ===================== */}
{categories.length > 0 && (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold">Categories</h2>
    <div ref={categoriesRef} className="flex gap-4 overflow-x-auto py-2 scroll-smooth">
      {categories.map((cat) => (
        <CategoryCard
          key={cat.id}
          category={{ ...cat, name: DOMPurify.sanitize(cat.name) }}
        />
      ))}
    </div>
  </div>
)}


        {/* ===================== Top Stores ===================== */}
        {stores.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Top Stores</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {stores.map((store) => (
                <StoreCard key={store.id} store={{ ...store, name: DOMPurify.sanitize(store.name) }} />
              ))}
            </div>
          </div>
        )}

        {/* ===================== Featured Products ===================== */}
        {products.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <div ref={featuredRef} className="flex overflow-x-auto space-x-4 py-2 scroll-smooth">
              {products.slice(0, 8).map((product) => (
                <motion.div key={product.id} className="flex-shrink-0 w-36" whileHover={{ scale: 1.05 }}>
                  <ProductCard product={{ ...product, name: DOMPurify.sanitize(product.name) }} token={user ? user.token : null} />
                </motion.div>
              ))}
            </div>

            <h2 className="text-2xl font-bold mt-6">All Products</h2>
            <div className="flex overflow-x-auto space-x-4 py-2 scroll-smooth">
              {products.map((product) => (
                <motion.div key={product.id} className="flex-shrink-0 w-36" whileHover={{ scale: 1.05 }}>
                  <ProductCard product={{ ...product, name: DOMPurify.sanitize(product.name) }} token={user ? user.token : null} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

