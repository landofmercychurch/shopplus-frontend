// src/components/Tracking.jsx
import React, { useEffect, useState } from "react";
import { useBuyerAuth } from "../context/BuyerAuthContext";
import axios from "../utils/axiosPublic";
import DOMPurify from "dompurify";

// Shimmer skeleton row
function SkeletonRow({ width = "full", height = 4 }) {
  return (
    <div
      className="animate-pulse bg-gray-300 rounded mb-2"
      style={{ width: width === "full" ? "100%" : width, height: `${height}rem` }}
    />
  );
}

export default function Tracking({ orderId }) {
  const { user, loading: authLoading, rehydrated } = useBuyerAuth();
  const [updates, setUpdates] = useState([]);
  const [orderStatus, setOrderStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !orderId || authLoading || !rehydrated) return;

    const fetchTracking = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`/tracking/order/${orderId}`, {
          withCredentials: true,
        });

        const data = res.data?.data || {};
        setUpdates(Array.isArray(data.updates) ? data.updates : []);
        setOrderStatus(data.status || "");
      } catch (err) {
        console.error("❌ Error fetching tracking:", err);
        setError(err.response?.data?.error || err.message || "Failed to load tracking updates.");
        setUpdates([]);
        setOrderStatus("");
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [user, orderId, authLoading, rehydrated]);

  if (authLoading || !rehydrated || loading) {
    return (
      <div className="mt-2 border p-3 rounded bg-gray-50 space-y-2">
        <SkeletonRow width="60%" height={5} />
        <SkeletonRow width="80%" />
        <SkeletonRow width="70%" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-2 border p-3 rounded bg-red-50 text-red-700 font-semibold">
        {DOMPurify.sanitize(error)}
      </div>
    );
  }

  if (!updates.length && !orderStatus) {
    return <p className="mt-2 text-gray-500">No tracking updates yet.</p>;
  }

  return (
    <div className="mt-2 border p-3 rounded bg-gray-50 space-y-2">
      {orderStatus === "cancelled" && (
        <p className="text-red-600 font-semibold mb-2">Order Cancelled</p>
      )}

      {updates.length > 0 ? (
        <ul className="space-y-2">
          {updates.map((u) => (
            <li key={u.id} className="border-l-4 border-blue-500 pl-2">
              <p>
                <strong>Status:</strong> {DOMPurify.sanitize(u.status)}
              </p>
              {u.location && (
                <p>
                  <strong>Location:</strong> {DOMPurify.sanitize(u.location)}
                </p>
              )}
              {u.message && <p>{DOMPurify.sanitize(u.message)}</p>}
              <p className="text-sm text-gray-500">
                {new Date(u.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          No tracking updates yet. Current status:{" "}
          <strong>{DOMPurify.sanitize(orderStatus)}</strong>
        </p>
      )}
    </div>
  );
}

