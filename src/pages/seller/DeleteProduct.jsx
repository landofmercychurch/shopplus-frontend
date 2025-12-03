// src/pages/seller/DeleteProduct.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DOMPurify from "dompurify";
import { productService } from "../../services/productService";

export const DeleteProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // ==============================
  // Fetch product details
  // ==============================
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await productService.getProduct(productId);
        if (!data) throw new Error("Product not found.");
        setProduct(data);
      } catch (err) {
        console.error("❌ Failed to fetch product:", err);
        setError(err.message || "Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // ==============================
  // Handle product deletion
  // ==============================
  const handleDelete = async () => {
    if (!window.confirm("⚠️ Are you sure you want to delete this product permanently?")) return;

    setDeleting(true);
    setError("");

    try {
      await productService.deleteProduct(productId);
      alert("✅ Product deleted successfully!");
      navigate("/seller/products?deleted=1");
    } catch (err) {
      console.error("❌ Failed to delete product:", err);
      setError(err.message || "Failed to delete product. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // ==============================
  // Conditional rendering
  // ==============================
  if (loading) return <p className="text-center mt-10">Loading product details...</p>;
  if (error) return <p className="text-red-600 text-center mt-10">{error}</p>;
  if (!product) return <p className="text-center mt-10">Product not found.</p>;

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded shadow-sm">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Delete Product</h1>
      <p className="mb-4 text-gray-700">
        Are you sure you want to <span className="font-semibold text-red-600">delete</span> the following product?
      </p>

      <div className="border p-4 rounded mb-4 bg-gray-50">
        <h2 className="font-semibold text-lg text-gray-900">{DOMPurify.sanitize(product.name)}</h2>
        <p className="text-gray-700">Price: ₦{Number(product.price).toFixed(2)}</p>
        <p className="text-gray-700">Category: {DOMPurify.sanitize(product.category || "—")}</p>
        {product.campaign_name && (
          <p className="text-sm text-green-600">
            Campaign: {DOMPurify.sanitize(product.campaign_name)} ({product.discount_percent}% off)
          </p>
        )}
        {product.description && (
          <p
            className="text-gray-700 mt-2"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }}
          />
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition disabled:opacity-60"
        >
          {deleting ? "Deleting..." : "Delete Product"}
        </button>

        <Link
          to="/seller/products"
          className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
};

