// src/components/SellerChat.jsx
import React, { useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { v4 as uuidv4 } from "uuid";
import axiosSeller from "../../utils/axiosSeller"; // Use axiosSeller for HttpOnly cookies
import { useSellerAuth } from "../../context/SellerAuthContext.jsx";
import { useSocket } from "../../context/SellerSocketContext.jsx";
import ChatFileUpload from "../../components/ChatFileUploadseller.jsx";

export default function SellerChat({ storeId, onClose }) {
  const { user } = useSellerAuth();
  const { socket, joinRoom, sendMessage, sendTyping } = useSocket();

  const [inbox, setInbox] = useState([]);
  const [activeBuyer, setActiveBuyer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingStatus, setTypingStatus] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState({
    inbox: false,
    messages: false
  });

  const fileUploadRef = useRef();
  const endRef = useRef(null);
  const typingTimeout = useRef(null);

  /* ---------------- FETCH INBOX ---------------- */
  useEffect(() => {
    const fetchInbox = async () => {
      setLoading(prev => ({ ...prev, inbox: true }));
      try {
        // Using axiosSeller with HttpOnly cookies
        console.log("[SellerChat] Fetching seller inbox...");
        const response = await axiosSeller.get("/chats/seller/inbox");
        const data = response.data;
        
        console.log("[SellerChat] Inbox response:", {
          status: response.status,
          data: data
        });
        
        setInbox(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("[SellerChat] Inbox fetch failed:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data
        });
        setInbox([]);
        
        // Show user-friendly error
        if (err.response?.status === 401) {
          console.error("[SellerChat] Authentication error - seller may need to login again");
        }
      } finally {
        setLoading(prev => ({ ...prev, inbox: false }));
      }
    };
    
    if (storeId) {
      fetchInbox();
    }
  }, [storeId]);

  /* ---------------- JOIN ROOM ---------------- */
  useEffect(() => {
    if (!socket || !storeId) return;
    console.log("[SellerChat] Joining socket room for store:", storeId);
    joinRoom({ storeId });
  }, [socket, storeId, joinRoom]);

  /* ---------------- SOCKET EVENTS ---------------- */
  useEffect(() => {
    if (!socket) return;

    console.log("[SellerChat] Setting up socket listeners");

    const handleReceive = async (payload) => {
      console.log("[SellerChat] Received message via socket:", payload);
      const chat = payload?.chat ?? payload;
      
      if (!chat || chat.store_id !== storeId) return;

      if (String(chat.user_id) === String(activeBuyer)) {
        // Add message to current conversation
        setMessages(prev => [...prev, chat]);
        
        // Mark as read using axiosSeller
        try {
          await axiosSeller.post(`/chats/mark-read?buyerId=${chat.user_id}`, { storeId });
          console.log("[SellerChat] Message marked as read");
        } catch (err) {
          console.error("[SellerChat] Error marking message as read:", err);
        }
      } else {
        // Refresh inbox for new messages
        try {
          const response = await axiosSeller.get("/chats/seller/inbox");
          setInbox(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
          console.error("[SellerChat] Error refreshing inbox:", err);
        }
      }
    };

    const handleTyping = ({ sender, buyerId }) => {
      console.log("[SellerChat] Typing event received:", { sender, buyerId });
      if (sender === "buyer" && String(buyerId) === String(activeBuyer)) {
        setTypingStatus("Buyer is typing...");
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
          console.log("[SellerChat] Clearing typing status");
          setTypingStatus("");
        }, 1500);
      }
    };

    const handleMessagesRead = ({ buyerId }) => {
      console.log("[SellerChat] Messages read event for buyer:", buyerId);
      setInbox(prev => prev.map(i => 
        String(i.buyer_id) === String(buyerId) ? { ...i, unread_count: 0 } : i
      ));
    };

    socket.on("receive_message", handleReceive);
    socket.on("typing", handleTyping);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      console.log("[SellerChat] Cleaning up socket listeners");
      socket.off("receive_message", handleReceive);
      socket.off("typing", handleTyping);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [socket, activeBuyer, storeId]);

  /* ---------------- FETCH CONVERSATION ---------------- */
  const fetchConversation = (buyerId) => {
    if (!buyerId) {
      console.warn("[SellerChat] No buyerId provided to fetchConversation");
      return;
    }
    
    console.log("[SellerChat] Fetching conversation for buyer:", buyerId);
    setActiveBuyer(buyerId);
    setLoading(prev => ({ ...prev, messages: true }));

    const fetchConv = async () => {
      try {
        // Using axiosSeller with HttpOnly cookies
        const response = await axiosSeller.get(`/chats/conversation/${storeId}?buyerId=${buyerId}`);
        const data = response.data;
        
        console.log("[SellerChat] Conversation response:", {
          status: response.status,
          count: Array.isArray(data) ? data.length : 0
        });
        
        setMessages(Array.isArray(data) ? data : []);
        
        // Mark messages as read
        await axiosSeller.post(`/chats/mark-read?buyerId=${buyerId}`, { storeId });
        console.log("[SellerChat] Conversation marked as read");
        
      } catch (err) {
        console.error("[SellerChat] Conversation fetch failed:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data
        });
        setMessages([]);
        
        // Show alert for user-facing errors
        if (err.response?.status === 404) {
          console.log("[SellerChat] No conversation found - starting fresh");
        }
      } finally {
        setLoading(prev => ({ ...prev, messages: false }));
      }
    };
    
    fetchConv();
  };

  /* ---------------- SEND MESSAGE ---------------- */
  const handleSend = async () => {
    if (!activeBuyer) {
      alert("Please select a buyer to chat with");
      return;
    }

    console.log("[SellerChat] Sending message to buyer:", activeBuyer);

    let uploadedFiles = [];
    if (fileUploadRef.current) {
      console.log("[SellerChat] Uploading files...");
      uploadedFiles = await fileUploadRef.current.uploadFiles();

      // Clear previews after successful upload
      const successfullyUploaded = uploadedFiles.filter(f => f.url);
      if (successfullyUploaded.length > 0) {
        setAttachments([]); // clear preview area immediately
      }

      const failed = uploadedFiles.filter(f => !f.url);
      if (failed.length > 0) {
        alert("Some files failed to upload. Please try again.");
        return;
      }
    }

    const msgsToSend = [];

    // Add file messages
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

    // Add text message if exists
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

    // Send all messages via socket
    msgsToSend.forEach(msg => {
      console.log("[SellerChat] Sending message via socket:", {
        storeId,
        type: msg.message_type
      });
      sendMessage({ storeId, chat: msg });
    });

    // Also send to backend API for persistence
    if (msgsToSend.length > 0) {
      try {
        // Send to backend API for persistence
        await axiosSeller.post("/chats/send", {
          storeId,
          messages: msgsToSend
        });
        console.log("[SellerChat] Messages saved to backend");
      } catch (err) {
        console.error("[SellerChat] Error saving messages to backend:", err);
        // Don't alert user - socket delivery is more important for real-time
      }
    }

    setNewMessage("");
  };

  /* ---------------- TYPING ---------------- */
  const handleTypingEvent = () => {
    if (!activeBuyer) return;
    
    console.log("[SellerChat] Sending typing indicator to buyer:", activeBuyer);
    sendTyping({ 
      storeId, 
      sender: "seller", 
      targetUserId: activeBuyer 
    });
  };

  /* ---------------- SCROLL TO BOTTOM ---------------- */
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end" 
      });
    }
  }, [messages, typingStatus]);

  /* ---------------- REFRESH INBOX ---------------- */
  const refreshInbox = async () => {
    console.log("[SellerChat] Refreshing inbox...");
    try {
      const response = await axiosSeller.get("/chats/seller/inbox");
      setInbox(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("[SellerChat] Error refreshing inbox:", err);
    }
  };

  // Don't render if no storeId
  if (!storeId) {
    console.warn("[SellerChat] No storeId provided, not rendering");
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[85vh] flex overflow-hidden border border-gray-300">
        {/* INBOX SIDEBAR */}
        <div className="w-80 border-r bg-gray-50 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
            <h3 className="font-semibold text-lg text-gray-800">Customer Inbox</h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={refreshInbox} 
                className="text-sm text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-100"
                title="Refresh inbox"
                disabled={loading.inbox}
              >
                {loading.inbox ? "⟳" : "⟳"}
              </button>
              <button 
                onClick={onClose} 
                className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                title="Close chat"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading.inbox ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading conversations...</p>
              </div>
            ) : inbox.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">No conversations yet</p>
                <p className="text-gray-400 text-xs mt-1">When customers message you, they'll appear here</p>
              </div>
            ) : (
              inbox.map((c) => (
                <button
                  key={c.buyer_id}
                  onClick={() => fetchConversation(c.buyer_id)}
                  className={`w-full p-4 flex justify-between items-center hover:bg-gray-100 border-b border-gray-100 transition-colors ${
                    activeBuyer == c.buyer_id ? "bg-blue-50 border-l-4 border-l-indigo-500" : ""
                  }`}
                >
                  <div className="text-left truncate flex-1">
                    <div className="font-medium text-gray-800 truncate">{c.buyer_name || `Customer ${c.buyer_id?.substring(0, 8)}`}</div>
                    <div className="text-sm text-gray-600 truncate mt-1">
                      {c.last_message || "No messages yet"}
                    </div>
                    {c.last_message_time && (
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(c.last_message_time).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    )}
                  </div>
                  {c.unread_count > 0 && (
                    <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full min-w-[24px] flex items-center justify-center">
                      {c.unread_count}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
          
          {/* Store info footer */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="text-xs text-gray-500 truncate">
              Store: {storeId?.substring(0, 8)}...
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {inbox.length} conversations
            </div>
          </div>
        </div>

        {/* MAIN CHAT WINDOW */}
        <div className="flex-1 flex flex-col">
          {/* CHAT HEADER */}
          <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
            <div>
              <div className="font-semibold text-gray-800">
                {inbox.find(i => i.buyer_id == activeBuyer)?.buyer_name || "Select a customer"}
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                {typingStatus && (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>{typingStatus}</span>
                  </>
                )}
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
              title="Close chat"
            >
              ✕
            </button>
          </div>

          {/* MESSAGES AREA */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {loading.messages ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-3">Loading messages...</p>
                </div>
              </div>
            ) : !activeBuyer ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Select a conversation</h3>
                  <p className="text-gray-500 text-sm">
                    Choose a customer from the left sidebar to start chatting
                  </p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No messages yet</h3>
                  <p className="text-gray-500 text-sm">
                    Start the conversation by sending a message
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m) => {
                  const mine = m.sender === "seller";
                  const messageDate = new Date(m.created_at);
                  const formattedTime = messageDate.toLocaleTimeString([], { 
                    hour: "2-digit", 
                    minute: "2-digit" 
                  });
                  
                  return (
                    <div 
                      key={m.id || uuidv4()} 
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[70%] ${mine ? "ml-auto" : "mr-auto"}`}>
                        {!mine && (
                          <div className="text-xs text-gray-500 mb-1 ml-1">
                            {inbox.find(i => i.buyer_id == m.user_id)?.buyer_name || "Customer"}
                          </div>
                        )}
                        <div className={`p-3 rounded-2xl shadow-sm ${
                          mine 
                            ? "bg-indigo-600 text-white rounded-tr-none" 
                            : "bg-white text-gray-800 rounded-tl-none border border-gray-200"
                        }`}>
                          {m.message_type === "text" && (
                            <div className="whitespace-pre-wrap break-words">{m.message}</div>
                          )}
                          {m.message_type === "image" && (
                            <div className="rounded-lg overflow-hidden">
                              <img 
                                src={m.file_url} 
                                alt="Shared image" 
                                className="max-w-full max-h-64 object-cover rounded" 
                                loading="lazy"
                              />
                            </div>
                          )}
                          {m.message_type === "video" && (
                            <div className="rounded-lg overflow-hidden">
                              <video 
                                src={m.file_url} 
                                className="max-w-full max-h-64 rounded" 
                                controls 
                              />
                            </div>
                          )}
                          <div className={`text-xs mt-2 ${mine ? "text-indigo-200" : "text-gray-500"}`}>
                            {formattedTime}
                            {m.is_read && mine && (
                              <span className="ml-2">✓ Read</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
            )}
          </div>

          {/* MESSAGE INPUT */}
          <div className="p-4 bg-white border-t border-gray-200">
            {!activeBuyer ? (
              <div className="text-center text-gray-500 text-sm py-3">
                Select a customer to start chatting
              </div>
            ) : (
              <>
                {/* Attachment preview */}
                {attachments.length > 0 && (
                  <div className="mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Attachments ({attachments.length})</span>
                      <button 
                        onClick={() => setAttachments([])}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="relative">
                          {file.type.startsWith('image/') ? (
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt={`Attachment ${index + 1}`}
                              className="w-16 h-16 object-cover rounded border border-gray-300"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded border border-gray-300 flex items-center justify-center">
                              <span className="text-xs text-gray-600 truncate px-1">
                                {file.name}
                              </span>
                            </div>
                          )}
                          <button 
                            onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Type your message here..."
                    value={newMessage}
                    onChange={(e) => { 
                      setNewMessage(e.target.value); 
                      handleTypingEvent(); 
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    disabled={!activeBuyer || loading.messages}
                  />
                  <ChatFileUpload 
                    ref={fileUploadRef} 
                    onSelectAttachments={setAttachments} 
                    disabled={!activeBuyer}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!activeBuyer || (!newMessage.trim() && attachments.length === 0)}
                    className="bg-indigo-600 text-white px-5 py-3 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                    <span>Send</span>
                  </button>
                </div>
                
                {/* Helper text */}
                <div className="text-xs text-gray-500 mt-2 text-center">
                  Press Enter to send • Ctrl/Cmd + Enter for new line
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
