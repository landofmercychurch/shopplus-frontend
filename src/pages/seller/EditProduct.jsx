// src/pages/seller/EditProduct.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { ProductForm } from "../../components/seller/ProductForm";
import { productService } from "../../services/productService";
import { campaignService } from "../../services/campaignService";
import { useSellerAuth } from "../../context/SellerAuthContext";

export const EditProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { getValidToken } = useSellerAuth();

  const [product, setProduct] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // ===============================
  // Fetch product & campaigns
  // ===============================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      setSessionExpired(false);

      try {
        const token = await getValidToken();
        if (!token) throw new Error("Unauthorized");

        // ✅ NEW ROUTE → GET /products/:id
        const productData = await productService.getProduct(productId);
        if (!productData) throw new Error("Product not found.");
        setProduct(productData);

        const store = await productService.getStore();
        if (!store?.id) throw new Error("Store not found for this user.");

        const campaignsData = await campaignService.getCampaignsByStore(store.id);
        setCampaigns(campaignsData || []);

      } catch (err) {
        console.error("❌ Fetch error:", err);

        const msg = err.message?.toLowerCase() || "";
        if (msg.includes("token") || msg.includes("unauthorized")) {
          setSessionExpired(true);
          return;
        }

        setError(err.message || "Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, getValidToken]);

  // ===============================
  // Handle product update
  // ===============================
  const handleUpdate = async (updatedProduct) => {
    setSaving(true);
    setError("");
    setSessionExpired(false);

    try {
      const token = await getValidToken();
      if (!token) throw new Error("Unauthorized");

      const payload = { ...updatedProduct };

      payload.price = Number(payload.price);
      payload.stock = Number(payload.stock) || 0;

      if (!payload.price || payload.price <= 0) {
        throw new Error("Price must be greater than 0.");
      }

      // Apply discount if needed
      if (payload.campaign_id && payload.discount_percent) {
        payload.old_price = payload.price;
        payload.price -= (payload.price * Number(payload.discount_percent)) / 100;
      } else {
        payload.old_price = null;
        payload.discount_percent = null;
        payload.campaign_name = null;
      }

      // ✅ NEW ROUTE → PUT /products/:id
      await productService.updateProduct(productId, payload);

      alert("✅ Product updated successfully!");
      navigate("/seller/products?updated=1");

    } catch (err) {
      console.error("❌ Update error:", err);

      const msg = err.message?.toLowerCase() || "";
      if (msg.includes("token") || msg.includes("unauthorized")) {
        setSessionExpired(true);
        return;
      }

      setError(err.message || "Failed to update product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ===============================
  // Shimmer Loader
  // ===============================
  const renderShimmer = () => (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow-sm animate-pulse">
      <div className="h-8 w-1/3 bg-gray-300 rounded mb-6"></div>
      <div className="space-y-4">
        <div className="h-6 bg-gray-300 rounded"></div>
        <div className="h-6 bg-gray-300 rounded"></div>
        <div className="h-6 bg-gray-300 rounded"></div>
        <div className="h-32 bg-gray-300 rounded"></div>
      </div>
    </div>
  );

  // ===============================
  // Render UI
  // ===============================
  if (loading) return renderShimmer();
  if (error) return <p className="text-red-600 text-center mt-10">{error}</p>;
  if (!product) return <p className="text-center mt-10">Product not found.</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded shadow-sm">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Edit Product</h1>

      {sessionExpired && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded">
          ⚠️ Your session has expired. Please{" "}
          <button onClick={() => window.location.reload()} className="underline font-semibold">
            refresh the page
          </button>{" "}
          or{" "}
          <button onClick={() => navigate("/login")} className="underline font-semibold">
            log in again
          </button>.
        </div>
      )}

      <ProductForm
        onSubmit={handleUpdate}
        product={{
          ...product,
          name: DOMPurify.sanitize(product.name),
          category: DOMPurify.sanitize(product.category || ""),
          description: DOMPurify.sanitize(product.description || ""),
          campaign_name: DOMPurify.sanitize(product.campaign_name || ""),
        }}
        campaigns={campaigns.map((c) => ({
          ...c,
          name: DOMPurify.sanitize(c.name),
        }))}
        disabled={saving || sessionExpired}
      />

      {saving && <p className="mt-4 text-center text-gray-500 italic">Saving changes...</p>}
    </div>
  );
};

