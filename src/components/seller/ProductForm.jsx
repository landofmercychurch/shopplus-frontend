import React, { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { useSellerAuth } from "../../context/SellerAuthContext";
import ImageUpload from "../../components/ImageUpload"; // <-- ensure correct path

export const ProductForm = ({ onSubmit, product = {}, disabled = false }) => {
  const { user } = useSellerAuth(); // get current user info
  const [form, setForm] = useState({
    name: product.name || "",
    description: product.description || "",
    category: product.category || "",
    price: product.price ?? "",
    stock: product.stock ?? "",
    image_url: product.image_url || "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // update form if product prop changes
    setForm({
      name: product.name || "",
      description: product.description || "",
      category: product.category || "",
      price: product.price ?? "",
      stock: product.stock ?? "",
      image_url: product.image_url || "",
    });
  }, [product]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Validate before submit
  const validateForm = () => {
    if (!form.name.trim()) return "Please provide a product name.";
    if (!form.category.trim()) return "Please provide a category.";

    const parsedPrice = parseFloat(form.price);
    if (isNaN(parsedPrice) || parsedPrice < 0)
      return "Please provide a valid price.";

    const parsedStock = parseInt(form.stock, 10);
    if (isNaN(parsedStock) || parsedStock < 0)
      return "Please provide a valid stock quantity.";

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled || submitting) return;

    const error = validateForm();
    if (error) return alert(error);

    // sanitize inputs before sending
    const payload = {
      name: DOMPurify.sanitize(form.name.trim()),
      description: DOMPurify.sanitize(form.description.trim() || ""),
      category: DOMPurify.sanitize(form.category.trim()),
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
      image_url: DOMPurify.sanitize(form.image_url.trim() || ""),
    };

    try {
      setSubmitting(true);
      await onSubmit(payload);
    } catch (err) {
      alert(err.message || "Something went wrong while saving the product.");
      console.error("❌ Product submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white p-5 rounded-xl shadow-sm border border-gray-200"
    >
      {/* IMAGE UPLOAD FIELD ADDED HERE */}
      <ImageUpload
        label="Product Image"
        url={form.image_url}
        onUrlChange={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
        type="product"
        fullWidth={true}
      />

      {/* NAME */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product Name
        </label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          disabled={disabled || submitting || user?.role !== "seller"}
          placeholder="Enter product name"
          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-400"
        />
      </div>

      {/* DESCRIPTION */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          disabled={disabled || submitting || user?.role !== "seller"}
          placeholder="Enter product description"
          className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-green-400"
          rows={3}
        />
      </div>

      {/* CATEGORY */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <input
          type="text"
          name="category"
          value={form.category}
          onChange={handleChange}
          disabled={disabled || submitting || user?.role !== "seller"}
          placeholder="e.g. Electronics, Clothing..."
          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-400"
        />
      </div>

      {/* PRICE & STOCK */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price
          </label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            min="0"
            step="0.01"
            disabled={disabled || submitting || user?.role !== "seller"}
            placeholder="₦0.00"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock
          </label>
          <input
            type="number"
            name="stock"
            value={form.stock}
            onChange={handleChange}
            min="0"
            step="1"
            disabled={disabled || submitting || user?.role !== "seller"}
            placeholder="Available quantity"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-400"
          />
        </div>
      </div>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={disabled || submitting || user?.role !== "seller"}
        className={`w-full text-white px-4 py-2 rounded transition ${
          submitting
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {submitting
          ? "Saving..."
          : product?.id
          ? "Update Product"
          : "Add Product"}
      </button>
    </form>
  );
};

