import React, { useState, useEffect } from "react";
import axios from "axios";
import { useBuyerAuth } from "../../context/BuyerAuthContext.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function FollowButton({ storeId, initialFollowersCount = 0 }) {
  const { user: authUser } = useBuyerAuth();

  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  // ===== Check if user is already following the store =====
  useEffect(() => {
    const checkFollowingStatus = async () => {
      if (!authUser) return;

      try {
        const res = await axios.get(`${API_BASE_URL}/followers/${storeId}/count`, {
          withCredentials: true, // send cookies automatically
        });

        if (typeof res.data.following === "boolean") setFollowing(res.data.following);
        if (res.data.followersCount != null) setFollowersCount(res.data.followersCount);
      } catch (err) {
        console.error("❌ Failed to check following status:", err.response?.data || err.message);
      }
    };

    checkFollowingStatus();
  }, [storeId, authUser]);

  // ===== Follow / Unfollow handler =====
  const handleFollowToggle = async () => {
    if (!authUser) return alert("You must be logged in to follow a store.");

    setLoading(true);
    try {
      const endpoint = following ? "unfollow" : "follow";
      const res = await axios.post(
        `${API_BASE_URL}/followers/${endpoint}`,
        { storeId },
        { withCredentials: true } // send cookies automatically
      );

      setFollowing(!following);
      setFollowersCount(res.data.followersCount ?? followersCount + (following ? -1 : 1));
    } catch (err) {
      console.error("❌ Failed to follow/unfollow store:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to follow/unfollow store");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollowToggle}
      disabled={loading}
      className={`flex-1 py-2 rounded ${
        following ? "bg-gray-300 text-gray-700" : "bg-indigo-500 text-white hover:bg-indigo-600"
      }`}
    >
      {loading ? "..." : following ? "Following" : "Follow"} ({followersCount})
    </button>
  );
}

