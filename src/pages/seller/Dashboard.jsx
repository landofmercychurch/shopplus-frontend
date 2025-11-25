// src/pages/seller/SellerDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { fetchWithAuth, clearSession } from "../../services/authService";
import SellerChat from "./SellerChat";
import { useAuth } from "../../context/AuthContext.jsx";
import { ProductSearch } from "../../components/seller/ProductSearch";
import { Bell, MessageCircle } from "lucide-react";

// Skeleton Loader Component
const Skeleton = ({ height = 20, width = "100%", className }) => (
  <div
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    style={{ height, width }}
  />
);

export default function SellerDashboard() {
  const { user, rehydrated } = useAuth();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [chatOpen, setChatOpen] = useState(false); // toggle SellerChat modal

  // ---------------- Dashboard data ----------------
  useEffect(() => {
    if (!rehydrated) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "seller") {
      navigate("/");
      return;
    }

    const fetchDashboard = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const storeData = await fetchWithAuth(`/seller/stores/user/${user.id}`);
        if (!storeData?.id) {
          navigate("/seller/setup");
          return;
        }

        const sanitizedStore = Object.fromEntries(
          Object.entries(storeData).map(([k, v]) => [
            k,
            typeof v === "string" ? DOMPurify.sanitize(v) : v,
          ])
        );
        setStore(sanitizedStore);

        const productList = await fetchWithAuth(`/products/store/${storeData.id}`);
        const latestProducts = Array.isArray(productList) ? productList.slice(0, 5) : [];
        setProducts(latestProducts);
        setFilteredProducts(latestProducts);

        const notifData = await fetchWithAuth(`/notifications`);
        const sanitizedNotif = (notifData.notifications || []).map((n) => ({
          ...n,
          title: DOMPurify.sanitize(n.title),
          message: DOMPurify.sanitize(n.message),
        }));
        setNotifications(sanitizedNotif);
        setUnreadCount(sanitizedNotif.filter((n) => !n.is_read).length);
      } catch (err) {
        console.error("❌ Dashboard fetch error:", err);
        setErrorMsg(err.message || "Failed to load dashboard.");
        if ((err.message || "").toLowerCase().includes("token") || (err.message || "").toLowerCase().includes("unauthorized")) {
          clearSession();
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user, rehydrated, navigate]);

  // ---------------- Search ----------------
  const handleSearch = (query) => {
    if (!query) {
      setFilteredProducts(products);
      return;
    }
    const sanitizedQuery = DOMPurify.sanitize(query.toLowerCase());
    setFilteredProducts(products.filter((p) => p.name.toLowerCase().includes(sanitizedQuery)));
  };

  // ---------------- Notifications ----------------
  const markAllRead = async () => {
    try {
      await fetchWithAuth("/notifications/read-all", "PUT");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("❌ Failed to mark notifications as read:", err);
    }
  };

  const markRead = async (id) => {
    try {
      await fetchWithAuth(`/notifications/read/${id}`, "PUT");
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("❌ Failed to mark notification read:", err);
    }
  };

  if (loading || !rehydrated) {
    return (
      <div className="p-4">
        <Skeleton height={30} width="30%" className="mb-4" />
        <Skeleton height={40} className="mb-2" />
        <Skeleton height={40} className="mb-2" />
        <Skeleton height={40} className="mb-2" />
        <Skeleton height={40} className="mb-2" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header */}
      <header className="bg-white shadow-md p-4 flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-indigo-600">Seller Dashboard</h1>
          <p className="text-gray-700 mt-1">{DOMPurify.sanitize(user.full_name)}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-2 md:items-center w-full md:w-auto">
          {store && <ProductSearch onSearch={handleSearch} />}

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="px-3 py-2 rounded relative bg-gray-200 text-gray-700 hover:bg-gray-300 flex items-center gap-1"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50">
                <div className="flex justify-between items-center p-2 border-b">
                  <span className="font-semibold">Notifications</span>
                  <button
                    onClick={markAllRead}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Mark all as read
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-2 text-gray-500 text-sm">No new notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2 border-b hover:bg-gray-50 cursor-pointer ${n.is_read ? "bg-white" : "bg-indigo-50"}`}
                        onClick={() => markRead(n.id)}
                      >
                        <p className="font-medium text-sm">{n.title}</p>
                        <p className="text-xs text-gray-600 truncate">{n.message}</p>
                        <p className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto space-y-6 p-4">
        {!store ? (
          <section className="bg-yellow-50 p-6 rounded mb-6 border border-yellow-200 text-center">
            <h2 className="font-semibold mb-2 text-lg">Set Up Your Store</h2>
            <p className="text-gray-700">You haven’t created your store yet. Click below to set it up!</p>
            <Link
              to="/seller/setup"
              className="mt-3 inline-block bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              Create Store
            </Link>
          </section>
        ) : (
          <>
            {/* Store Card */}
            <section className="bg-white shadow-md rounded p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={store.logo_url || "/store-placeholder.png"}
                  alt={store.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
                <div>
                  <h2 className="text-xl font-semibold">{DOMPurify.sanitize(store.name)}</h2>
                  <p className="text-gray-600">{DOMPurify.sanitize(store.address || "-")}</p>
                  <p className="text-gray-600">
                    ⭐ {store.rating || "4.8"} | 👥 {store.followers || 0} Followers
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Link
                  to={`/seller/store/${store.id}/edit`}
                  className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
                >
                  Edit Store
                </Link>
                <Link
                  to="/seller/products"
                  className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600"
                >
                  Manage Products
                </Link>
                <Link
                  to="/seller/campaigns"
                  className="bg-indigo-500 text-white px-3 py-2 rounded hover:bg-indigo-600"
                >
                  Manage Campaigns
                </Link>
              </div>
            </section>

            {/* Latest Products */}
            <section className="bg-gray-50 rounded p-6 shadow">
              <h3 className="font-semibold mb-4 text-lg">Your Latest Products</h3>
              {filteredProducts.length === 0 ? (
                <p className="text-gray-500">No products match your search.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredProducts.map((p) => (
                    <div key={p.id} className="border p-3 rounded shadow hover:shadow-lg transition">
                      <img
                        src={p.image_url || "/product-placeholder.png"}
                        alt={DOMPurify.sanitize(p.name)}
                        className="w-full h-28 md:h-32 object-cover rounded mb-2"
                      />
                      <h4 className="font-semibold text-sm md:text-base truncate">
                        {DOMPurify.sanitize(p.name)}
                      </h4>
                      <p className="text-gray-600 text-xs md:text-sm">
                        ₦{Number(p.price).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <Link
                to="/seller/products"
                className="mt-4 inline-block text-indigo-600 font-semibold hover:underline"
              >
                View All Products
              </Link>
            </section>
          </>
        )}
      </main>

      {/* ---------------- Floating Chat Button ---------------- */}
      {store && (
        <>
          <button
            className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 bg-blue-600 hover:bg-blue-700 shadow-lg text-white w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-110"
            onClick={() => setChatOpen(true)}
          >
            <MessageCircle size={28} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {chatOpen && <SellerChat storeId={store.id} setActive={() => setChatOpen(false)} />}
        </>
      )}
    </div>
  );
}

