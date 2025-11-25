// src/pages/ProductDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchWithAuth } from "../services/authService.js";

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);

  // -------------------- Review state --------------------
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // -------------------- Fetch product --------------------
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Failed to fetch product data");
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  // -------------------- Fetch reviews --------------------
  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/reviews/${id}`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      setReviews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchReviews();
  }, [id]);

  // -------------------- Format Naira --------------------
  const formatNaira = (amount) =>
    amount != null
      ? `₦${Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
      : "";

  // -------------------- Add to cart --------------------
  const handleAddToCart = async () => {
    if (!user) return alert("Please login first to add products to your cart.");
    if (!product?.id) return alert("Cannot add product: invalid product ID.");

    try {
      setAddingToCart(true);
      await fetchWithAuth("/cart", "POST", { product_id: product.id, quantity: 1 });
      alert("Product added to cart!");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  // -------------------- Submit review --------------------
  const handleSubmitReview = async () => {
    if (!user) return alert("Please login to submit a review.");
    if (!rating) return alert("Please select a rating.");
    setSubmittingReview(true);

    try {
      const safeComment = DOMPurify.sanitize(comment);

      await fetchWithAuth("/reviews", "POST", {
        product_id: product.id,
        buyer_id: user.id,
        rating,
        comment: safeComment || null,
      });

      setRating(0);
      setComment("");
      fetchReviews(); // refresh reviews
      alert("Review submitted successfully!");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // -------------------- Loading Skeleton --------------------
  const Skeleton = () => (
    <div className="animate-pulse space-y-4">
      <div className="bg-gray-300 w-full h-64 md:h-80 rounded"></div>
      <div className="h-6 bg-gray-300 w-3/4 rounded"></div>
      <div className="h-4 bg-gray-300 w-5/6 rounded"></div>
      <div className="h-4 bg-gray-300 w-4/6 rounded"></div>
      <div className="h-10 bg-gray-300 w-1/3 rounded mt-4"></div>
    </div>
  );

  if (loading) return <Skeleton />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!product) return <div>Product not found</div>;

  // -------------------- Sanitize product description --------------------
  const safeDescription = DOMPurify.sanitize(product.description || "");

  // -------------------- Render star --------------------
  const Star = ({ filled }) => (
    <span className={filled ? "text-yellow-400" : "text-gray-300"}>★</span>
  );

  const ReviewSkeleton = () => (
    <div className="animate-pulse space-y-2 py-2">
      <div className="h-4 w-32 bg-gray-200 rounded"></div>
      <div className="h-3 w-full bg-gray-200 rounded"></div>
      <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
    </div>
  );

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Product Image */}
        <div className="md:w-1/2">
          <img
            src={product.image_url || "/product-placeholder.png"}
            alt={product.name || "Product Image"}
            className="w-full h-auto rounded shadow"
          />
        </div>

        {/* Product Details */}
        <div className="md:w-1/2 flex flex-col gap-4">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p
            className="text-gray-700"
            dangerouslySetInnerHTML={{ __html: safeDescription }}
          ></p>

          {product.old_price && product.old_price > product.price && (
            <div className="flex items-center gap-2">
              <span className="line-through text-gray-400">
                {formatNaira(product.old_price)}
              </span>
              <span className="text-red-600 font-semibold">{formatNaira(product.price)}</span>
            </div>
          )}

          {!product.old_price && (
            <p className="text-indigo-600 font-semibold">{formatNaira(product.price)}</p>
          )}

          {product.discount_percent && product.discount_percent > 0 && (
            <p className="text-green-600 font-medium">
              Discount: {product.discount_percent}%
            </p>
          )}

          <button
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {addingToCart ? "Adding..." : "Add to Cart"}
          </button>
        </div>
      </div>

      {/* -------------------- Reviews Section -------------------- */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Reviews</h2>

        {reviewsLoading ? (
          <>
            <ReviewSkeleton />
            <ReviewSkeleton />
            <ReviewSkeleton />
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
              onClick={handleSubmitReview}
              disabled={submittingReview}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

