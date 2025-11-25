// src/components/SellerChat.jsx
import React, { useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { v4 as uuidv4 } from "uuid";
import { fetchWithAuth } from "../../services/authService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSocket } from "../../context/SocketContext.jsx";
import ChatFileUpload from "../../components/ChatFileUpload.jsx";

export default function SellerChat({ storeId, onClose }) {
  const { user, getValidToken } = useAuth();
  const { socket, joinRoom, sendMessage, sendTyping } = useSocket();

  const [inbox, setInbox] = useState([]);
  const [activeBuyer, setActiveBuyer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingStatus, setTypingStatus] = useState("");
  const [attachments, setAttachments] = useState([]);

  const fileUploadRef = useRef();
  const endRef = useRef(null);
  const typingTimeout = useRef(null);

  /* ---------------- FETCH INBOX ---------------- */
  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const data = await fetchWithAuth("/chats/seller/inbox", "GET");
        setInbox(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Inbox fetch failed:", err);
        setInbox([]);
      }
    };
    fetchInbox();
  }, []);

  /* ---------------- JOIN ROOM ---------------- */
  useEffect(() => {
    if (!socket || !storeId) return;
    joinRoom({ storeId });
  }, [socket, storeId]);

  /* ---------------- SOCKET EVENTS ---------------- */
  useEffect(() => {
    if (!socket) return;

    const handleReceive = async (payload) => {
      const chat = payload?.chat ?? payload;
      if (!chat || chat.store_id !== storeId) return;

      if (String(chat.user_id) === String(activeBuyer)) {
        setMessages(prev => [...prev, chat]);
        try {
          await fetchWithAuth(`/chats/mark-read?buyerId=${chat.user_id}`, "POST", { storeId });
        } catch (err) {
          console.error(err);
        }
      } else {
        try {
          const data = await fetchWithAuth("/chats/seller/inbox", "GET");
          setInbox(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error(err);
        }
      }
    };

    const handleTyping = ({ sender, buyerId }) => {
      if (sender === "buyer" && String(buyerId) === String(activeBuyer)) {
        setTypingStatus("Buyer is typing...");
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTypingStatus(""), 1500);
      }
    };

    const handleMessagesRead = ({ buyerId }) => {
      setInbox(prev => prev.map(i => (String(i.buyer_id) === String(buyerId) ? { ...i, unread_count: 0 } : i)));
    };

    socket.on("receive_message", handleReceive);
    socket.on("typing", handleTyping);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("typing", handleTyping);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [socket, activeBuyer, storeId]);

  /* ---------------- FETCH CONVERSATION ---------------- */
  const fetchConversation = (buyerId) => {
    if (!buyerId) return;
    setActiveBuyer(buyerId);

    const fetchConv = async () => {
      try {
        const data = await fetchWithAuth(`/chats/conversation/${storeId}?buyerId=${buyerId}`, "GET");
        setMessages(Array.isArray(data) ? data : []);
        await fetchWithAuth(`/chats/mark-read?buyerId=${buyerId}`, "POST", { storeId });
      } catch (err) {
        console.error("Conversation fetch failed:", err);
        setMessages([]);
      }
    };
    fetchConv();
  };

  /* ---------------- SEND MESSAGE ---------------- */
  const handleSend = async () => {
    if (!activeBuyer) return alert("Select a buyer");

    let uploadedFiles = [];
    if (fileUploadRef.current) {
      uploadedFiles = await fileUploadRef.current.uploadFiles();

      // ---------------- CLEAR PREVIEWS AFTER SUCCESS ----------------
      const successfullyUploaded = uploadedFiles.filter(f => f.url);
      if (successfullyUploaded.length > 0) {
        setAttachments([]); // clear preview area immediately
      }

      const failed = uploadedFiles.filter(f => !f.url);
      if (failed.length > 0) return alert("Some files failed to upload.");
    }

    const msgsToSend = [];

    uploadedFiles.forEach(file => {
      msgsToSend.push({
        sender: "seller",
        targetUserId: activeBuyer,
        message: "",
        message_type: file.type,
        file_url: file.url,
        file_type: file.type,
      });
    });

    if (newMessage.trim()) {
      msgsToSend.push({
        sender: "seller",
        targetUserId: activeBuyer,
        message: DOMPurify.sanitize(newMessage),
        message_type: "text",
        file_url: null,
        file_type: null,
      });
    }

    msgsToSend.forEach(msg => sendMessage({ storeId, chat: msg }));

    setNewMessage("");
  };

  /* ---------------- TYPING ---------------- */
  const handleTypingEvent = () => {
    if (!activeBuyer) return;
    sendTyping({ storeId, sender: "seller", targetUserId: activeBuyer });
  };

  /* ---------------- SCROLL TO BOTTOM ---------------- */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingStatus]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl h-[80vh] flex overflow-hidden">

        {/* INBOX */}
        <div className="w-72 border-r bg-gray-50 flex flex-col">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-semibold text-lg">Inbox</h3>
            <div>
              <button onClick={() => fetchInbox()} className="text-sm">Refresh</button>
              <button onClick={onClose} className="ml-2">✕</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {inbox.map(c => (
              <button
                key={c.buyer_id}
                onClick={() => fetchConversation(c.buyer_id)}
                className={`w-full p-3 flex justify-between hover:bg-gray-100 ${activeBuyer == c.buyer_id ? "bg-gray-200" : ""}`}
              >
                <div className="truncate">
                  <div className="font-medium">{c.buyer_name}</div>
                  <div className="text-sm text-gray-600">{c.last_message}</div>
                </div>
                {c.unread_count > 0 && (
                  <span className="bg-indigo-600 text-white text-xs px-2 rounded-full">{c.unread_count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* CHAT WINDOW */}
        <div className="flex-1 flex flex-col bg-gray-100">

          {/* HEADER */}
          <div className="p-3 bg-white border-b flex justify-between items-center">
            <div>
              <div className="font-semibold">
                {inbox.find(i => i.buyer_id == activeBuyer)?.buyer_name || "Select a buyer"}
              </div>
              <div className="text-sm text-gray-500">{typingStatus}</div>
            </div>
            <button onClick={onClose}>✕</button>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map(m => {
              const mine = m.sender === "seller";
              return (
                <div key={m.id || uuidv4()} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`p-2 rounded-lg max-w-[70%] shadow ${mine ? "bg-indigo-600 text-white" : "bg-white"}`}>
                    {m.message_type === "text" && <div>{m.message}</div>}
                    {m.message_type === "image" && <img src={m.file_url} className="rounded max-h-52" />}
                    {m.message_type === "video" && <video src={m.file_url} className="rounded max-h-52" controls />}
                    <div className="text-xs opacity-75 mt-1">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          {/* INPUT & ATTACHMENTS */}
          <div className="p-3 bg-white border-t flex items-center gap-3">
            <input
              type="text"
              className="flex-1 border rounded-full px-4 py-2"
              placeholder="Type a message..."
              value={newMessage}
              disabled={!activeBuyer}
              onChange={e => { setNewMessage(e.target.value); handleTypingEvent(); }}
              onKeyDown={e => e.key === "Enter" && handleSend()}
            />
            <ChatFileUpload ref={fileUploadRef} onSelectAttachments={setAttachments} />
            <button
              onClick={handleSend}
              disabled={!activeBuyer}
              className="bg-indigo-600 text-white px-4 py-2 rounded-full"
            >
              Send
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

