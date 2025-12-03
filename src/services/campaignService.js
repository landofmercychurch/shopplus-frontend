// src/services/campaignService.js
import { fetchWithAuth, getUser } from './sellerAuthService';

export const campaignService = {
  // -------------------------------
  // Get the store of the current seller
  // -------------------------------
  getStore: async () => {
    console.log("🏪 [Campaign] getStore called");

    const user = getUser();
    if (!user?.id) throw new Error("User not logged in");

    try {
      const store = await fetchWithAuth(`/seller/stores/user/${user.id}`, "GET");
      console.log("✅ [Campaign] Store fetched:", store);

      if (!store?.id) throw new Error("No store found. Please create your store first.");

      return store;
    } catch (err) {
      console.error("❌ [Campaign] getStore error:", err);
      throw err;
    }
  },

  // -------------------------------
  // Get all campaigns for the current store
  // -------------------------------
  getCampaignsByStore: async () => {
    console.log("📢 [Campaign] getCampaignsByStore called");

    try {
      const store = await campaignService.getStore();
      const campaigns = await fetchWithAuth(`/campaigns/store/${store.id}`, "GET");
      console.log("✅ Campaigns fetched:", campaigns);
      return campaigns;
    } catch (err) {
      console.error("❌ [Campaign] getCampaignsByStore error:", err);
      throw err;
    }
  },

  // -------------------------------
  // Get a single campaign by ID
  // -------------------------------
  getCampaignById: async (id) => {
    if (!id) throw new Error("Campaign ID is required");
    console.log("🔍 [Campaign] getCampaignById:", id);

    try {
      const campaign = await fetchWithAuth(`/campaigns/${id}`, "GET");
      console.log("✅ Campaign fetched:", campaign);
      return campaign;
    } catch (err) {
      console.error("❌ [Campaign] getCampaignById error:", err);
      throw err;
    }
  },

  // -------------------------------
  // Create a new campaign
  // -------------------------------
  createCampaign: async (payload) => {
    console.log("➕ [Campaign] createCampaign:", payload);

    try {
      const store = await campaignService.getStore();
      const res = await fetchWithAuth(`/campaigns`, "POST", { ...payload, store_id: store.id });
      console.log("✅ Campaign created:", res);
      return res;
    } catch (err) {
      console.error("❌ [Campaign] createCampaign error:", err);
      throw err;
    }
  },

  // -------------------------------
  // Update an existing campaign
  // -------------------------------
  updateCampaign: async (id, payload) => {
    if (!id) throw new Error("Campaign ID is required");
    console.log("🔄 [Campaign] updateCampaign:", id, payload);

    try {
      const res = await fetchWithAuth(`/campaigns/${id}`, "PUT", payload);
      console.log("✅ Campaign updated:", res);
      return res;
    } catch (err) {
      console.error("❌ [Campaign] updateCampaign error:", err);
      throw err;
    }
  },

  // -------------------------------
  // Delete a campaign
  // -------------------------------
  deleteCampaign: async (id) => {
    if (!id) throw new Error("Campaign ID is required");
    console.log("🗑 [Campaign] deleteCampaign:", id);

    try {
      const res = await fetchWithAuth(`/campaigns/${id}`, "DELETE");
      console.log("✅ Campaign deleted:", id, res);
      return res;
    } catch (err) {
      console.error("❌ [Campaign] deleteCampaign error:", err);
      throw err;
    }
  },
};

