import React, { useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { v4 as uuidv4 } from "uuid";
import axiosPublic from "../../utils/axiosPublic";
import { useBuyerAuth } from "../../context/BuyerAuthContext.jsx";
import { useBuyerSocket } from "../../context/BuyerSocketContext.jsx";
import ChatFileUpload from "../../components/ChatFileUpload.jsx";

export default function BuyerChat({ storeId, onClose, smallFileIcon = false }) {
  const { user, rehydrated } = useBuyerAuth();
  const { socket, joinRoom, sendMessage, sendTyping } = useBuyerSocket();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [typingStatus, setTypingStatus] = useState("");
  const [loading, setLoading] = useState({ messages: false, sending: false });
  const [storeInfo, setStoreInfo] = useState(null);
  const [error, setError] = useState(null);

  const fileUploadRef = useRef();
  const typingTimeout = useRef(null);
  const messagesEndRef = useRef(null);

  /* ---------------- FETCH SINGLE CONVERSATION ---------------- */
  const fetchConversation = async () => {
    if (!storeId || !user || !rehydrated) return;

    setLoading(prev => ({ ...prev, messages: true }));
    setError(null);

    try {
      // 1️⃣ Load messages for this store
      const res = await axiosPublic.get(`/chats/conversation/${storeId}`);
      setMessages(res.data.conversation || []);

      // 2️⃣ Join socket room for live updates
      joinRoom({ storeId, buyerId: user.id });

      // 3️⃣ Mark messages as read
      await axiosPublic.post("/chats/mark-read", { storeId });
      setMessages(prev => prev.map(msg => ({ ...msg, is_read: true })));

      // 4️⃣ Load store info
      fetchStoreInfo();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      if (err.response?.status === 404) setMessages([]);
    } finally {
      setLoading(prev => ({ ...prev, messages: false }));
    }
  };

  const fetchStoreInfo = async () => {
    try {
      const res = await axiosPublic.get(`/stores/${storeId}`);
      setStoreInfo(res.data);
    } catch (err) {
      console.error("[BuyerChat] Failed to fetch store info:", err);
    }
  };

  useEffect(() => {
    if (storeId && user && rehydrated) fetchConversation();
  }, [storeId, user, rehydrated]);

  /* ---------------- SOCKET LISTENERS ---------------- */
  useEffect(() => {
    if (!socket || !storeId) return;

    const handleReceiveMessage = (payload) => {
      const chat = payload?.chat ?? payload;
      if (!chat || chat.store_id !== storeId) return;
      setMessages(prev => [...prev, chat]);
    };

    const handleTyping = ({ sender, storeId: typingStoreId }) => {
      if (sender === "seller" && typingStoreId === storeId) {
        setTypingStatus("Seller is typing...");
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTypingStatus(""), 1500);
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("typing", handleTyping);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("typing", handleTyping);
    };
  }, [socket, storeId]);

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typingStatus]);

  /* ---------------- SEND MESSAGE ---------------- */
  const handleSend = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;

    setLoading(prev => ({ ...prev, sending: true }));
    let uploadedFiles = [];

    try {
      if (fileUploadRef.current && attachments.length > 0) {
        uploadedFiles = await fileUploadRef.current.uploadFiles();
      }

      const msgsToSend = uploadedFiles.map(file => ({
        sender: "buyer",
        targetUserId: storeInfo?.user_id,
        message: "",
        message_type: file.type,
        file_url: file.url,
        store_id: storeId
      }));

      if (newMessage.trim()) {
        msgsToSend.push({
          sender: "buyer",
          targetUserId: storeInfo?.user_id,
          message: DOMPurify.sanitize(newMessage),
          message_type: "text",
          store_id: storeId
        });
      }

      // Emit via socket
      msgsToSend.forEach(msg => sendMessage({ storeId, chat: msg }));

      // Save first message via API
      if (msgsToSend.length > 0) {
        await axiosPublic.post("/chats/send", msgsToSend[0]);
      }

      setMessages(prev => [
        ...prev,
        ...msgsToSend.map(msg => ({ ...msg, id: uuidv4(), temp: true, is_read: false, created_at: new Date().toISOString() }))
      ]);

      setNewMessage("");
      setAttachments([]);
    } catch (err) {
      console.error("[BuyerChat] Failed to send:", err);
      setError(err.response?.data?.error || "Failed to send message");
    } finally {
      setLoading(prev => ({ ...prev, sending: false }));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!storeId || !user || !rehydrated) return null;

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-lg shadow-lg border border-gray-200">
      {/* HEADER */}
      <div className="flex justify-between items-center p-2 border-b">
        <h2>{storeInfo?.name || "Chat"}</h2>
        <button onClick={onClose}>Close</button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-2">
        {messages.map(msg => (
          <div key={msg.id} className={`my-1 ${msg.sender === "buyer" ? "text-right" : "text-left"}`}>
            <div className="inline-block bg-gray-200 p-2 rounded">
              {msg.message}
              {msg.file_url && <a href={msg.file_url} target="_blank">{msg.file_type}</a>}
            </div>
          </div>
        ))}
        {typingStatus && <div className="text-sm text-gray-500">{typingStatus}</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="flex p-2 border-t gap-2">
        <ChatFileUpload ref={fileUploadRef} attachments={attachments} setAttachments={setAttachments} />
        <textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 border rounded p-1"
          placeholder="Type a message..."
        />
        <button onClick={handleSend} disabled={loading.sending}>Send</button>
      </div>
    </div>
  );
}

