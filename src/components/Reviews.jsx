// src/components/Reviews.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchWithAuth } from "../services/authService.js";
import DOMPurify from "dompurify";

export default function Reviews({ productId }) {
  const { user } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // -------------------- Fetch reviews --------------------
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${productId}`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      setReviews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) fetchReviews();
  }, [productId]);

  // -------------------- Submit review --------------------
  const handleSubmit = async () => {
    if (!user) return alert("Please login to submit a review.");
    if (!rating) return alert("Please select a rating.");

    setSubmitting(true);
    try {
      const safeComment = DOMPurify.sanitize(comment);

      const res = await fetchWithAuth("/reviews", "POST", {
        product_id: productId,
        buyer_id: user.id,
        rating,
        comment: safeComment || null,
      });

      alert("Review submitted successfully!");
      setRating(0);
      setComment("");
      fetchReviews(); // refresh review list
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------- Render stars --------------------
  const Star = ({ filled }) => (
    <span className={filled ? "text-yellow-400" : "text-gray-300"}>★</span>
  );

  const Skeleton = () => (
    <div className="animate-pulse space-y-2 py-2">
      <div className="h-4 w-32 bg-gray-200 rounded"></div>
      <div className="h-3 w-full bg-gray-200 rounded"></div>
      <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
    </div>
  );

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Reviews</h2>

      {/* -------------------- Review List -------------------- */}
      {loading ? (
        <>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500">No reviews yet. Be the first to review!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border p-4 rounded bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} filled={i <= r.rating} />
                ))}
                <span className="text-gray-500 text-sm">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
              {r.comment && (
                <p
                  className="text-gray-700"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(r.comment) }}
                ></p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* -------------------- Add Review Form -------------------- */}
      {user && user.role === "buyer" && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-semibold mb-2">Write a Review</h3>
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                onClick={() => setRating(i)}
                type="button"
                className={`text-2xl ${i <= rating ? "text-yellow-400" : "text-gray-300"}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            className="w-full border rounded p-2 mb-2"
            rows={3}
            placeholder="Write your comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      )}
    </div>
  );
}

