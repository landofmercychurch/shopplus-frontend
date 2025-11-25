// src/pages/buyer/StorePage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { useAuth } from "../../context/AuthContext.jsx";

import ProductCard from "../../components/ProductCard.jsx";
import CampaignCard from "../../components/buyer/CampaignCard.jsx";
import FollowButton from "../../components/buyer/FollowButton.jsx";
import BuyerChat from "../../components/buyer/Chat.jsx";

export default function StorePage() {
  const { user: authUser, activeStore, setActiveStore } = useAuth();
  const { id } = useParams();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("products");
  const [isChatOpen, setIsChatOpen] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // ----------------- Skeleton Loader -----------------
  const Skeleton = () => (
    <div className="p-4 max-w-6xl mx-auto animate-pulse space-y-4">
      <div className="bg-gray-300 w-full h-56 md:h-72 rounded-lg"></div>
      <div className="flex gap-4 items-center mt-4">
        <div className="bg-gray-300 w-20 h-20 rounded-full border-4 border-white"></div>
        <div className="space-y-2 flex-1">
          <div className="bg-gray-300 h-6 w-3/4 rounded"></div>
          <div className="bg-gray-300 h-4 w-2/3 rounded"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="bg-gray-300 h-48 rounded"></div>
        ))}
      </div>
    </div>
  );

  // ----------------- Fetch Store Data -----------------
  const fetchAllData = async () => {
    setLoading(true);

    try {
      // Fetch store info
      const storeRes = await fetch(`${API_BASE}/buyer/stores/${id}`);
      if (!storeRes.ok) throw new Error(`Store fetch failed: ${storeRes.status}`);
      const storeData = await storeRes.json();
      if (!storeData) throw new Error("Store not found");

      // Sanitize store fields
      Object.keys(storeData).forEach((key) => {
        if (typeof storeData[key] === "string") {
          storeData[key] = DOMPurify.sanitize(storeData[key]);
        }
      });
      setStore(storeData);

      // Fetch products
      const productsRes = await fetch(`${API_BASE}/buyer/stores/${id}/products`);
      const productsData = await productsRes.json();
      setProducts(
        (productsData || []).map((p) => ({
          ...p,
          name: DOMPurify.sanitize(p.name),
          description: DOMPurify.sanitize(p.description || ""),
        }))
      );

      // Fetch campaigns
      const campaignsRes = await fetch(`${API_BASE}/campaigns/public/store/${id}`);
      const campaignsData = await campaignsRes.json();
      setCampaigns(
        (campaignsData || []).map((c) => ({
          ...c,
          title: DOMPurify.sanitize(c.title),
          description: DOMPurify.sanitize(c.description || ""),
        }))
      );

      // Fetch followers count
      const followersRes = await fetch(`${API_BASE}/followers/${id}/count`);
      const followersData = await followersRes.json();
      setFollowersCount(followersData?.followersCount || 0);
    } catch (err) {
      console.error("❌ StorePage fetch error:", err);
      setStore(null);
      setProducts([]);
      setCampaigns([]);
      setFollowersCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchAllData();
  }, [id]);

  // ----------------- Handlers -----------------
  const handleChatSeller = () => {
    if (!authUser) return alert("You must be logged in to chat with the seller.");
    if (!store?.user_id) return alert("Cannot chat: seller info missing.");

    setActiveStore({ id: store.id, sellerId: store.user_id });
    setIsChatOpen(true);
  };

  const closeChat = () => setIsChatOpen(false);

  // ----------------- Render -----------------
  if (loading) return <Skeleton />;
  if (!store) return <p className="text-center mt-10 text-red-500">Store not found.</p>;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="relative w-full h-56 md:h-72 overflow-hidden">
        <img
          src={store.banner_url || "/store-banner-placeholder.jpg"}
          alt={store.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="absolute bottom-0 left-4 flex items-end gap-4 pb-4 z-20">
          <img
            src={store.logo_url || "/store-placeholder.png"}
            alt={store.name}
            className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-lg object-cover"
          />
          <div className="text-white drop-shadow-md">
            <h1 className="text-2xl md:text-3xl font-bold">{store.name}</h1>
            <p className="text-sm md:text-base">{store.address}</p>
            <div className="flex gap-4 mt-1 text-sm md:text-base">
              <span>⭐ {store.rating || "0.0"}</span>
              <span>📦 {products.length} Products</span>
              <span>👥 {followersCount} Followers</span>
            </div>
          </div>
        </div>
      </div>

      {/* SOCIAL LINKS */}
      <div className="px-4 md:px-6 mt-3 flex gap-3">
        {store.facebook_url && (
          <a href={store.facebook_url} target="_blank" rel="noopener noreferrer">
            <img src="/icons/facebook.svg" className="w-6 h-6" />
          </a>
        )}
        {store.instagram_url && (
          <a href={store.instagram_url} target="_blank" rel="noopener noreferrer">
            <img src="/icons/instagram.svg" className="w-6 h-6" />
          </a>
        )}
        {store.tiktok_url && (
          <a href={store.tiktok_url} target="_blank" rel="noopener noreferrer">
            <img src="/icons/tiktok.svg" className="w-6 h-6" />
          </a>
        )}
        {store.website_url && (
          <a href={store.website_url} target="_blank" rel="noopener noreferrer">
            <img src="/icons/website.svg" className="w-6 h-6" />
          </a>
        )}
      </div>

      {/* ACTIONS */}
      <div className="px-4 md:px-6 py-4 flex gap-4 bg-white border-b">
        <button
          onClick={handleChatSeller}
          className="flex-1 bg-indigo-500 text-white py-2 rounded hover:bg-indigo-600"
        >
          Chat Seller
        </button>
        <FollowButton storeId={id} initialFollowersCount={followersCount} />
      </div>

      {/* TABS */}
      <div className="px-4 md:px-6 py-2 bg-white sticky top-0 z-10 border-b flex gap-4 overflow-x-auto">
        {["products", "campaigns", "policies"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-2 px-4 rounded-full ${
              tab === t
                ? "bg-indigo-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="p-4 md:p-6">
        {tab === "products" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.length ? (
              products.map((p) => <ProductCard key={p.id} product={p} />)
            ) : (
              <p className="col-span-full text-gray-500">No products available.</p>
            )}
          </div>
        )}

        {tab === "campaigns" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {campaigns.length ? (
              campaigns.map((c) => <CampaignCard key={c.id} campaign={c} />)
            ) : (
              <p className="col-span-full text-gray-500">No campaigns available.</p>
            )}
          </div>
        )}

        {tab === "policies" && (
          <div className="bg-white rounded shadow p-4 space-y-4">
            <h2 className="font-semibold text-lg">Shipping Policy</h2>
            <p>{store.shipping_policy || "No shipping policy provided."}</p>
            <h2 className="font-semibold text-lg">Return Policy</h2>
            <p>{store.return_policy || "No return policy provided."}</p>
            <h2 className="font-semibold text-lg">Opening Hours</h2>
            <p>{store.opening_hours || "Not specified"}</p>
            {store.description && (
              <>
                <h2 className="font-semibold text-lg">About Store</h2>
                <p>{store.description}</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* CHAT MODAL */}
      {isChatOpen && store && authUser && (
        <div
          className="fixed bottom-16 right-0 z-50 w-full md:w-96 max-h-[80vh] flex flex-col bg-white shadow-lg rounded-t-lg border border-gray-200"
        >
          <div className="flex items-center justify-between bg-indigo-500 text-white px-4 py-2 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                <img
                  src={store.logo_url || "/store-placeholder.png"}
                  alt={store.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-semibold">{store.name}</span>
            </div>
            <button
              onClick={closeChat}
              className="text-white hover:text-gray-200 text-xl font-bold"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <BuyerChat
              storeId={store.id}
              userId={authUser.id}
              setActiveStore={setActiveStore}
            />
          </div>
        </div>
      )}
    </div>
  );
}

