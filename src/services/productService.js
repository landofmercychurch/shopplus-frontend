// src/services/productService.js
import { fetchWithAuth, getUser } from './authService';

export const productService = {
  // -------------------------------
  // GET SELLER STORE
  // -------------------------------
  getStore: async () => {
    console.log("🏪 getStore called");

    const user = getUser();
    console.log("👤 Current user:", user);

    if (!user?.id) throw new Error("User not logged in");

    try {
      const store = await fetchWithAuth(`/seller/stores/user/${user.id}`, "GET");
      console.log("✅ Store fetched:", store);
      return store;
    } catch (err) {
      console.error("❌ getStore error:", err);
      throw err;
    }
  },

  // -------------------------------
  // CREATE PRODUCT
  // -------------------------------
  createProduct: async (payload) => {
    console.log("🚀 createProduct called with payload:", payload);

    try {
      const res = await fetchWithAuth(`/products`, "POST", payload);
      console.log("✅ Product created:", res);
      return res;
    } catch (err) {
      console.error("❌ createProduct error:", err);
      throw err;
    }
  },

  // -------------------------------
  // UPDATE PRODUCT
  // -------------------------------
  updateProduct: async (productId, payload) => {
    console.log("🔄 updateProduct called:", productId, payload);

    if (!productId) throw new Error("productId is required");

    try {
      const res = await fetchWithAuth(`/products/${productId}`, "PUT", payload);
      console.log("✅ Product updated:", res);
      return res;
    } catch (err) {
      console.error("❌ updateProduct error:", err);
      throw err;
    }
  },

  // -------------------------------
  // DELETE PRODUCT
  // -------------------------------
  deleteProduct: async (productId) => {
    console.log("🗑 deleteProduct called for ID:", productId);

    if (!productId) throw new Error("productId is required");

    try {
      const res = await fetchWithAuth(`/products/${productId}`, "DELETE");
      console.log("✅ Product deleted:", productId, res);
      return res;
    } catch (err) {
      console.error("❌ deleteProduct error:", err);
      throw err;
    }
  },

  // -------------------------------
  // GET SINGLE PRODUCT
  // -------------------------------
  getProduct: async (productId) => {
    console.log("🔍 getProduct called for ID:", productId);

    if (!productId) throw new Error("productId is required");

    try {
      const res = await fetchWithAuth(`/products/${productId}`, "GET");
      console.log("✅ Product fetched:", res);
      return res;
    } catch (err) {
      console.error("❌ getProduct error:", err);
      throw err;
    }
  },

  // -------------------------------
  // GET SELLER PRODUCTS BY STORE
  // -------------------------------
  getProductsByStore: async () => {
    console.log("📦 getProductsByStore called");

    const store = await productService.getStore();
    console.log("🏪 Store fetched for getProductsByStore:", store);

    if (!store?.id) throw new Error("Seller store not found.");

    try {
      const res = await fetchWithAuth(`/products/store/${store.id}`, "GET");
      console.log("✅ Products fetched:", res);
      return res;
    } catch (err) {
      console.error("❌ getProductsByStore error:", err);
      throw err;
    }
  },

  // -------------------------------
  // PUBLIC SEARCH
  // -------------------------------
  searchProducts: async (query) => {
    if (!query) throw new Error("Search query is required");
    try {
      const res = await fetchWithAuth(`/products/search?query=${encodeURIComponent(query)}`, "GET");
      return res;
    } catch (err) {
      console.error("❌ searchProducts error:", err);
      throw err;
    }
  },

  // -------------------------------
  // PUBLIC CATEGORY FILTER
  // -------------------------------
  getProductsByCategory: async (category) => {
    if (!category) throw new Error("Category is required");
    try {
      const res = await fetchWithAuth(`/products/category/${encodeURIComponent(category)}`, "GET");
      return res;
    } catch (err) {
      console.error("❌ getProductsByCategory error:", err);
      throw err;
    }
  },
};

