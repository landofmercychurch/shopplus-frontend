// src/components/seller/SellerNotifications.jsx - UPDATED TO MATCH BACKEND
import React, { useEffect, useState, useRef } from "react";
import { Bell, Loader2, AlertCircle } from "lucide-react";
import { useSellerAuth } from "../../context/SellerAuthContext.jsx";
import { useSellerSocket } from "../../context/SellerSocketContext.jsx";
import axiosSeller from "../../utils/axiosSeller.js";

export default function SellerNotifications() {
  console.log("[SellerNotifications] Component mounted");
  
  const { user, rehydrated } = useSellerAuth();
  const { socket, isConnected } = useSellerSocket();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  const PAGE = 1;
  const LIMIT = 20;

  // ----------------------------
  // Fetch notifications from backend
  // ----------------------------
  const loadNotifications = async () => {
    console.log("[SellerNotifications] loadNotifications called");
    
    if (!user || !rehydrated) {
      console.log("[SellerNotifications] Skipping - no user or not rehydrated");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("[SellerNotifications] Fetching seller notifications...");
      
      // CORRECT ENDPOINT: /notifications/seller (matches backend route)
      const response = await axiosSeller.get(`/notifications/seller`, {
        params: {
          page: PAGE,
          limit: LIMIT
        }
      });
      
      console.log("[SellerNotifications] Seller notifications response:", {
        status: response.status,
        data: response.data
      });

      const data = response.data;
      
      // Backend returns: { success, page, limit, total, totalPages, notifications, user_role }
      if (data.success === false) {
        throw new Error(data.error || "Failed to load notifications");
      }
      
      const notificationsList = data.notifications || [];
      
      console.log("[SellerNotifications] Seller notifications loaded:", notificationsList.length);
      
      // Transform to match backend format
      const transformedNotifications = notificationsList.map((n) => ({
        id: n.id, // UUID from backend
        title: n.title || "Notification",
        message: n.message || "",
        is_read: n.is_read || false,
        created_at: n.created_at,
        type: n.type || "general",
        user_role: n.user_role || "seller" // Added to match backend
      }));
      
      setNotifications(transformedNotifications);
      
      // Get unread count from backend response or calculate
      if (data.unread !== undefined) {
        setUnreadCount(data.unread);
      } else {
        const unread = transformedNotifications.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
      
    } catch (err) {
      console.error("[SellerNotifications] Fetch notifications error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      
      // Handle specific error cases
      if (err.response?.status === 404) {
        setError("Seller notifications endpoint not found. Please check backend routes.");
      } else if (err.response?.status === 401) {
        setError("Authentication failed. Please login again.");
      } else if (err.response?.status === 403) {
        setError("You don't have permission to view seller notifications.");
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(err.message || "Failed to load notifications");
      }
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // Fetch unread count separately
  // ----------------------------
  const loadUnreadCount = async () => {
    if (!user || !rehydrated) return;
    
    try {
      const response = await axiosSeller.get('/notifications/seller/unread-count');
      const data = response.data;
      
      if (data.success === false) {
        console.warn("Failed to load unread count:", data.error);
        return;
      }
      
      setUnreadCount(data.unread || 0);
    } catch (err) {
      console.error("Failed to load unread count:", err);
    }
  };

  // Initial fetch
  useEffect(() => {
    console.log("[SellerNotifications] Initial fetch useEffect triggered");
    if (user && rehydrated) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [user, rehydrated]);

  // ----------------------------
  // Real-time notifications via socket
  // ----------------------------
  useEffect(() => {
    console.log("[SellerNotifications] Socket useEffect triggered");
    
    if (!socket || !user || !isConnected) {
      console.log("[SellerNotifications] Socket not ready");
      return;
    }

    console.log("[SellerNotifications] Setting up socket listeners");

    const handleNewNotification = (notification) => {
      console.log("[SellerNotifications] New seller notification via socket:", notification);
      
      // Ensure notification matches backend format
      const processedNotif = {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        is_read: notification.is_read || false,
        created_at: notification.created_at,
        type: notification.type,
        user_role: notification.user_role || "seller"
      };
      
      setNotifications(prev => [processedNotif, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Play sound if available
      if (notification.sound && audioRef.current) {
        audioRef.current.play().catch(err => {
          console.warn("[SellerNotifications] Could not play sound:", err);
        });
      }
    };

    // Listen for seller-specific notifications
    socket.on("new-seller-notification", handleNewNotification);

    // Also listen for generic notifications but filter for sellers
    socket.on("new-notification", (notification) => {
      if (notification.user_role === 'seller') {
        handleNewNotification(notification);
      }
    });

    return () => {
      console.log("[SellerNotifications] Cleaning up socket listeners");
      socket.off("new-seller-notification", handleNewNotification);
      socket.off("new-notification", handleNewNotification);
    };
  }, [socket, user, isConnected]);

  // ----------------------------
  // Mark single notification as read
  // ----------------------------
  const markAsRead = async (id) => {
    console.log("[SellerNotifications] markAsRead called for:", id);
    
    try {
      // CORRECT ENDPOINT: /notifications/seller/read/:id (UUID, not integer)
      const response = await axiosSeller.put(`/notifications/seller/read/${id}`);
      console.log("[SellerNotifications] Mark as read response:", response.data);
      
      const data = response.data;
      
      if (data.success === false) {
        throw new Error(data.error || "Failed to mark as read");
      }
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(prev - 1, 0));
      
    } catch (err) {
      console.error("[SellerNotifications] Mark as read error:", {
        message: err.message,
        status: err.response?.status
      });
      
      // Show error but update UI for better UX
      if (err.response?.status !== 404) {
        setError(err.response?.data?.error || "Failed to mark as read");
      }
    }
  };

  // ----------------------------
  // Mark all notifications as read
  // ----------------------------
  const markAllAsRead = async () => {
    console.log("[SellerNotifications] markAllAsRead called");
    
    try {
      // CORRECT ENDPOINT: /notifications/seller/read-all
      const response = await axiosSeller.put("/notifications/seller/read-all");
      console.log("[SellerNotifications] Mark all as read response:", response.data);
      
      const data = response.data;
      
      if (data.success === false) {
        throw new Error(data.error || "Failed to mark all as read");
      }
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      
    } catch (err) {
      console.error("[SellerNotifications] Mark all as read error:", {
        message: err.message,
        status: err.response?.status
      });
      
      if (err.response?.status !== 404) {
        setError(err.response?.data?.error || "Failed to mark all as read");
      }
    }
  };

  // ----------------------------
  // Toggle dropdown
  // ----------------------------
  const toggleDropdown = () => {
    console.log("[SellerNotifications] Toggling dropdown");
    const newState = !dropdownOpen;
    setDropdownOpen(newState);
    
    // Refresh when opening dropdown
    if (newState) {
      loadNotifications();
      loadUnreadCount();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.getElementById('seller-notifications-dropdown');
      const button = document.getElementById('seller-notifications-button');
      
      if (dropdownOpen && dropdown && button && 
          !dropdown.contains(event.target) && !button.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Format date nicely
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Don't render if no user or not rehydrated
  if (!user || !rehydrated) {
    console.log("[SellerNotifications] Not rendering - no user or not rehydrated");
    return null;
  }

  // Ensure user is a seller
  if (user.role !== 'seller') {
    console.log("[SellerNotifications] User is not a seller, not rendering");
    return null;
  }

  console.log("[SellerNotifications] Rendering for seller:", user.id);

  return (
    <div className="relative">
      <button
        id="seller-notifications-button"
        onClick={toggleDropdown}
        className="relative p-2 hover:text-indigo-600 transition-colors duration-200 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label={`Seller Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        ) : (
          <>
            <Bell className="w-5 h-5 text-gray-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center font-medium">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {dropdownOpen && (
        <div 
          id="seller-notifications-dropdown"
          className="absolute right-0 mt-2 w-96 bg-white shadow-lg rounded-lg border border-gray-200 z-50 overflow-hidden"
          style={{ maxHeight: '500px' }}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">Seller Notifications</span>
              {loading ? (
                <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
              ) : unreadCount > 0 && (
                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {notifications.length > 0 && unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium focus:outline-none"
                  title="Mark all as read"
                  disabled={loading}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => {
                  loadNotifications();
                  loadUnreadCount();
                }}
                className="text-sm text-gray-600 hover:text-gray-800 focus:outline-none"
                title="Refresh"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  '⟳'
                )}
              </button>
            </div>
          </div>

          {/* Error state */}
          {error && !loading && (
            <div className="p-4 bg-red-50 border-b border-red-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-600">{error}</p>
                  <button
                    onClick={loadNotifications}
                    className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium focus:outline-none"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications list */}
          <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  Seller notifications will appear here
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                    notification.is_read ? "bg-white" : "bg-blue-50"
                  }`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                  title={!notification.is_read ? "Click to mark as read" : ""}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400">
                          {formatDate(notification.created_at)}
                        </p>
                        <div className="flex items-center gap-2">
                          {notification.type && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {notification.type}
                            </span>
                          )}
                          {notification.user_role && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded">
                              {notification.user_role}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!notification.is_read && (
                      <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t bg-gray-50 text-xs text-gray-500">
            <div className="flex justify-between items-center">
              <span>Seller: {user.id?.substring(0, 8)}...</span>
              <span>
                Showing {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
              </span>
              {process.env.NODE_ENV === 'development' && (
                <button 
                  onClick={() => console.log("Debug:", { 
                    notifications, 
                    user: user.id,
                    unreadCount,
                    socket: isConnected ? 'connected' : 'disconnected'
                  })}
                  className="text-indigo-500 hover:text-indigo-700 focus:outline-none"
                >
                  Debug
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio element for notification sounds */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
