import React, { useRef } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

export const CampaignCard = ({ campaign, onEdit, onDelete, onUpload }) => {
  const { user } = useAuth(); // get current user info
  const fileInputRef = useRef();

  if (!campaign) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date)) return "Invalid date";

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Fallback: allow edit if store_owner_id is missing
  const canEdit = campaign.store_owner_id ? user?.id === campaign.store_owner_id : true;

  const handleDelete = () => {
    if (!campaign?.id) return;

    if (!canEdit) return alert("You are not authorized to delete this campaign.");
    if (window.confirm("Are you sure you want to delete this campaign?")) {
      onDelete(campaign.id);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!canEdit) return alert("You are not authorized to upload banner for this campaign.");
    onUpload(campaign.id, file);
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition relative bg-white">
      {/* Discount Badge */}
      {campaign?.discount_percent > 0 && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
          {campaign.discount_percent}% OFF
        </div>
      )}

      {/* Banner Image */}
<div className="w-full h-32 bg-gray-200 rounded-md flex items-center justify-center mb-3 overflow-hidden">
  <img
    src={campaign?.banner_url || "/default-campaigns-banner.png"} // use your public folder placeholder
    alt="Banner"
    className="w-full h-full object-cover"
  />
</div>


      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Campaign Info */}
      <h3 className="font-bold text-lg text-gray-800 truncate">
        {campaign?.name || "Untitled Campaign"}
      </h3>

      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
        {campaign?.description || "No description available"}
      </p>

      <p className="text-sm text-gray-500 leading-5">
        <span className="font-semibold text-gray-700">Active:</span>{" "}
        {campaign?.is_active ? "Yes" : "No"}
        <br />
        {formatDate(campaign?.start_date)} - {formatDate(campaign?.end_date)}
      </p>

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => onEdit(campaign)}
          className={`px-3 py-1 rounded text-sm transition ${
            canEdit
              ? "bg-yellow-500 text-white hover:bg-yellow-600"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          Edit
        </button>

        <button
          onClick={handleDelete}
          className={`px-3 py-1 rounded text-sm transition ${
            canEdit
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

