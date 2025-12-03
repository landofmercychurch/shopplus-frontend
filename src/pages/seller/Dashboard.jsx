// Dashboard.jsx - UPDATED WITH CHAT MODAL
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import axiosSeller from "../../utils/axiosSeller";
import { useSellerAuth } from "../../context/SellerAuthContext.jsx";
import { ProductSearch } from "../../components/seller/ProductSearch";
import { Bell, Loader2, AlertCircle, MessageSquare } from "lucide-react";
import SellerChat from "./SellerChat"; // Import the chat component

// Skeleton Loader
const Skeleton = ({ height = 20, width = "100%", className }) => (
  <div
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    style={{ height, width }}
  />
);

export default function SellerDashboard() {
  console.log("[SellerDashboard] Component mounted");
  
  const { user, rehydrated, logout } = useSellerAuth();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  // Chat Modal
  const [chatOpen, setChatOpen] = useState(false);

  // Debug: Log state changes
  useEffect(() => {
    console.log("[SellerDashboard] State updated:", {
      store: store ? { id: store.id, name: store.name } : null,
      productsCount: products.length,
      filteredProductsCount: filteredProducts.length,
      loading,
      errorMsg,
      notificationsCount: notifications.length,
      unreadCount,
      chatOpen
    });
  }, [store, products, filteredProducts, loading, errorMsg, notifications, unreadCount, chatOpen]);

  // ----------------------------
  // Load Dashboard Data
  // ----------------------------
  useEffect(() => {
    console.log("[SellerDashboard] useEffect triggered, rehydrated:", rehydrated);
    
    if (!rehydrated) {
      console.log("[SellerDashboard] Auth not rehydrated yet, skipping load");
      return;
    }

    if (!user) {
      console.warn("[SellerDashboard] No user found, redirecting to login");
      navigate("/seller/login");
      return;
    }

    if (user.role !== "seller") {
      console.warn("[SellerDashboard] User is not a seller, role:", user.role);
      navigate("/");
      return;
    }

    console.log("[SellerDashboard] Starting dashboard load for seller:", {
      userId: user.id,
      email: user.email,
      has_store: user.has_store
    });

    const loadDashboard = async () => {
      console.log("[SellerDashboard] loadDashboard function started");
      setLoading(true);
      setErrorMsg("");

      try {
        // 1. Fetch store
        console.log("[SellerDashboard] Step 1: Fetching store data...");
        const storeResponse = await axiosSeller.get(`/seller/stores/user/${user.id}`);
        const storeData = storeResponse.data;
        
        console.log("[SellerDashboard] Store fetch response:", {
          success: !!storeData,
          hasId: !!storeData?.id,
          status: storeResponse.status
        });

        if (!storeData?.id) {
          console.warn("[SellerDashboard] No store found, redirecting to setup");
          navigate("/seller/setup");
          return;
        }

        console.log("[SellerDashboard] Store found:", {
          id: storeData.id,
          name: storeData.name
        });

        const sanitizedStore = Object.fromEntries(
          Object.entries(storeData).map(([k, v]) => [
            k,
            typeof v === "string" ? DOMPurify.sanitize(v) : v,
          ])
        );

        setStore(sanitizedStore);
        console.log("[SellerDashboard] Store state updated");

        // 2. Fetch products
        console.log("[SellerDashboard] Step 2: Fetching products...");
        const productsResponse = await axiosSeller.get(`/products/store/${storeData.id}`);
        const productList = productsResponse.data;
        
        console.log("[SellerDashboard] Products fetch response:", {
          isArray: Array.isArray(productList),
          count: Array.isArray(productList) ? productList.length : 0,
          status: productsResponse.status
        });

        const latestProducts = Array.isArray(productList)
          ? productList.slice(0, 5)
          : [];

        console.log("[SellerDashboard] Latest products to display:", latestProducts.length);
        setProducts(latestProducts);
        setFilteredProducts(latestProducts);

        // 3. Fetch SELLER notifications
        await loadSellerNotifications();

        console.log("[SellerDashboard] Dashboard load completed successfully");

      } catch (err) {
        console.error("[SellerDashboard] Dashboard load error:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data
        });
        
        const errorMessage = err.message || "Error loading dashboard";
        console.log("[SellerDashboard] Setting error message:", errorMessage);
        setErrorMsg(errorMessage);

        if (err.response?.status === 401 || err.message.includes("token") || err.message.includes("unauthorized")) {
          console.warn("[SellerDashboard] Authentication error detected");
          setErrorMsg("Your session has expired. Please login again.");
        }
      } finally {
        console.log("[SellerDashboard] Setting loading to false");
        setLoading(false);
      }
    };

    loadDashboard();
    
    return () => {
      console.log("[SellerDashboard] Cleanup - dashboard unmounting");
    };
  }, [user, rehydrated, navigate]);

  // ----------------------------
  // Load SELLER Notifications
  // ----------------------------
  const loadSellerNotifications = async () => {
    console.log("[SellerDashboard] loadSellerNotifications called");
    setNotifLoading(true);
    
    try {
      console.log("[SellerDashboard] Trying seller-specific endpoint: /notifications/seller");
      const notifResponse = await axiosSeller.get("/notifications/seller?page=1&limit=20");
      const notifRes = notifResponse.data;
      
      console.log("[SellerDashboard] SELLER Notifications fetch response:", {
        success: true,
        status: notifResponse.status,
        notificationsCount: notifRes.notifications?.length || 0,
        user_type: notifRes.user_type
      });

      const sanitizedNotif = (notifRes.notifications || []).map((n) => ({
        ...n,
        id: n.id || n.notification_id,
        title: DOMPurify.sanitize(n.title || ""),
        message: DOMPurify.sanitize(n.message || ""),
        is_read: n.is_read || false,
        created_at: n.created_at || new Date().toISOString()
      }));

      console.log("[SellerDashboard] Sanitized SELLER notifications:", sanitizedNotif.length);
      setNotifications(sanitizedNotif);
      
      const unread = sanitizedNotif.filter((n) => !n.is_read).length;
      console.log("[SellerDashboard] Unread SELLER notifications count:", unread);
      setUnreadCount(unread);
      
    } catch (notifError) {
      console.error("[SellerDashboard] Seller notifications endpoint failed:", {
        message: notifError.message,
        status: notifError.response?.status,
        data: notifError.response?.data
      });
      
      // Fallback logic...
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setNotifLoading(false);
    }
  };

  // ----------------------------
  // Product Search
  // ----------------------------
  const handleSearch = (query) => {
    console.log("[SellerDashboard] handleSearch called with query:", query);
    
    if (!query) {
      console.log("[SellerDashboard] Empty query, resetting to all products");
      setFilteredProducts(products);
      return;
    }

    const s = DOMPurify.sanitize(query.toLowerCase());
    console.log("[SellerDashboard] Sanitized search term:", s);
    
    const filtered = products.filter((p) => p.name.toLowerCase().includes(s));
    console.log("[SellerDashboard] Filtered products:", filtered.length);
    
    setFilteredProducts(filtered);
  };

  // ----------------------------
  // SELLER Notifications
  // ----------------------------
  const markAllRead = async () => {
    console.log("[SellerDashboard] markAllRead called");
    
    try {
      console.log("[SellerDashboard] API call: PUT /notifications/seller/read-all");
      await axiosSeller.put("/notifications/seller/read-all", {});
      
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      
      console.log("[SellerDashboard] All seller notifications marked as read");
    } catch (err) {
      console.error("[SellerDashboard] Seller mark all read failed:", err.message);
      // Update UI anyway
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  const markRead = async (id) => {
    console.log("[SellerDashboard] markRead called for notification:", id);
    
    try {
      console.log("[SellerDashboard] API call: PUT /notifications/seller/read/${id}");
      await axiosSeller.put(`/notifications/seller/read/${id}`, {});
      
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((x) => Math.max(x - 1, 0));
      
      console.log("[SellerDashboard] Seller notification marked as read:", id);
    } catch (err) {
      console.error("[SellerDashboard] Seller mark read failed:", err.message);
      // Update UI anyway
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((x) => Math.max(x - 1, 0));
    }
  };

  // ----------------------------
  // Refresh Notifications
  // ----------------------------
  const refreshNotifications = async () => {
    console.log("[SellerDashboard] refreshNotifications called");
    await loadSellerNotifications();
  };

  // ----------------------------
  // Toggle Chat Modal
  // ----------------------------
  const toggleChat = () => {
    console.log("[SellerDashboard] Toggling chat modal");
    setChatOpen(!chatOpen);
    // Close notifications if open
    if (notifOpen) setNotifOpen(false);
  };

  // ----------------------------
  // Handle Logout
  // ----------------------------
  const handleLogout = async () => {
    console.log("[SellerDashboard] Logout initiated");
    try {
      await logout();
      navigate("/seller/login");
    } catch (error) {
      console.error("[SellerDashboard] Logout failed:", error);
      navigate("/seller/login");
    }
  };

  // ----------------------------
  // Debug function
  // ----------------------------
  const debugCookies = () => {
    console.log("🔍 [Dashboard Debug] Cookies:", document.cookie);
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      acc[name] = value;
      return acc;
    }, {});
    
    console.log("🔍 [Dashboard Debug] Has sellerAccessToken?", !!cookies.sellerAccessToken);
    console.log("🔍 [Dashboard Debug] Has accessToken?", !!cookies.accessToken);
    console.log("🔍 [Dashboard Debug] User:", user);
  };

  // ----------------------------
  // Loading State
  // ----------------------------
  if (loading || !rehydrated) {
    console.log("[SellerDashboard] Rendering loading skeleton");
    return (
      <div className="p-4">
        <Skeleton height={30} width="30%" className="mb-4" />
        <Skeleton height={40} className="mb-2" />
        <Skeleton height={40} className="mb-2" />
        <Skeleton height={40} className="mb-2" />
      </div>
    );
  }

  console.log("[SellerDashboard] Rendering main dashboard UI");
  
  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white shadow-md p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-indigo-600">Seller Dashboard</h1>
          <p className="text-gray-700 mt-1">
            {DOMPurify.sanitize(user.full_name || "Seller")}
          </p>
          <p className="text-xs text-gray-500">
            Store: {store?.name || "No store yet"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {store && (
            <div onClick={() => console.log("[SellerDashboard] ProductSearch rendered")}>
              <ProductSearch onSearch={handleSearch} />
            </div>
          )}

          {/* CHAT BUTTON */}
          <button
            onClick={toggleChat}
            className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-2 relative"
            aria-label="Customer Chat"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="hidden md:inline">Chat</span>
            {/* Optional: Show unread message count */}
            {/* <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">3</span> */}
          </button>

          {/* NOTIFICATIONS */}
          <div className="relative">
            <button
              onClick={() => {
                console.log("[SellerDashboard] Notifications button clicked");
                setNotifOpen(!notifOpen);
                if (!notifOpen) {
                  refreshNotifications();
                }
              }}
              className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 relative transition-colors"
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
              disabled={notifLoading}
            >
              {notifLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
              ) : (
                <Bell className="w-5 h-5 text-gray-700" />
              )}
              
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">Notifications</span>
                    {notifLoading && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                  </div>
                  <div className="flex gap-2">
                    {notifications.length > 0 && unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={refreshNotifications}
                      className="text-sm text-gray-600 hover:text-gray-800"
                      title="Refresh"
                    >
                      ⟳
                    </button>
                  </div>
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <Bell className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500 text-sm">No notifications yet</p>
                      <p className="text-gray-400 text-xs mt-1">
                        You'll see seller notifications here
                      </p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                          n.is_read ? "bg-white" : "bg-blue-50"
                        }`}
                        onClick={() => !n.is_read && markRead(n.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className={`font-medium ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                              {n.title || 'Notification'}
                            </p>
                            {n.message && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {n.message}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(n.created_at).toLocaleString()}
                            </p>
                          </div>
                          {!n.is_read && (
                            <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Debug info in development */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="px-3 py-2 border-t bg-gray-50 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Total: {notifications.length}</span>
                      <span>Unread: {unreadCount}</span>
                      <button 
                        onClick={debugCookies}
                        className="text-indigo-500 hover:text-indigo-700"
                      >
                        Debug
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* LOGOUT BUTTON */}
          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ERROR DISPLAY */}
      {errorMsg && (
        <div className="max-w-6xl mx-auto p-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline ml-2">{errorMsg}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  console.log("[SellerDashboard] Retry button clicked");
                  setErrorMsg("");
                  window.location.reload();
                }}
                className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={handleLogout}
                className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {/* STORE CARD */}
        {!store ? (
          <section className="bg-yellow-50 p-6 border border-yellow-200 rounded-lg text-center">
            <h2 className="font-semibold text-yellow-800 mb-2">Set Up Your Store</h2>
            <p className="text-yellow-700 mb-4">
              You haven't created your store yet. Click below to set it up!
            </p>
            <Link
              to="/seller/setup"
              className="inline-block bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
              onClick={() => console.log("[SellerDashboard] Create store link clicked")}
            >
              Create Store
            </Link>
          </section>
        ) : (
          <>
            {/* Store Info */}
            <section className="bg-white shadow rounded-lg p-6 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={store.logo_url || "/store-placeholder.png"}
                    alt={store.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      console.warn("[SellerDashboard] Store logo failed to load");
                      e.target.src = "/store-placeholder.png";
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{store.name}</h2>
                  <p className="text-gray-600 text-sm mt-1">{store.address || "No address set"}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-gray-600 text-sm">
                      ⭐ {store.rating || "4.8"} Rating
                    </span>
                    <span className="text-gray-600 text-sm">
                      👥 {store.followers || 0} Followers
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={toggleChat}
                  className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors flex items-center gap-2"
                  title="Chat with customers"
                >
                  <MessageSquare className="w-4 h-4" />
                  Customer Chat
                </button>

                <Link
                  to={`/seller/store/${store.id}/edit`}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  onClick={() => console.log("[SellerDashboard] Edit store clicked")}
                >
                  Edit Store
                </Link>

                <Link
                  to="/seller/products"
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  onClick={() => console.log("[SellerDashboard] Manage products clicked")}
                >
                  Manage Products
                </Link>

                <Link
                  to="/seller/campaigns"
                  className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
                  onClick={() => console.log("[SellerDashboard] Manage campaigns clicked")}
                >
                  Manage Campaigns
                </Link>
              </div>
            </section>

            {/* Latest Products */}
            <section className="bg-white p-6 shadow rounded-lg">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">Your Latest Products</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage and track your products
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    Showing {filteredProducts.length} of {products.length} products
                  </span>
                  <Link
                    to="/seller/products"
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    View All →
                  </Link>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  {products.length === 0 ? (
                    <>
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                      </div>
                      <p className="text-gray-500">No products yet. Add your first product!</p>
                      <Link
                        to="/seller/products/new"
                        className="mt-4 inline-block bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
                        onClick={() => console.log("[SellerDashboard] Add first product clicked")}
                      >
                        Add Your First Product
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-500">No products match your search.</p>
                      <button
                        onClick={() => setFilteredProducts(products)}
                        className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        Clear search
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      className="border border-gray-200 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => {
                        console.log("[SellerDashboard] Product card clicked:", p.id);
                        navigate(`/seller/products/${p.id}`);
                      }}
                    >
                      <div className="relative">
                        <img
                          src={p.image_url || "/product-placeholder.png"}
                          alt={p.name}
                          className="w-full h-40 object-cover rounded-md mb-3 group-hover:opacity-90 transition-opacity"
                          onError={(e) => {
                            console.warn("[SellerDashboard] Product image failed to load:", p.id);
                            e.target.src = "/product-placeholder.png";
                          }}
                        />
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          {p.stock_quantity || 0} in stock
                        </div>
                      </div>
                      <h4 className="font-semibold text-sm text-gray-800 truncate">
                        {p.name}
                      </h4>
                      <p className="text-gray-600 text-sm mt-1">
                        ₦{Number(p.price).toLocaleString()}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          p.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {p.status || 'draft'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {p.category || 'Uncategorized'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Quick Stats */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow border">
                <h4 className="font-medium text-gray-700 mb-2">Notifications</h4>
                <p className="text-2xl font-bold text-gray-900">{unreadCount} unread</p>
                <p className="text-sm text-gray-500 mt-1">
                  {notifications.length} total notifications
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow border">
                <h4 className="font-medium text-gray-700 mb-2">Products</h4>
                <p className="text-2xl font-bold text-gray-900">{products.length} products</p>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredProducts.length} showing
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow border">
                <h4 className="font-medium text-gray-700 mb-2">Customer Messages</h4>
                <p className="text-2xl font-bold text-blue-600">New</p>
                <button
                  onClick={toggleChat}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Open Chat →
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      {/* CHAT MODAL */}
      {chatOpen && store && (
        <SellerChat 
          storeId={store.id} 
          onClose={() => setChatOpen(false)} 
        />
      )}

      {/* Debug panel (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs max-w-xs">
          <div className="font-bold mb-1">Debug Info</div>
          <div>User: {user?.id?.substring(0, 8)}...</div>
          <div>Store: {store?.id?.substring(0, 8) || 'None'}</div>
          <div>Products: {products.length}</div>
          <div>Notifications: {notifications.length} ({unreadCount} unread)</div>
          <div>Chat: {chatOpen ? 'Open' : 'Closed'}</div>
          <button
            onClick={debugCookies}
            className="mt-2 text-indigo-300 hover:text-indigo-100"
          >
            Check Cookies
          </button>
        </div>
      )}
    </div>
  );
}
