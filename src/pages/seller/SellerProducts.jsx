// src/pages/seller/SellerProducts.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import DOMPurify from "dompurify";
import { productService } from "../../services/productService";
import ProductList from "../../components/seller/ProductList";

export const SellerProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [storeExists, setStoreExists] = useState(true);

  const location = useLocation();

  // ===============================
  // Fetch seller store and products
  // ===============================
  const fetchStoreAndProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const store = await productService.getStore();

      if (!store?.id) {
        setStoreExists(false);
        setProducts([]);
        return;
      }

      setStoreExists(true);

      const prodData = await productService.getProductsByStore();
      // Sanitize all product fields for CSP safety
      const sanitizedProducts = Array.isArray(prodData)
        ? prodData.map((p) => ({
            ...p,
            name: DOMPurify.sanitize(p.name),
            description: DOMPurify.sanitize(p.description || ""),
          }))
        : [];
      setProducts(sanitizedProducts);
    } catch (err) {
      console.error("❌ Error fetching seller data:", err);
      setError(err.message || "Failed to fetch products.");
      if ((err.message || "").toLowerCase().includes("store not found")) {
        setStoreExists(false);
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreAndProducts();
  }, []);

  // Refresh products if redirected after adding a new one
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("added") === "1") {
      fetchStoreAndProducts();
      window.history.replaceState({}, "", "/seller/products");
    }
  }, [location.search]);

  // Delete product
  const handleDelete = async (productId) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      await productService.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      alert("✅ Product deleted successfully!");
    } catch (err) {
      console.error("❌ Delete failed:", err);
      alert(err.message || "Failed to delete product.");
    }
  };

  // ===============================
  // Shimmer Skeleton Loader
  // ===============================
  const renderSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse flex space-x-4">
          <div className="bg-gray-300 h-24 w-24 rounded" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-300 rounded w-3/4" />
            <div className="h-4 bg-gray-300 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  // ===============================
  // Render UI
  // ===============================
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Link
            to="/seller/dashboard"
            className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300 transition"
          >
            ← Back to Dashboard
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">My Products</h2>
        </div>
        <Link
          to="/seller/products/add"
          className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition"
        >
          + Add Product
        </Link>
      </div>

      {loading ? (
        <div className="p-4">{renderSkeleton()}</div>
      ) : !storeExists ? (
        <div className="p-4 text-center">
          <p className="text-red-600 mb-4">You don’t have a store set up yet.</p>
          <Link
            to="/seller/setup"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Set Up Your Store
          </Link>
        </div>
      ) : error ? (
        <p className="p-4 text-center text-red-600">{DOMPurify.sanitize(error)}</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500 text-center">
          No products found. Add your first product!
        </p>
      ) : (
        <ProductList products={products} onDelete={handleDelete} />
      )}
    </div>
  );
};

