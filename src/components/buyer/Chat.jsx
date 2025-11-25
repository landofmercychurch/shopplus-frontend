// src/components/BuyerChat.jsx
import React, { useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { fetchWithAuth } from "../../services/authService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSocket } from "../../context/SocketContext.jsx";
import ChatFileUpload from "../../components/ChatFileUpload.jsx";

export default function BuyerChat({ storeId, smallFileIcon = false }) {
  const { user, getValidToken } = useAuth();
  const { socket, joinRoom, sendMessage, sendTyping } = useSocket();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [typingStatus, setTypingStatus] = useState("");

  const fileUploadRef = useRef();
  const endRef = useRef(null);
  const typingTimeout = useRef(null);

  /* ---------------- FETCH CONVERSATION ---------------- */
  const fetchConversation = async () => {
    if (!storeId || !user) return;
    try {
      const data = await fetchWithAuth(`/chats/conversation/${storeId}?buyerId=${user.id}`);
      setMessages(Array.isArray(data) ? data : []);
      joinRoom({ storeId, buyerId: user.id });
      markRead(); // mark messages read
    } catch (err) {
      console.error("[BuyerChat] Fetch conversation error:", err);
      setMessages([]);
    }
  };

  useEffect(() => {
    fetchConversation();
  }, [storeId, user]);

  /* ---------------- SOCKET LISTENERS ---------------- */
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (payload) => {
      const chat = payload?.chat ?? payload;
      if (!chat || chat.store_id !== storeId) return;

      setMessages((prev) => [...prev, chat]);
    };

    const handleTyping = ({ sender }) => {
      if (sender === "seller") {
        setTypingStatus("Seller is typing...");
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTypingStatus(""), 1500);
      }
    };

    socket.on("receive_message", handleReceive);
    socket.on("typing", handleTyping);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("typing", handleTyping);
    };
  }, [socket, storeId]);

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingStatus]);

  /* ---------------- TYPING ---------------- */
  const handleTypingEvent = () => {
    sendTyping({ storeId, sender: "buyer" });
  };

  /* ---------------- MARK READ ---------------- */
  const markRead = async () => {
    if (!storeId || !user) return;
    try {
      await fetchWithAuth(`/chats/mark-read?buyerId=${user.id}`, "POST", { storeId });
    } catch (err) {
      console.error("[BuyerChat] Failed to mark messages read:", err);
    }
  };

  /* ---------------- SEND MESSAGE ---------------- */
  const handleSend = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;

    let uploadedFiles = [];
    if (fileUploadRef.current && attachments.length > 0) {
      uploadedFiles = await fileUploadRef.current.uploadFiles();
      const failed = uploadedFiles.filter(f => !f.url);
      if (failed.length > 0) return alert("Some files failed to upload.");
    }

    const msgsToSend = [];

    uploadedFiles.forEach(file => {
      msgsToSend.push({
        sender: "buyer",
        message: "",
        message_type: file.type,
        file_url: file.url,
        file_type: file.type,
        user_id: user.id,
        store_id: storeId,
      });
    });

    if (newMessage.trim()) {
      msgsToSend.push({
        sender: "buyer",
        message: DOMPurify.sanitize(newMessage),
        message_type: "text",
        file_url: null,
        file_type: null,
        user_id: user.id,
        store_id: storeId,
      });
    }

    msgsToSend.forEach(msg => sendMessage({ storeId, chat: msg }));

    // clear input and previews like WhatsApp
    setNewMessage("");
    setAttachments([]);
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {messages.map((m) => {
          const isSelf = m.sender === "buyer";
          return (
            <div
              key={m.id || `${m.created_at}-${Math.random()}`}
              className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`rounded-lg p-2 max-w-[75%] shadow ${
                  isSelf ? "bg-indigo-600 text-white" : "bg-white text-gray-900"
                }`}
              >
                {m.message_type === "text" && <div className="whitespace-pre-wrap">{m.message}</div>}

                {m.file_url && (
                  <>
                    {m.message_type === "image" && <img src={m.file_url} className="rounded max-h-52" />}
                    {m.message_type === "video" && <video src={m.file_url} className="rounded max-h-52" controls />}
                    {m.message_type !== "image" && m.message_type !== "video" && (
                      <a href={m.file_url} target="_blank" rel="noreferrer" className="underline text-indigo-700">
                        {m.file_type || "file"}
                      </a>
                    )}
                  </>
                )}

                <div className={`text-xs mt-1 ${isSelf ? "text-indigo-100" : "text-gray-500"}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        {typingStatus && <div className="text-sm text-gray-500 italic">{typingStatus}</div>}
        <div ref={endRef} />
      </div>

      {/* Input & Attachments */}
      <div className="flex items-center gap-2 p-2 border-t border-gray-200 bg-white">
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={newMessage}
          placeholder="Type a message..."
          onChange={(e) => { setNewMessage(e.target.value); handleTypingEvent(); }}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        <ChatFileUpload ref={fileUploadRef} onSelectAttachments={setAttachments} />

        <button
          onClick={handleSend}
          className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}

