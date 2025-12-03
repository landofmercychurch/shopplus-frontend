import React from "react";
import DOMPurify from "dompurify";

export default function CampaignCard({ campaign, loading }) {
  if (loading) {
    return (
      <div className="bg-gray-200 animate-pulse rounded-xl h-48 w-full sm:w-64 md:w-72" />
    );
  }

  if (!campaign) {
    return (
      <div className="bg-gray-100 rounded-xl h-48 w-full sm:w-64 md:w-72 flex items-center justify-center text-gray-500">
        No Campaign
      </div>
    );
  }

  const discount = Number(campaign.discount_percent) || 0;

  const safeName = DOMPurify.sanitize(campaign.name || "Unnamed Campaign");
  const safeUrl = DOMPurify.sanitize(campaign.banner_url || "/default-campaigns-banner.png");

  return (
    <div className="relative w-full sm:w-64 md:w-72 overflow-hidden rounded-xl cursor-pointer group">
      {/* Banner */}
      <img
        src={safeUrl}
        alt={safeName}
        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 flex flex-col">
        <h3 className="text-white font-bold text-base md:text-lg truncate">
          {safeName}
        </h3>

        {discount > 0 && (
          <span className="text-yellow-400 font-semibold text-sm md:text-base mt-1">
            {discount}% OFF
          </span>
        )}
      </div>
    </div>
  );
}

