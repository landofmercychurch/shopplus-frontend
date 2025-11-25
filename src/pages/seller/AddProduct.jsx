// src/pages/seller/AddProduct.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { productService } from "../../services/productService";
import { campaignService } from "../../services/campaignService";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

export const AddProduct = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    stock: 0,
    image_url: "",
    campaign_id: "",
    campaign_name: "",
    discount_percent: "",
  });

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCampaigns, setFetchingCampaigns] = useState(true);
  const [error, setError] = useState("");

  // Fetch campaigns for the seller store
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const store = await productService.getStore();
        const data = await campaignService.getCampaignsByStore(store.id);
        setCampaigns(data || []);
      } catch (err) {
        console.warn("⚠️ Could not load campaigns:", err.message);
      } finally {
        setFetchingCampaigns(false);
      }
    };
    fetchCampaigns();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "campaign_id") {
      const selected = campaigns.find((c) => c.id === value);
      setForm((prev) => ({
        ...prev,
        campaign_id: value,
        campaign_name: selected?.name || "",
        discount_percent: selected?.discount_percent || "",
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Submit new product
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = { ...form };
      payload.price = Number(payload.price);
      payload.stock = Number(payload.stock) || 0;

      if (!payload.name.trim()) throw new Error("Product name is required.");
      if (!payload.category.trim()) throw new Error("Category is required.");
      if (isNaN(payload.price) || payload.price <= 0)
        throw new Error("Price must be a valid positive number.");

      if (payload.campaign_id && payload.discount_percent) {
        payload.old_price = payload.price;
        payload.price -= (payload.price * Number(payload.discount_percent)) / 100;
      } else {
        payload.old_price = null;
        payload.discount_percent = null;
        payload.campaign_name = null;
      }

      // ✅ Correctly call createProduct
      await productService.createProduct(payload);

      alert("✅ Product added successfully!");
      navigate("/seller/products?added=1");
    } catch (err) {
      console.error("❌ Add product failed:", err);
      setError(err.message || "Failed to add product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-indigo-600">Add New Product</h2>

      {error && (
        <p className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
        />

        <textarea
          name="description"
          placeholder="Description (optional)"
          value={form.description}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
        />

        <input
          type="text"
          name="category"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
        />

        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            name="price"
            placeholder="Price"
            value={form.price}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
          />
          <input
            type="number"
            name="stock"
            placeholder="Stock"
            value={form.stock}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>

        <input
          type="text"
          name="image_url"
          placeholder="Image URL (optional)"
          value={form.image_url}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
        />

        <div>
          <label className="block mb-1 text-gray-700 font-medium">
            Attach Campaign (Optional)
          </label>
          <select
            name="campaign_id"
            value={form.campaign_id}
            onChange={handleChange}
            disabled={fetchingCampaigns}
            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">
              {fetchingCampaigns ? "Loading campaigns..." : "No Campaign"}
            </option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.discount_percent}%
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2 w-5 h-5" /> Adding Product...
            </>
          ) : (
            "Add Product"
          )}
        </button>
      </form>
    </div>
  );
};

