// src/components/common/BottomNav.jsx
import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, ShoppingCart, User, MessageSquare, Package, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import DOMPurify from "dompurify";

import BuyerChat from "../buyer/Chat.jsx";
import { getUser, fetchWithAuth, getValidToken } from "../../services/authService";
import { useSocket } from "../../context/SocketContext.jsx";

export default function BottomNav({ onCartUpdateRef }) {
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [user, setUser] = useState(getUser());
  const [cartCount, setCartCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [inboxCount, setInboxCount] = useState(0);
  const [storeChats, setStoreChats] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeStore, setActiveStore] = useState(null);

  const intervalsRef = useRef([]);

  // ------------------------------
  // Initialize user token
  // ------------------------------
  useEffect(() => {
    const initUser = async () => {
      try {
        await getValidToken();
        setUser(getUser());
      } catch {
        setUser(null);
      }
    };
    initUser();
  }, []);

  // ------------------------------
  // Fetch counts
  // ------------------------------
  const fetchCartCount = async () => {
    try {
      const res = await fetchWithAuth("/cart");
      setCartCount(Array.isArray(res) ? res.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0);
    } catch {
      setCartCount(0);
    }
  };

  const fetchOrderCount = async () => {
    try {
      const res = await fetchWithAuth("/orders/buyer/me");
      setOrderCount(Array.isArray(res) ? res.filter(o => o.status === "pending").length : 0);
    } catch {
      setOrderCount(0);
    }
  };

  const fetchStoreChats = async () => {
    if (!user) return;
    try {
      const res = await fetchWithAuth("/chats/buyer/inbox");
      if (Array.isArray(res)) {
        const sanitized = res.map(chat => ({
          store_id: chat.store_id,
          store_name: DOMPurify.sanitize(chat.store_name || ""),
          store_logo: chat.store_logo || "/store-placeholder.png",
          last_message: DOMPurify.sanitize(chat.last_message || ""),
          last_message_time: chat.last_message_time,
          unread_count: chat.unread_count || 0,
        }));
        setStoreChats(sanitized);
        // Update total inbox count
        setInboxCount(sanitized.reduce((sum, c) => sum + c.unread_count, 0));
      } else {
        setStoreChats([]);
        setInboxCount(0);
      }
    } catch {
      setStoreChats([]);
      setInboxCount(0);
    }
  };

  // ------------------------------
  // Poll cart/order counts
  // ------------------------------
  useEffect(() => {
    if (!user || user.role === "seller") return;

    fetchCartCount();
    fetchOrderCount();
    fetchStoreChats();

    intervalsRef.current = [
      setInterval(fetchCartCount, 5000),
      setInterval(fetchOrderCount, 10000),
      setInterval(fetchStoreChats, 10000),
    ];

    return () => intervalsRef.current.forEach(clearInterval);
  }, [user]);

  useEffect(() => {
    if (onCartUpdateRef) onCartUpdateRef.current = fetchCartCount;
  }, [onCartUpdateRef]);

  if (!user || user.role === "seller") return null;

  // ------------------------------
  // Mark messages read
  // ------------------------------
  const markRead = async (storeId) => {
    if (!storeId) return;
    try {
      await fetchWithAuth(`/chats/mark-read?buyerId=${user.id}`, "POST", { storeId });
      fetchStoreChats(); // Refresh store chats
    } catch (err) {
      console.error("[BottomNav] Failed to mark messages read:", err);
    }
  };

  // ------------------------------
  // Socket: update storeChats and inboxCount
  // ------------------------------
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (payload) => {
      const chat = payload?.chat ?? payload;
      if (!chat) return;

      setStoreChats(prev => {
        const index = prev.findIndex(c => c.store_id === chat.store_id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index].last_message = chat.message;
          updated[index].last_message_time = chat.created_at;
          if (activeStore?.store_id !== chat.store_id) updated[index].unread_count += 1;
          return updated;
        } else {
          return [
            ...prev,
            {
              store_id: chat.store_id,
              store_name: chat.store_name || "Unknown Store",
              store_logo: chat.store_logo || "/store-placeholder.png",
              last_message: chat.message,
              last_message_time: chat.created_at,
              unread_count: 1,
            },
          ];
        }
      });
    };

    socket.on("receive_message", handleReceive);

    return () => {
      socket.off("receive_message", handleReceive);
    };
  }, [socket, activeStore]);

  // ------------------------------
  // Navigation items
  // ------------------------------
  const navItems = [
    { to: "/", label: "Home", icon: <Home size={22} /> },
    { label: "Cart", icon: <ShoppingCart size={22} />, badge: cartCount, action: () => navigate("/cart") },
    { label: "Orders", icon: <Package size={22} />, badge: orderCount, action: () => navigate("/orders") },
    { label: "Messages", icon: <MessageSquare size={22} />, badge: inboxCount, action: () => setIsChatOpen(true) },
    { to: "/profile", label: "Profile", icon: <User size={22} /> },
  ];

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-around py-3 shadow-lg z-50">
        {navItems.map(({ to, label, icon, badge, action }) => (
          <motion.div
            key={label}
            whileTap={{ scale: 0.9 }}
            className="relative flex flex-col items-center text-sm"
            onClick={action}
          >
            {to ? (
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center ${isActive ? "text-indigo-600 font-semibold" : "text-gray-500 hover:text-indigo-600"}`
                }
              >
                {icon}
                {badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-[1px] rounded-full">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
                <span className="mt-1">{label}</span>
              </NavLink>
            ) : (
              <>
                {icon}
                {badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-[1px] rounded-full">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
                <span className="mt-1">{label}</span>
              </>
            )}
          </motion.div>
        ))}
      </nav>

      {/* Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-2 md:p-4">
          <div className="bg-white w-full md:max-w-md rounded-t-xl flex flex-col h-[80vh] shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-indigo-500 flex-shrink-0">
              {activeStore && (
                <button
                  className="text-white mr-2 flex items-center justify-center"
                  onClick={() => setActiveStore(null)}
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <h2 className="text-white font-semibold text-lg flex-1 text-center truncate">
                {activeStore ? activeStore.store_name : "Inbox"}
              </h2>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-white font-bold text-xl hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {!activeStore ? (
                <div className="flex-1 overflow-y-auto bg-gray-50">
                  {storeChats.length ? (
                    storeChats.map((chat, index) => (
                      <button
                        key={`${chat.store_id}-${index}`}
                        onClick={() => {
                          setActiveStore(chat);
                          markRead(chat.store_id);
                        }}
                        className="flex items-center w-full p-3 hover:bg-gray-100 focus:outline-none transition-colors"
                      >
                        <img
                          src={chat.store_logo}
                          alt={chat.store_name}
                          className="w-10 h-10 rounded-full object-cover mr-3"
                        />
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-gray-800 truncate">{chat.store_name}</p>
                          {chat.last_message && (
                            <p className="text-sm text-gray-500 truncate max-w-full">{chat.last_message}</p>
                          )}
                        </div>
                        {chat.unread_count > 0 && (
                          <span className="bg-indigo-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                            {chat.unread_count}
                          </span>
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="p-4 text-center text-gray-500">No chats yet.</p>
                  )}
                </div>
              ) : (
                <BuyerChat storeId={activeStore.store_id} smallFileIcon={true} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

