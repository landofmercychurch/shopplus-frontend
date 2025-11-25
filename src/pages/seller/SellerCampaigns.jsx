import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { campaignService } from "../../services/campaignService";
import { productService } from "../../services/productService";
import { CampaignCard } from "../../components/seller/CampaignCard";
import { useNavigate } from "react-router-dom";
import ImageUpload from "../../components/ImageUpload";
import DOMPurify from "dompurify";

export const SellerCampaigns = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    banner_url: "",
    discount_percent: 0,
    start_date: "",
    end_date: "",
    is_active: true,
    selectedProducts: [],
  });

  // ===============================
  // Fetch campaigns & products with shimmer
  // ===============================
  useEffect(() => {
    if (!user) return;

    const init = async () => {
      setLoading(true);
      try {
        const [campaignData, productData] = await Promise.all([
          campaignService.getCampaignsByStore(user),
          productService.getProductsByStore(user),
        ]);
        setCampaigns(campaignData || []);
        setProducts(productData || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load campaigns and products.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user]);

  // ===============================
  // Modal handlers
  // ===============================
  const openModal = (campaign = null) => {
    if (campaign) {
      const selectedIds = products
        .filter((p) => p.campaign_id === campaign.id)
        .map((p) => p.id);
      setForm({ ...campaign, selectedProducts: selectedIds });
    } else {
      setForm({
        name: "",
        description: "",
        banner_url: "",
        discount_percent: 0,
        start_date: "",
        end_date: "",
        is_active: true,
        selectedProducts: [],
      });
    }
    setEditingCampaign(campaign);
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingCampaign(null);
    setModalOpen(false);
  };

  // ===============================
  // Form handlers
  // ===============================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : DOMPurify.sanitize(value),
    }));
  };

  const toggleProductSelection = (productId) => {
    setForm((prev) => ({
      ...prev,
      selectedProducts: prev.selectedProducts.includes(productId)
        ? prev.selectedProducts.filter((id) => id !== productId)
        : [...prev.selectedProducts, productId],
    }));
  };

  // ===============================
  // Submit campaign
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let campaign;

      if (editingCampaign) {
        campaign = await campaignService.updateCampaign(editingCampaign.id, form);
        alert("✅ Campaign updated!");
      } else {
        campaign = await campaignService.createCampaign(user, form);
        alert("✅ Campaign created!");
      }

      const campaignId = campaign.id || editingCampaign?.id;

      // Update linked products
      await Promise.all(
        products.map(async (p) => {
          const isSelected = form.selectedProducts.includes(p.id);
          const isAssigned = p.campaign_id === campaignId;

          if (isSelected) {
            const product = await productService.getProduct(p.id);
            const discountPercent = Number(form.discount_percent || 0);
            const oldPrice = product.old_price || product.price;
            const newPrice = discountPercent > 0
              ? oldPrice - (oldPrice * discountPercent) / 100
              : oldPrice;

            return productService.updateProduct(p.id, {
              campaign_id: campaignId,
              campaign_name: campaign.name,
              discount_percent: discountPercent || null,
              old_price: discountPercent > 0 ? oldPrice : null,
              price: newPrice,
            });
          } else if (isAssigned) {
            return productService.updateProduct(p.id, {
              campaign_id: null,
              campaign_name: null,
              discount_percent: null,
              old_price: p.old_price || p.price,
              price: p.old_price || p.price,
            });
          }

          return Promise.resolve();
        })
      );

      closeModal();

      // Refresh campaigns
      const updatedCampaigns = await campaignService.getCampaignsByStore(user);
      setCampaigns(updatedCampaigns || []);
    } catch (err) {
      console.error("❌ Campaign save failed:", err);
      alert(err.message || "Failed to save campaign.");
    }
  };

  // ===============================
  // Delete campaign
  // ===============================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this campaign?")) return;
    try {
      await campaignService.deleteCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      alert("✅ Campaign deleted!");
    } catch (err) {
      console.error("❌ Delete failed:", err);
      alert(err.message || "Failed to delete campaign.");
    }
  };

  // ===============================
  // Skeleton loader
  // ===============================
  const SkeletonCard = () => (
    <div className="animate-pulse border rounded-lg p-4 h-48 bg-gray-200" />
  );

  // ===============================
  // Render UI
  // ===============================
  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">My Campaigns</h2>
          <p className="text-gray-600 text-sm">Manage your store campaigns</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/seller/dashboard")}
            className="bg-gray-200 text-gray-800 px-3 py-1 rounded shadow hover:bg-gray-300 transition"
          >
            ← Back to Dashboard
          </button>
          <button
            onClick={() => openModal()}
            className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition"
          >
            + Add Campaign
          </button>
        </div>
      </div>

      {/* Loading/Error */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}
      {error && <p className="text-red-600">{error}</p>}

      {/* Campaign List */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              onEdit={openModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-4">
              {editingCampaign ? "Edit Campaign" : "Add Campaign"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                name="name"
                placeholder="Campaign Name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2"
              />

              <textarea
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />

              {/* Image Upload with progress */}
              <ImageUpload
                label="Campaign Banner"
                url={form.banner_url}
                onUrlChange={(url) =>
                  setForm((prev) => ({ ...prev, banner_url: DOMPurify.sanitize(url) }))
                }
                fullWidth
                type="product"
              />

              <input
                type="number"
                name="discount_percent"
                placeholder="Discount %"
                value={form.discount_percent}
                onChange={handleChange}
                min="0"
                max="99"
                className="w-full border rounded px-3 py-2"
              />

              <div className="flex gap-2">
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date?.split("T")[0] || ""}
                  onChange={handleChange}
                  required
                  className="w-1/2 border rounded px-3 py-2"
                />
                <input
                  type="date"
                  name="end_date"
                  value={form.end_date?.split("T")[0] || ""}
                  onChange={handleChange}
                  required
                  className="w-1/2 border rounded px-3 py-2"
                />
              </div>

              {/* Product Selection */}
              <div className="border rounded p-3 max-h-40 overflow-y-auto">
                <p className="text-sm font-medium mb-2 text-gray-600">
                  Select Products:
                </p>
                {products.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 text-sm mb-1"
                  >
                    <input
                      type="checkbox"
                      checked={form.selectedProducts.includes(p.id)}
                      onChange={() => toggleProductSelection(p.id)}
                    />
                    {p.name} – ₦{p.price.toFixed(2)}
                  </label>
                ))}
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  className="rounded"
                />
                Active
              </label>

              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition w-full"
              >
                {editingCampaign ? "Update Campaign" : "Add Campaign"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

