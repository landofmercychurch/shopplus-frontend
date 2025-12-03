

import React, { useState } from "react";
import { useSellerAuth } from "../context/SellerAuthContext";
import DOMPurify from "dompurify";

/**
 * type: "store" | "chat" | "product" | "review"
 */
export default function ImageUpload({ label, url, onUrlChange, fullWidth, type = "store" }) {
  const { getValidToken } = useSellerAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // File size limits
    const maxSizeMB = type === "chat" && file.type.startsWith("video/") ? 10 : 5;
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File too large. Max ${maxSizeMB}MB.`);
      return;
    }

    setUploading(true);
    setProgress(0);
    setProgressMessage("Wait for the upload to finish...");

    const formData = new FormData();
    formData.append("files", file);

    try {
      const token = await getValidToken(); // Get fresh token from AuthContext
      const xhr = new XMLHttpRequest();

      // Determine correct backend endpoint
      let endpoint = "/uploads/store";
      if (type === "chat") endpoint = "/uploads/chat";
      if (type === "product") endpoint = "/uploads/product";
      if (type === "review") endpoint = "/uploads/review";

      xhr.open("POST", `${import.meta.env.VITE_API_BASE_URL}${endpoint}`, true);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        setUploading(false);
        setProgress(0);

        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          if (response.success && response.files.length > 0) {
            onUrlChange(DOMPurify.sanitize(response.files[0].url));
            setProgressMessage("Upload successful!");
          } else {
            setProgressMessage("");
            alert(response.error || "Upload failed");
          }
        } else if (xhr.status === 401) {
          setProgressMessage("");
          alert("Unauthorized. Please login again.");
        } else {
          setProgressMessage("");
          alert("Upload failed. Server error.");
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        setProgress(0);
        setProgressMessage("");
        alert("Upload error occurred");
      };

      xhr.send(formData);
    } catch (err) {
      setUploading(false);
      setProgress(0);
      setProgressMessage("");
      console.error("Upload error:", err);
      alert("Failed to upload file. Please try again.");
    }
  };

  return (
    <div>
      <label className="block mb-1 font-semibold">{label} Preview</label>
      {url && (
        <img
          src={url}
          alt={`${label} Preview`}
          className={`${fullWidth ? "w-full h-32" : "w-24 h-24"} object-cover rounded border mb-2`}
        />
      )}
      <input
        type="file"
        accept={type === "chat" ? "image/*,video/*" : "image/*"}
        onChange={handleFile}
        className="w-full border px-3 py-2 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {uploading && (
        <div className="mb-2">
          <div className="w-full bg-gray-200 rounded h-3 mb-1">
            <div
              className="bg-blue-500 h-3 rounded transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-700">{progressMessage}</p>
        </div>
      )}
     {/*
<input
  type="text"
  placeholder={`Or paste ${label} URL`}
  value={url || ""}
  onChange={(e) => onUrlChange(DOMPurify.sanitize(e.target.value))}
  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
*/}

    </div>
  );
}

