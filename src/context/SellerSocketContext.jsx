// src/context/SellerSocketContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useSellerAuth } from "./SellerAuthContext.jsx";

const SellerSocketContext = createContext(null);

export const SellerSocketProvider = ({ children }) => {
  const { user, rehydrated } = useSellerAuth(); // ensure cookie exists
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const activeRoomRef = useRef(null);

  useEffect(() => {
    if (!rehydrated || !user) {
      console.log("[SellerSocket] Waiting for auth rehydration or user...");
      return;
    }

    console.log("[SellerSocket] User exists, connecting socket...", user.id);

    const socketBase = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

    const s = io(`${socketBase}/chat`, {
      withCredentials: true,           // send HttpOnly cookies
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // ----------------------------
    // Connection events
    // ----------------------------
    s.on("connect", () => {
      console.log("✅ Seller socket connected:", s.id);

      if (activeRoomRef.current) {
        s.emit("join_room", activeRoomRef.current);
        console.log("🔁 Rejoining active room:", activeRoomRef.current);
      }
    });

    s.on("disconnect", (reason) => console.log("❌ Seller socket disconnected:", reason));

    s.on("reconnect_attempt", (attempt) =>
      console.log(`🔄 Seller socket attempting reconnect: #${attempt}`)
    );

    s.on("reconnect_error", (err) =>
      console.error("⚠️ Seller socket reconnect error:", err.message)
    );

    s.on("reconnect_failed", () => console.error("❌ Seller socket failed to reconnect"));

    s.on("connect_error", (err) =>
      console.error("⚠️ Seller socket connect error:", err.message)
    );

    socketRef.current = s;
    setSocket(s);

    return () => {
      console.log("[SellerSocket] Cleaning up socket...");
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [rehydrated, user]);

  // ----------------------------
  // Socket helpers with debug
  // ----------------------------
  const joinRoom = ({ storeId, buyerId }) => {
    if (!socketRef.current) return console.warn("[SellerSocket] joinRoom: socket not ready");
    const payload = { storeId };
    if (buyerId) payload.buyerId = buyerId;
    console.log("[SellerSocket] Joining room:", payload);
    socketRef.current.emit("join_room", payload);
    activeRoomRef.current = payload;
  };

  const sendMessage = ({ storeId, chat }) => {
    if (!socketRef.current) return console.warn("[SellerSocket] sendMessage: socket not ready");
    console.log("[SellerSocket] Sending message to storeId:", storeId, chat);
    socketRef.current.emit("send_message", { storeId, chat });
  };

  const sendTyping = ({ storeId, sender, targetUserId }) => {
    if (!socketRef.current) return console.warn("[SellerSocket] sendTyping: socket not ready");
    const payload = { storeId, sender };
    if (targetUserId) payload.targetUserId = targetUserId;
    console.log("[SellerSocket] Sending typing indicator:", payload);
    socketRef.current.emit("typing", payload);
  };

  const markMessagesRead = ({ storeId, buyerId }) => {
    if (!socketRef.current) return console.warn("[SellerSocket] markMessagesRead: socket not ready");
    console.log("[SellerSocket] Marking messages read:", { storeId, buyerId });
    socketRef.current.emit("mark_read", { storeId, buyerId });
  };

  const on = (event, callback) => {
    if (!socketRef.current) return console.warn(`[SellerSocket] on: socket not ready for event ${event}`);
    console.log(`[SellerSocket] Listening to event: ${event}`);
    socketRef.current.on(event, callback);
  };

  const off = (event, callback) => {
    if (!socketRef.current) return console.warn(`[SellerSocket] off: socket not ready for event ${event}`);
    console.log(`[SellerSocket] Removing listener for event: ${event}`);
    socketRef.current.off(event, callback);
  };

  return (
    <SellerSocketContext.Provider
      value={{ socket, joinRoom, sendMessage, sendTyping, markMessagesRead, on, off }}
    >
      {children}
    </SellerSocketContext.Provider>
  );
};

// --- Hooks ---
export const useSellerSocket = () => useContext(SellerSocketContext);
export const useSocket = () => useContext(SellerSocketContext); // legacy alias

