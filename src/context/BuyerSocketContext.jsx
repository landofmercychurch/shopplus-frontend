// src/context/BuyerSocketContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useBuyerAuth } from "./BuyerAuthContext.jsx";

// Create context
const BuyerSocketContext = createContext(null);

// Provider
export const BuyerSocketProvider = ({ children }) => {
  const { user, rehydrated } = useBuyerAuth();
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const activeRoomRef = useRef(null);

  // -------------------------
  // Connect socket
  // -------------------------
  useEffect(() => {
    if (!rehydrated || !user) return;

    const socketBase = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    const s = io(`${socketBase}/chat`, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    s.on("connect", () => {
      console.log("[BuyerSocket] Connected:", s.id);
      if (activeRoomRef.current) {
        s.emit("join_room", activeRoomRef.current);
        console.log("[BuyerSocket] Rejoining room:", activeRoomRef.current);
      }
    });

    s.on("disconnect", (reason) => console.log("[BuyerSocket] Disconnected:", reason));
    s.on("connect_error", (err) => console.error("[BuyerSocket] Connect error:", err.message));

    socketRef.current = s;
    setSocket(s);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, rehydrated]);

  // -------------------------
  // Socket helpers
  // -------------------------
  const joinRoom = ({ storeId, buyerId }) => {
    if (!socketRef.current) return;
    const payload = { storeId };
    if (buyerId) payload.buyerId = buyerId;

    activeRoomRef.current = payload;
    socketRef.current.emit("join_room", payload);
    console.log("[BuyerSocket] Joined room:", payload);
  };

  const sendMessage = ({ storeId, chat }) => {
    if (!socketRef.current) return;
    socketRef.current.emit("send_message", { storeId, chat });
  };

  const sendTyping = ({ storeId, sender }) => {
    if (!socketRef.current) return;
    socketRef.current.emit("typing", { storeId, sender });
  };

  const markMessagesRead = ({ storeId, buyerId }) => {
    if (!socketRef.current) return;
    socketRef.current.emit("mark_read", { storeId, buyerId });
  };

  const on = (event, callback) => socketRef.current?.on(event, callback);
  const off = (event, callback) => socketRef.current?.off(event, callback);

  return (
    <BuyerSocketContext.Provider
      value={{
        socket,
        joinRoom,
        sendMessage,
        sendTyping,
        markMessagesRead,
        on,
        off,
      }}
    >
      {children}
    </BuyerSocketContext.Provider>
  );
};

// -------------------------
// Export hook for buyers
// -------------------------
export const useBuyerSocket = () => useContext(BuyerSocketContext);

