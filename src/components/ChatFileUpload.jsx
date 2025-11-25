// src/components/ChatFileUpload.jsx
import React, { useState, forwardRef, useImperativeHandle } from "react";
import { v4 as uuidv4 } from "uuid";
import { getValidToken } from "../services/authService.js";

const ChatFileUpload = forwardRef(({ onSelectAttachments }, ref) => {
  const [attachments, setAttachments] = useState([]); // selected files
  const [status, setStatus] = useState({}); // 'waiting' | 'uploading' | 'success' | 'error'
  const [progress, setProgress] = useState({}); // 0-100

  // ---------------- SELECT FILES ----------------
  const handleFiles = (files, type) => {
    if (!files || files.length === 0) return;

    const newAttachments = Array.from(files).map(file => ({
      id: uuidv4(),
      file,
      type,
      previewUrl: URL.createObjectURL(file),
      url: null
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
    onSelectAttachments(prev => [...prev, ...newAttachments]);

    const newStatus = {};
    const newProgress = {};
    newAttachments.forEach(att => {
      newStatus[att.id] = "waiting";
      newProgress[att.id] = 0;
    });
    setStatus(prev => ({ ...prev, ...newStatus }));
    setProgress(prev => ({ ...prev, ...newProgress }));
  };

  // ---------------- REMOVE FILE ----------------
  const handleRemove = (id) => {
    const attToRemove = attachments.find(f => f.id === id);
    if (attToRemove?.previewUrl) URL.revokeObjectURL(attToRemove.previewUrl);

    setAttachments(prev => prev.filter(f => f.id !== id));
    setStatus(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
    setProgress(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
    onSelectAttachments(prev => prev.filter(f => f.id !== id));
  };

  // ---------------- UPLOAD FILES ----------------
  useImperativeHandle(ref, () => ({
    uploadFiles: async () => {
      const uploadedAttachments = [];

      for (const att of attachments) {
        if (status[att.id] === "success") {
          uploadedAttachments.push(att);
          continue;
        }

        setStatus(prev => ({ ...prev, [att.id]: "uploading" }));
        setProgress(prev => ({ ...prev, [att.id]: 0 }));

        try {
          const token = await getValidToken();
          const formData = new FormData();
          formData.append("files", att.file);

          // ---------------- TRACK UPLOAD PROGRESS ----------------
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/uploads/chat`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });

          const data = await res.json();
          if (!data?.success || !Array.isArray(data.files) || data.files.length === 0) {
            throw new Error("Upload failed");
          }

          // ---------------- UPDATE ATTACHMENT ----------------
          att.url = data.files[0].url;
          att.type = data.files[0].type; // match backend type
          setStatus(prev => ({ ...prev, [att.id]: "success" }));
          setProgress(prev => ({ ...prev, [att.id]: 100 }));
          uploadedAttachments.push(att);

          // ---------------- CLEAR MEMORY ----------------
          if (att.previewUrl) {
            URL.revokeObjectURL(att.previewUrl);
            att.previewUrl = null;
          }
        } catch (err) {
          setStatus(prev => ({ ...prev, [att.id]: "error" }));
          setProgress(prev => ({ ...prev, [att.id]: 0 }));
          console.error(`[ERROR] Upload failed for ${att.file.name}:`, err);
        }
      }

      return uploadedAttachments;
    }
  }));

  // ---------------- RENDER PREVIEW ----------------
  const renderPreview = (att) => {
    const uploadMessage = {
      waiting: "Waiting...",
      uploading: `Uploading ${progress[att.id] || 0}%`,
      success: "Uploaded",
      error: "Upload failed",
    }[status[att.id]];

    let preview;
    if (att.type === "image") {
      preview = <img src={att.previewUrl || att.url} alt="preview" className="h-16 rounded border" />;
    } else if (att.type === "video") {
      preview = <video src={att.previewUrl || att.url} className="h-16 rounded border" controls />;
    } else {
      preview = (
        <a
          href={att.url || att.previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-16 flex items-center justify-center border rounded px-2 text-sm bg-gray-100"
        >
          {att.file.name}
        </a>
      );
    }

    return (
      <div className="relative w-32">
        {preview}
        {/* STATUS TEXT */}
        <div className="absolute bottom-6 left-0 w-full bg-black bg-opacity-50 text-white text-xs text-center">
          {uploadMessage}
        </div>
        {/* PROGRESS BAR */}
        {status[att.id] === "uploading" && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-300 rounded">
            <div
              className="h-1 bg-green-500 rounded"
              style={{ width: `${progress[att.id] || 0}%` }}
            />
          </div>
        )}
        {/* REMOVE BUTTON */}
        <button
          className="absolute top-0 right-0 text-red-500 font-bold bg-white rounded-full"
          onClick={() => handleRemove(att.id)}
        >
          ✕
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {/* UPLOAD BUTTONS */}
      <div className="flex items-center gap-2">
        <label className="cursor-pointer bg-gray-200 px-3 py-1 rounded flex items-center gap-1">
          🖼️
          <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files, "image")} />
        </label>
        <label className="cursor-pointer bg-gray-200 px-3 py-1 rounded flex items-center gap-1">
          🎬
          <input type="file" className="hidden" accept="video/*" multiple onChange={(e) => handleFiles(e.target.files, "video")} />
        </label>
        <label className="cursor-pointer bg-gray-200 px-3 py-1 rounded flex items-center gap-1">
          📄
          <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" multiple onChange={(e) => handleFiles(e.target.files, "document")} />
        </label>
      </div>

      {/* PREVIEWS */}
      {attachments.length > 0 && (
        <div className="flex gap-2 overflow-x-auto mt-2">
          {attachments.map(att => (
            <div key={att.id}>{renderPreview(att)}</div>
          ))}
        </div>
      )}
    </div>
  );
});

export default ChatFileUpload;

