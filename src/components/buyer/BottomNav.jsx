// src/components/common/BottomNav.jsx
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, ShoppingCart, User, MessageSquare, Package, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import DOMPurify from "dompurify";

import BuyerChat from "../buyer/Chat.jsx";
import axiosPublic from "../../utils/axiosPublic";
import { useBuyerSocket } from "../../context/BuyerSocketContext.jsx";
import { useBuyerAuth } from "../../context/BuyerAuthContext.jsx";

export default function BottomNav({ onCartUpdateRef }) {
  const navigate = useNavigate();
  const { socket } = useBuyerSocket();
  const { user, rehydrated } = useBuyerAuth();

  const [cartCount, setCartCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [storeChats, setStoreChats] = useState([]);
  const [inboxCount, setInboxCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeStore, setActiveStore] = useState(null);

  // ------------------------------
  // Fetch counts (once on mount)
  // ------------------------------
  useEffect(() => {
    if (!user) return;

    const fetchCart = async () => {
      try {
        const res = await axiosPublic.get("/cart", { withCredentials: true });
        const total = (res.data || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
        setCartCount(total);
      } catch {
        setCartCount(0);
      }
    };

    const fetchOrders = async () => {
      try {
        const res = await axiosPublic.get("/orders/buyer/me", { withCredentials: true });
        const pending = (res.data.orders || []).filter(o => o.status === "pending").length;
        setOrderCount(pending);
      } catch {
        setOrderCount(0);
      }
    };

    const fetchInbox = async () => {
      try {
        const res = await axiosPublic.get("/chats/buyer/inbox", { withCredentials: true });
        const sanitized = (res.data || []).map(chat => ({
          store_id: chat.store_id,
          store_name: DOMPurify.sanitize(chat.store_name || ""),
          store_logo: chat.store_logo || "/store-placeholder.png",
          last_message: DOMPurify.sanitize(chat.last_message || ""),
          last_message_time: chat.last_message_time,
          unread_count: chat.unread_count || 0,
        }));
        setStoreChats(sanitized);
      } catch {
        setStoreChats([]);
      }
    };

    fetchCart();
    fetchOrders();
    fetchInbox();

    if (onCartUpdateRef) onCartUpdateRef.current = fetchCart;
  }, [user]);

  // ------------------------------
  // Recalculate inbox count
  // ------------------------------
  useEffect(() => {
    setInboxCount(storeChats.reduce((sum, c) => sum + (c.unread_count || 0), 0));
  }, [storeChats]);

  // ------------------------------
  // Socket: real-time message updates
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
          // Only increment unread if not viewing this store
          if (activeStore?.store_id !== chat.store_id) {
            updated[index].unread_count += 1;
          }
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
    return () => socket.off("receive_message", handleReceive);
  }, [socket, activeStore]);

  // ------------------------------
  // Mark messages read
  // ------------------------------
  const markRead = async (storeId) => {
    if (!storeId || !user) return;
    setStoreChats(prev =>
      prev.map(c => c.store_id === storeId ? { ...c, unread_count: 0 } : c)
    );
    try {
      await axiosPublic.post("/chats/mark-read", { storeId }, { withCredentials: true });
    } catch (err) {
      console.error("[BottomNav] Failed to mark messages read:", err);
    }
  };

  if (!rehydrated || !user) return null;

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

            {/* Inbox or Chat */}
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

