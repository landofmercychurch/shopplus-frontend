// src/components/Notifications.jsx
import React, { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";
import { useBuyerAuth } from "../context/BuyerAuthContext.jsx";
import { useBuyerSocket } from "../context/BuyerSocketContext.jsx";
import { fetchWithAuth } from "../services/buyerAuthService.js";

export default function Notifications() {
  const { user, rehydrated } = useBuyerAuth();
  const { socket } = useBuyerSocket();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const audioRef = useRef(null);

  const PAGE = 1;
  const LIMIT = 20;

  // ----------------------------
  // Fetch notifications initially
  // ----------------------------
  const loadNotifications = async () => {
    if (!user || !rehydrated) return;
    try {
      const data = await fetchWithAuth(`/notifications?page=${PAGE}&limit=${LIMIT}`);
      const notifs = data.notifications || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    } catch (err) {
      console.error("Fetch notifications error:", err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user, rehydrated]);

  // ----------------------------
  // Socket: real-time notifications
  // ----------------------------
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewNotification = (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);

      if (notif.sound && audioRef.current) {
        audioRef.current.src = notif.sound;
        audioRef.current.play().catch(() => {});
      }
    };

    socket.on("new-notification", handleNewNotification);

    return () => {
      socket.off("new-notification", handleNewNotification);
    };
  }, [socket, user]);

  // ----------------------------
  // Mark single notification as read
  // ----------------------------
  const markAsRead = async (id) => {
    try {
      const data = await fetchWithAuth(`/notifications/read/${id}`, "PUT");
      if (data.success) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount(prev => Math.max(prev - 1, 0));
      }
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  // ----------------------------
  // Mark all notifications as read
  // ----------------------------
  const markAllAsRead = async () => {
    try {
      const data = await fetchWithAuth("/notifications/read-all", "PUT");
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Mark all as read error:", err);
    }
  };

  if (!user || !rehydrated) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(prev => !prev)}
        className="relative p-2 hover:text-indigo-600"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded border z-50 max-h-64 overflow-y-auto">
          <div className="flex justify-between px-4 py-2 border-b">
            <span className="font-semibold">Notifications</span>
            <button
              onClick={markAllAsRead}
              className="text-sm text-indigo-600 hover:underline"
            >
              Mark all as read
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-gray-500 text-sm">No notifications</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                    n.is_read ? "bg-white" : "bg-indigo-50"
                  }`}
                  onClick={() => markAsRead(n.id)}
                >
                  <p className="font-medium">{n.title}</p>
                  {n.message && <p className="text-sm text-gray-600">{n.message}</p>}
                  <p className="text-xs text-gray-400">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <audio ref={audioRef} />
    </div>
  );
}

