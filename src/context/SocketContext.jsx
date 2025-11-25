// src/contexts/SocketContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { getValidToken, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const activeRoomRef = useRef(null); // keep track of last room

  // ------------------------------
  // Connect to Socket.IO namespace
  // ------------------------------
  useEffect(() => {
    if (!user) return;

    let mounted = true;
    const connect = async () => {
      const token = await getValidToken();
      if (!token || !mounted) return;

      if (socketRef.current) return;

      const socketBase = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
      const s = io(`${socketBase}/chat`, {
        auth: { token },
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      s.on("connect", () => {
        console.log("✅ Socket connected:", s.id);
        if (activeRoomRef.current) {
          s.emit("join_room", activeRoomRef.current);
          console.log("🔁 Rejoining room:", activeRoomRef.current);
        }
      });

      s.on("disconnect", (reason) => console.log("❌ Socket disconnected:", reason));
      s.on("connect_error", (err) => console.error("⚠️ Socket connect error:", err.message));
      s.on("reconnect_attempt", (attempt) => console.log(`🔄 Reconnect attempt ${attempt}`));

      socketRef.current = s;
      setSocket(s);
    };

    connect();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, getValidToken]);

  // ------------------------------
  // Join a chat room (seller or buyer)
  // ------------------------------
  const joinRoom = ({ storeId, buyerId }) => {
    if (!socketRef.current) return;
    const payload = { storeId };
    if (buyerId) payload.buyerId = buyerId;
    socketRef.current.emit("join_room", payload);
    activeRoomRef.current = payload;
    console.log("➡️ join_room emitted:", payload);
  };

  // ------------------------------
  // Send chat message
  // ------------------------------
  const sendMessage = ({ storeId, chat }) => {
    if (!socketRef.current) return;
    socketRef.current.emit("send_message", { storeId, chat });
    console.log("➡️ send_message emitted:", { storeId, chat });
  };

  // ------------------------------
  // Send typing event
  // ------------------------------
  const sendTyping = ({ storeId, sender, targetUserId }) => {
    if (!socketRef.current) return;
    const payload = { storeId, sender };
    if (targetUserId) payload.targetUserId = targetUserId;
    socketRef.current.emit("typing", payload);
  };

  // ------------------------------
  // Mark messages read
  // ------------------------------
  const markMessagesRead = ({ storeId, buyerId }) => {
    if (!socketRef.current) return;
    socketRef.current.emit("mark_read", { storeId, buyerId });
  };

  // ------------------------------
  // Listen to events from server
  // ------------------------------
  const on = (event, callback) => {
    if (!socketRef.current) return;
    socketRef.current.on(event, callback);
  };

  const off = (event, callback) => {
    if (!socketRef.current) return;
    socketRef.current.off(event, callback);
  };

  return (
    <SocketContext.Provider value={{
      socket,
      joinRoom,
      sendMessage,
      sendTyping,
      markMessagesRead,
      on,
      off,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

