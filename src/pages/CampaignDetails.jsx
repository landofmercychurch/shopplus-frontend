// src/pages/CampaignDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import ProductCard from '../components/ProductCard';

export default function CampaignDetails() {
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/campaigns/${campaignId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch campaign');
        const data = await res.json();
        setCampaign(data);

        const prodRes = await fetch(`${API_BASE}/products?campaign_id=${campaignId}`, {
          credentials: 'include',
        });
        if (!prodRes.ok) throw new Error('Failed to fetch campaign products');
        const prodData = await prodRes.json();
        setProducts(Array.isArray(prodData) ? prodData : []);
      } catch (err) {
        console.error('Campaign fetch error:', err);
        setCampaign(null);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignDetails();
  }, [campaignId, API_BASE]);

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return '';
    }
  };

  const safeText = (text) => DOMPurify.sanitize(text || '');
  const safeUrl = (url) => DOMPurify.sanitize(url || '');

  // ---------------- Skeleton ----------------
  const Skeleton = () => (
    <div className="animate-pulse space-y-4 p-4 max-w-5xl mx-auto">
      <div className="bg-gray-300 w-full h-52 md:h-64 rounded-lg"></div>
      <div className="h-6 bg-gray-300 w-3/4 rounded"></div>
      <div className="h-4 bg-gray-300 w-5/6 rounded"></div>
      <div className="h-4 bg-gray-300 w-2/6 rounded"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="bg-gray-300 h-48 rounded"></div>
        ))}
      </div>
    </div>
  );

  if (loading) return <Skeleton />;
  if (!campaign) return <p className="text-center mt-10 text-red-500">Campaign not found.</p>;

  return (
    <div className="p-4 space-y-6 max-w-5xl mx-auto">
      <div className="relative">
        <img
          src={safeUrl(campaign.banner_url) || '/default-campaigns-banner.png'}
          alt={safeText(campaign.name)}
          className="w-full h-52 md:h-64 object-cover rounded-lg"
        />
        <div className="absolute bottom-2 left-2 bg-indigo-600 text-white px-3 py-1 rounded font-semibold">
          {campaign.discount_percent ?? 0}% OFF
        </div>
      </div>

      <h2 className="text-2xl font-bold">{safeText(campaign.name)}</h2>
      <p className="text-gray-700">{safeText(campaign.description) || 'No description available.'}</p>
      <p className="text-sm text-gray-500">
        {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
      </p>

      <div className="mt-2">
        <Link
          to={`/store/${campaign.store_id}`}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
        >
          Visit Store
        </Link>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-2">Products in this Campaign</h3>
      {products.length === 0 ? (
        <p className="text-gray-500">No products available in this campaign.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

